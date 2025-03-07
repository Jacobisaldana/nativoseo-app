from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from database import get_db
from schemas import UserCreate, UserResponse, Token, MessageResponse, TokenCreate
from models import User, OauthToken
from auth.users import (
    create_user, get_user_by_email, authenticate_user, create_access_token,
    get_current_active_user, ACCESS_TOKEN_EXPIRE_MINUTES
)
from auth.oauth import get_auth_url, get_credentials_from_code, get_tokens_from_credentials
import crud

router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)

flow_storage = {}

@router.post("/register", response_model=UserResponse)
async def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    # Comprobar si el correo electrónico ya está en uso
    existing_user = get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo electrónico ya está registrado"
        )
    
    # Crear nuevo usuario
    user = create_user(db, user_data.username, user_data.email, user_data.password)
    return user

@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/login")
async def login():
    # Ruta estándar que requiere autenticación
    auth_url, state, flow = get_auth_url(redirect_uri="http://api.nativoseo.com/auth/callback")
    flow_storage[state] = flow
    return {"auth_url": auth_url}

@router.get("/login-test")
async def login_test():
    # Ruta alternativa para pruebas sin requerir autenticación previa
    auth_url, state, flow = get_auth_url(redirect_uri="http://api.nativoseo.com/auth/callback-test")
    flow_storage[state] = flow
    return {"auth_url": auth_url}

@router.get("/callback")
async def callback(code: str, state: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if state not in flow_storage:
        raise HTTPException(status_code=400, detail="Estado inválido")
    
    flow = flow_storage.pop(state)
    try:
        credentials = get_credentials_from_code(code, flow)
        tokens = get_tokens_from_credentials(credentials)
        
        # Almacenar token en la base de datos
        token_data = TokenCreate(
            user_id=current_user.id,
            access_token=tokens["access_token"],
            refresh_token=tokens["refresh_token"],
            token_type="Bearer",
            expires_at=datetime.strptime(tokens["expires_in"], "%Y-%m-%d %H:%M:%S.%f") if "expires_in" in tokens and tokens["expires_in"] not in ["None", None] else None,
            scopes=",".join(credentials.scopes),
            client_id=credentials.client_id,
            client_secret=credentials.client_secret
        )
        
        # Verificar si ya existe un token para este usuario
        existing_token = crud.get_oauth_token_by_user_id(db, current_user.id)
        if existing_token:
            crud.update_oauth_token(db, existing_token.id, token_data)
        else:
            crud.create_oauth_token(db, token_data)
            
        return {"message": "Autenticación exitosa", "tokens": tokens}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener tokens: {str(e)}")

# Ruta alternativa para pruebas sin autenticación previa
@router.get("/callback-test")
async def callback_test(code: str, state: str, db: Session = Depends(get_db)):
    if state not in flow_storage:
        raise HTTPException(status_code=400, detail="Estado inválido")
    
    flow = flow_storage.pop(state)
    try:
        credentials = get_credentials_from_code(code, flow)
        tokens = get_tokens_from_credentials(credentials)
        
        # Para pruebas, también guardar en la variable global del app principal
        from main import save_token_global
        save_token_global(tokens["access_token"], tokens["refresh_token"])
        
        # Redirigir al frontend con los tokens (esto permitirá conectar con la página de conexión exitosa)
        redirect_url = f"http://nativoseo.com/connect-google?access_token={tokens['access_token']}&refresh_token={tokens['refresh_token']}"
        return RedirectResponse(url=redirect_url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener tokens: {str(e)}")

@router.get("/me", response_model=UserResponse)
async def get_user_me(current_user: User = Depends(get_current_active_user)):
    return current_user
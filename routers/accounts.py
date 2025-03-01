from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from google.oauth2.credentials import Credentials

from database import get_db
from auth.users import get_current_active_user
from schemas import GoogleAccountCreate, GoogleAccountResponse, LocationCreate, LocationResponse
from models import User, OauthToken
from auth.accounts import list_accounts
from auth.locations import list_locations
from auth.oauth import get_credentials_from_db
import crud

router = APIRouter(
    prefix="/accounts",
    tags=["accounts"]
)

def get_credentials_for_user(db: Session, user: User) -> Credentials:
    oauth_token = db.query(OauthToken).filter(OauthToken.user_id == user.id).first()
    if not oauth_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No hay token OAuth para este usuario. Por favor autentíquese con Google."
        )
    
    credentials = get_credentials_from_db(oauth_token)
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Error al recuperar credenciales. Por favor autentíquese nuevamente."
        )
    
    return credentials

@router.get("/", response_model=List[GoogleAccountResponse])
async def get_accounts(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    # Obtener credenciales
    credentials = get_credentials_for_user(db, current_user)
    
    # Buscar cuentas en la base de datos primero
    db_accounts = crud.get_google_accounts_by_user_id(db, current_user.id)
    
    # Si no hay cuentas en la base de datos, consultar a la API de Google
    if not db_accounts:
        try:
            # Consultar API de Google
            google_accounts = list_accounts(credentials)
            
            # Guardar cuentas en la base de datos
            for account in google_accounts:
                account_data = GoogleAccountCreate(
                    user_id=current_user.id,
                    account_id=account["name"].split('/')[-1],
                    account_name=account["accountName"],
                    account_type=account.get("type", ""),
                    account_role=account.get("role", "")
                )
                crud.create_google_account(db, account_data)
            
            # Volver a obtener las cuentas de la base de datos
            db_accounts = crud.get_google_accounts_by_user_id(db, current_user.id)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al obtener cuentas de Google: {str(e)}"
            )
    
    return db_accounts

@router.get("/{account_id}/locations", response_model=List[LocationResponse])
async def get_locations(
    account_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Verificar si la cuenta existe en la base de datos
    db_account = crud.get_google_account(db, account_id, current_user.id)
    if not db_account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cuenta con ID {account_id} no encontrada"
        )
    
    # Buscar ubicaciones en la base de datos primero
    db_locations = crud.get_locations_by_google_account_id(db, db_account.id)
    
    # Si no hay ubicaciones en la base de datos, consultar a la API de Google
    if not db_locations:
        try:
            # Obtener credenciales
            credentials = get_credentials_for_user(db, current_user)
            
            # Consultar API de Google
            google_locations = list_locations(credentials, account_id)
            
            # Guardar ubicaciones en la base de datos
            for location in google_locations:
                location_data = LocationCreate(
                    google_account_id=db_account.id,
                    location_id=location["name"].split('/')[-1],
                    location_name=location.get("title", ""),
                    address=location.get("storefrontAddress", {}).get("formattedAddress", ""),
                    phone_number=location.get("phoneNumbers", {}).get("primaryPhone", ""),
                    website=location.get("websiteUri", ""),
                    business_status=location.get("businessStatus", "")
                )
                crud.create_location(db, location_data)
            
            # Volver a obtener las ubicaciones de la base de datos
            db_locations = crud.get_locations_by_google_account_id(db, db_account.id)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al obtener ubicaciones de Google: {str(e)}"
            )
    
    return db_locations
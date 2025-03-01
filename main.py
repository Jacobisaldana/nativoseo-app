# main.py
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from fastapi.responses import JSONResponse, RedirectResponse
from google.oauth2.credentials import Credentials

from database import engine, Base, get_db
from models import User, OauthToken
from routers import auth, accounts
from auth.accounts import list_accounts
from auth.locations import list_locations
import os
import json

# Token global para pruebas
global_token = None

def save_token_global(access_token, refresh_token):
    """Función que puede ser importada por otros módulos para guardar el token global"""
    global global_token
    global_token = {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_uri": "https://oauth2.googleapis.com/token",
        "client_id": os.getenv("GOOGLE_CLIENT_ID"),
        "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
        "scopes": ["https://www.googleapis.com/auth/business.manage"]
    }

# Crear tablas en la base de datos
Base.metadata.create_all(bind=engine)

app = FastAPI(title="NativoSEO API", 
              description="API para gestionar perfiles de Google Business",
              version="0.1.0")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permitir todos los orígenes en desarrollo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(auth.router)
app.include_router(accounts.router)

@app.get("/")
async def root():
    return {"message": "NativoSEO Backend con FastAPI y Base de Datos"}

# Rutas simplificadas para pruebas directas
@app.get("/save-token")
async def save_token(access_token: str, refresh_token: str):
    global global_token
    global_token = {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_uri": "https://oauth2.googleapis.com/token",
        "client_id": os.getenv("GOOGLE_CLIENT_ID"),
        "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
        "scopes": ["https://www.googleapis.com/auth/business.manage"]
    }
    return {"message": "Token guardado para pruebas"}

@app.get("/test-accounts")
async def test_accounts():
    global global_token
    if not global_token:
        raise HTTPException(status_code=401, detail="No token guardado. Usa /save-token primero")
    
    try:
        credentials = Credentials(
            token=global_token["access_token"],
            refresh_token=global_token["refresh_token"],
            token_uri=global_token["token_uri"],
            client_id=global_token["client_id"],
            client_secret=global_token["client_secret"],
            scopes=global_token["scopes"]
        )
        
        accounts = list_accounts(credentials)
        return {"accounts": accounts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/test-locations/{account_id}")
async def test_locations(account_id: str):
    global global_token
    if not global_token:
        raise HTTPException(status_code=401, detail="No token guardado. Usa /save-token primero")
    
    try:
        credentials = Credentials(
            token=global_token["access_token"],
            refresh_token=global_token["refresh_token"],
            token_uri=global_token["token_uri"],
            client_id=global_token["client_id"],
            client_secret=global_token["client_secret"],
            scopes=global_token["scopes"]
        )
        
        locations = list_locations(credentials, account_id)
        return {"locations": locations}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
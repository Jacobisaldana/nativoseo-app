# main.py
from fastapi import FastAPI, HTTPException
from fastapi.responses import RedirectResponse, JSONResponse
from auth.oauth import get_auth_url, get_credentials_from_code, get_tokens_from_credentials
from auth.accounts import list_accounts
from auth.locations import list_locations
from api.reviews import list_reviews, reply_to_review
from api.posts import create_local_post, upload_media
from google.oauth2.credentials import Credentials
import os
import json
from googleapiclient.errors import HttpError

app = FastAPI()

TOKEN_FILE = "token.json"
flow_storage = {}
credentials_storage = None

def load_credentials():
    """Carga las credenciales desde el archivo si existe."""
    global credentials_storage
    if os.path.exists(TOKEN_FILE):
        try:
            with open(TOKEN_FILE, "r") as f:
                token_data = json.load(f)
                credentials_storage = Credentials(
                    token=token_data["access_token"],
                    refresh_token=token_data["refresh_token"],
                    client_id=token_data["client_id"],
                    client_secret=token_data["client_secret"],
                    token_uri="https://oauth2.googleapis.com/token",
                    scopes=token_data["scopes"]
                )
                print(f"Credenciales cargadas: token={credentials_storage.token[:10]}..., valid={credentials_storage.valid}")
        except Exception as e:
            print(f"Error al cargar credenciales: {str(e)}")
    return credentials_storage

def save_credentials(credentials: Credentials):
    """Guarda las credenciales en un archivo."""
    token_data = {
        "access_token": credentials.token,
        "refresh_token": credentials.refresh_token,
        "client_id": credentials.client_id,
        "client_secret": credentials.client_secret,
        "scopes": credentials.scopes
    }
    with open(TOKEN_FILE, "w") as f:
        json.dump(token_data, f)
    print(f"Credenciales guardadas: token={credentials.token[:10]}...")

credentials_storage = load_credentials()

@app.get("/auth/login")
async def login():
    auth_url, state, flow = get_auth_url()
    flow_storage[state] = flow
    return RedirectResponse(url=auth_url)

@app.get("/auth/callback")
async def callback(code: str, state: str):
    if state not in flow_storage:
        raise HTTPException(status_code=400, detail="Estado inválido")
    flow = flow_storage.pop(state)
    try:
        global credentials_storage
        credentials_storage = get_credentials_from_code(code, flow)
        save_credentials(credentials_storage)
        tokens = get_tokens_from_credentials(credentials_storage)
        return JSONResponse(content={"message": "Autenticación exitosa", "tokens": tokens})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener tokens: {str(e)}")

@app.get("/accounts")
async def get_accounts():
    if not credentials_storage:
        raise HTTPException(status_code=401, detail="No autenticado. Usa /auth/login primero.")
    try:
        accounts = list_accounts(credentials_storage)
        return JSONResponse(content={"accounts": accounts})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/accounts/{account_id}/locations")
async def get_locations(account_id: str):
    if not credentials_storage:
        raise HTTPException(status_code=401, detail="No autenticado. Usa /auth/login primero.")
    try:
        locations = list_locations(credentials_storage, account_id)
        return JSONResponse(content={"locations": locations})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/accounts/{account_id}/locations/{location_id}/reviews")
async def get_reviews(account_id: str, location_id: str, page_size: int = 20, page_token: str = None):
    if not credentials_storage:
        raise HTTPException(status_code=401, detail="No autenticado. Usa /auth/login primero.")
    try:
        result = list_reviews(credentials_storage, account_id, location_id, page_size, page_token)
        return JSONResponse(content=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/accounts/{account_id}/locations/{location_id}/reviews/{review_id}/reply")
async def reply_review(account_id: str, location_id: str, review_id: str, reply_text: str):
    if not credentials_storage:
        raise HTTPException(status_code=401, detail="No autenticado. Usa /auth/login primero.")
    try:
        response = reply_to_review(credentials_storage, account_id, location_id, review_id, reply_text)
        return JSONResponse(content={"message": "Reseña respondida", "reply": response})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Solo las rutas cambiadas
@app.post("/accounts/{account_id}/locations/{location_id}/localPosts")
async def create_post(account_id: str, location_id: str, summary: str, media_url: str = None):
    if not credentials_storage:
        raise HTTPException(status_code=401, detail="No autenticado. Usa /auth/login primero.")
    try:
        result = create_local_post(credentials_storage, account_id, location_id, summary, media_url)
        return JSONResponse(content={"message": "Publicación creada", "post": result})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/accounts/{account_id}/locations/{location_id}/media")
async def upload_photo(account_id: str, location_id: str, media_url: str, description: str = None):
    if not credentials_storage:
        raise HTTPException(status_code=401, detail="No autenticado. Usa /auth/login primero.")
    try:
        result = upload_media(credentials_storage, account_id, location_id, media_url, description)
        return JSONResponse(content={"message": "Foto subida", "media": result})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    return {"message": "Backend OAuth con FastAPI"}
# main.py
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from fastapi.responses import JSONResponse, RedirectResponse
from google.oauth2.credentials import Credentials

from database import engine, Base, get_db
from models import User, OauthToken, ActiveLocation, GoogleAccount, Location, Review, Post, MediaItem
from routers import auth, accounts, locations
from auth.accounts import list_accounts
from auth.locations import list_locations
from auth.users import get_current_user
from api.reviews import list_reviews as api_list_reviews, reply_to_review as api_reply_to_review
from api.posts import list_posts as api_list_posts, create_local_post as api_create_post
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
app.include_router(locations.router)

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

@app.get("/test-reviews")
async def test_reviews(account_id: str, location_id: str, page_size: int = 5, page_token: str = None, stats_only: bool = False):
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
        
        # Si solo queremos estadísticas, obtenemos datos agregados
        if stats_only:
            try:
                # Calcular estadísticas totales de la ubicación
                # En un entorno real, esto sería una llamada a una API específica para estadísticas
                # Por ahora, simularemos algunos datos
                
                # Intentamos obtener una reseña para verificar que la ubicación existe
                tmp_reviews = api_list_reviews(credentials, account_id, location_id, 1)
                
                # Si llegamos aquí, la ubicación existe, devolvemos estadísticas
                if not account_id.startswith("accounts/"):
                    account_id = f"accounts/{account_id}"
                if not location_id.startswith("locations/"):
                    location_id = f"locations/{location_id}"
                
                url = f"https://mybusiness.googleapis.com/v4/{account_id}/{location_id}"
                headers = {
                    "Authorization": f"Bearer {credentials.token}"
                }
                
                import requests
                location_response = requests.get(url, headers=headers)
                location_response.raise_for_status()
                location_data = location_response.json()
                
                return {
                    "totalReviewCount": location_data.get("metadata", {}).get("reviewCount", 0),
                    "averageRating": location_data.get("metadata", {}).get("averageRating", 0),
                    "pendingReviews": location_data.get("metadata", {}).get("newReviewCount", 0)
                }
            except Exception as stats_error:
                print(f"Error al obtener estadísticas: {str(stats_error)}")
                # Si falla, devolvemos datos estimados
                return {
                    "totalReviewCount": 0,
                    "averageRating": 0,
                    "pendingReviews": 0,
                    "error": str(stats_error)
                }
        
        # Flujo normal para obtener reseñas
        # Limitar el tamaño máximo de página para evitar timeouts
        if page_size > 5:
            page_size = 5
            
        reviews = api_list_reviews(credentials, account_id, location_id, page_size, page_token)
        return reviews
    except Exception as e:
        print(f"Error al obtener reseñas: {str(e)}")
        # Si ocurre un error, devolver una lista vacía y un mensaje de error
        return {
            "reviews": [],
            "nextPageToken": None,
            "error": str(e)
        }

@app.post("/test-reviews/reply")
async def test_reply_review(account_id: str, location_id: str, review_id: str, reply_text: str):
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
        
        result = api_reply_to_review(credentials, account_id, location_id, review_id, reply_text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/test-posts")
async def test_list_posts(account_id: str, location_id: str, page_size: int = 10, page_token: str = None):
    global global_token
    if not global_token:
        raise HTTPException(status_code=401, detail="No token guardado. Usa /save-token primero")
    
    print(f"MAIN: Recibida petición para listar posts con account_id={account_id}, location_id={location_id}")
    
    try:
        credentials = Credentials(
            token=global_token["access_token"],
            refresh_token=global_token["refresh_token"],
            token_uri=global_token["token_uri"],
            client_id=global_token["client_id"],
            client_secret=global_token["client_secret"],
            scopes=global_token["scopes"]
        )
        
        # Limitar el tamaño máximo de página para evitar timeouts
        if page_size > 10:
            page_size = 10
        
        print(f"MAIN: Invocando api_list_posts con account_id={account_id}, location_id={location_id}")
        posts_data = api_list_posts(credentials, account_id, location_id, page_size, page_token)
        
        if posts_data and "localPosts" in posts_data:
            post_count = len(posts_data["localPosts"])
            print(f"MAIN: Se encontraron {post_count} publicaciones")
        else:
            print("MAIN: No se encontraron publicaciones o la estructura de respuesta es incorrecta")
        
        return posts_data
    except Exception as e:
        error_msg = str(e)
        print(f"MAIN: Error al obtener publicaciones: {error_msg}")
        # Si ocurre un error, devolver una estructura básica con mensaje de error
        return {
            "localPosts": [],
            "nextPageToken": None,
            "lastPostDate": None,
            "daysSinceLastPost": None,
            "error": error_msg
        }

@app.get("/active-posts")
async def list_active_posts(
    page_size: int = 10, 
    page_token: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtiene los posts de todas las ubicaciones activas del usuario."""
    global global_token
    if not global_token:
        raise HTTPException(status_code=401, detail="No token guardado. Usa /save-token primero")
    
    # Buscar todas las ubicaciones activas del usuario
    active_locations = db.query(ActiveLocation).filter(
        ActiveLocation.user_id == current_user.id
    ).all()
    
    if not active_locations:
        return {
            "locations": [],
            "posts": []
        }
    
    credentials = Credentials(
        token=global_token["access_token"],
        refresh_token=global_token["refresh_token"],
        token_uri=global_token["token_uri"],
        client_id=global_token["client_id"],
        client_secret=global_token["client_secret"],
        scopes=global_token["scopes"]
    )
    
    # Obtener posts para cada ubicación activa
    all_posts = []
    location_info = []
    
    for loc in active_locations:
        try:
            print(f"Obteniendo posts para ubicación activa: {loc.location_id}")
            posts_data = api_list_posts(credentials, loc.account_id, loc.location_id, page_size)
            
            if posts_data and "localPosts" in posts_data:
                # Agregar la información de la ubicación a cada post
                for post in posts_data["localPosts"]:
                    post["locationInfo"] = {
                        "locationId": loc.location_id,
                        "accountId": loc.account_id,
                        "locationName": loc.location_name
                    }
                
                all_posts.extend(posts_data["localPosts"])
                
                # Guardar información relevante de la ubicación
                location_info.append({
                    "locationId": loc.location_id,
                    "accountId": loc.account_id,
                    "locationName": loc.location_name,
                    "daysSinceLastPost": posts_data.get("daysSinceLastPost"),
                    "postCount": len(posts_data["localPosts"])
                })
        except Exception as e:
            print(f"Error al obtener posts para ubicación {loc.location_id}: {str(e)}")
    
    # Ordenar posts por fecha (más recientes primero)
    all_posts.sort(key=lambda x: x.get("createTime", ""), reverse=True)
    
    return {
        "locations": location_info,
        "posts": all_posts[:page_size]  # Limitar al tamaño de página solicitado
    }

@app.post("/test-posts/create")
async def test_create_post(account_id: str, location_id: str, summary: str, media_url: str = None):
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
        
        result = api_create_post(credentials, account_id, location_id, summary, media_url)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/active-posts/create")
async def create_post_active_location(
    location_id: str,
    summary: str,
    media_url: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Crea un post en una ubicación activa específica."""
    global global_token
    if not global_token:
        raise HTTPException(status_code=401, detail="No token guardado. Usa /save-token primero")
    
    # Verificar que la ubicación está activa para este usuario
    active_location = db.query(ActiveLocation).filter(
        ActiveLocation.user_id == current_user.id,
        ActiveLocation.location_id == location_id
    ).first()
    
    if not active_location:
        raise HTTPException(
            status_code=404,
            detail="Esta ubicación no está activa para el usuario actual"
        )
    
    try:
        credentials = Credentials(
            token=global_token["access_token"],
            refresh_token=global_token["refresh_token"],
            token_uri=global_token["token_uri"],
            client_id=global_token["client_id"],
            client_secret=global_token["client_secret"],
            scopes=global_token["scopes"]
        )
        
        # Crear el post utilizando la API
        print(f"Creando post en ubicación activa: {location_id}, cuenta: {active_location.account_id}")
        result = api_create_post(credentials, active_location.account_id, location_id, summary, media_url)
        
        # Añadir información de la ubicación al resultado
        if result:
            result["locationInfo"] = {
                "locationId": active_location.location_id,
                "accountId": active_location.account_id,
                "locationName": active_location.location_name
            }
        
        return result
    except Exception as e:
        print(f"Error al crear post: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
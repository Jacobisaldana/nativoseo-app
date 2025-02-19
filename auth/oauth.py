# auth/oauth.py
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from dotenv import load_dotenv
import os

# Cargar variables de entorno
load_dotenv()
SCOPES = os.getenv("SCOPES").split(",")
CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
REDIRECT_URI = os.getenv("REDIRECT_URI")
CLIENT_SECRETS_FILE = "client_secret.json"

def get_auth_url():
    """Genera la URL de autorización y devuelve el flow y state."""
    flow = Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE,
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI
    )
    auth_url, state = flow.authorization_url(
        access_type="offline",
        prompt="consent"
    )
    return auth_url, state, flow

def get_credentials_from_code(code: str, flow: Flow):
    """Intercambia el código por credenciales."""
    flow.fetch_token(code=code)
    credentials = Credentials(
        token=flow.credentials.token,
        refresh_token=flow.credentials.refresh_token,
        client_id=CLIENT_ID,
        client_secret=CLIENT_SECRET,
        token_uri="https://oauth2.googleapis.com/token",
        scopes=SCOPES
    )
    return credentials

def get_tokens_from_credentials(credentials: Credentials):
    """Convierte credenciales en un diccionario de tokens."""
    return {
        "access_token": credentials.token,
        "refresh_token": credentials.refresh_token,
        "expires_in": str(credentials.expiry),
        "token_type": "Bearer"
    }
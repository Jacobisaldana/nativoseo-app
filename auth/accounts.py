# auth/accounts.py
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials

def list_accounts(credentials: Credentials):
    """Lista todas las cuentas asociadas al usuario autenticado."""
    try:
        service = build("mybusinessaccountmanagement", "v1", credentials=credentials)
        request = service.accounts().list()
        response = request.execute()
        return response.get("accounts", [])
    except Exception as e:
        raise Exception(f"Error al listar cuentas: {str(e)}")
# auth/locations.py
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials

def list_locations(credentials: Credentials, account_id: str):
    """Lista las ubicaciones de una cuenta específica."""
    try:
        # Asegurarse de que el account_id tenga el formato correcto
        if not account_id.startswith("accounts/"):
            account_id = f"accounts/{account_id}"
        service = build("mybusinessbusinessinformation", "v1", credentials=credentials)
        request = service.accounts().locations().list(
            parent=account_id,
            readMask="name,title,metadata"
        )
        response = request.execute()
        return response.get("locations", [])
    except Exception as e:
        raise Exception(f"Error al listar ubicaciones: {str(e)}")
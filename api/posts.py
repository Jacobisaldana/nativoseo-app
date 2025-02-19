# api/posts.py
import requests
from google.oauth2.credentials import Credentials

def create_local_post(credentials: Credentials, account_id: str, location_id: str, summary: str, media_url: str = None):
    """Crea una publicación (actualización) en una ubicación."""
    try:
        if not account_id.startswith("accounts/"):
            account_id = f"accounts/{account_id}"
        if not location_id.startswith("locations/"):
            location_id = f"locations/{location_id}"
        url = f"https://mybusiness.googleapis.com/v4/{account_id}/{location_id}/localPosts"
        headers = {
            "Authorization": f"Bearer {credentials.token}",
            "Content-Type": "application/json"
        }
        body = {
            "languageCode": "es",
            "summary": summary,
            "callToAction": {
                "actionType": "LEARN_MORE",
                "url": "https://atmosferadecoraciones.com/cortinas/"
            },
            "topicType": "STANDARD"
        }
        if media_url:
            body["media"] = [{
                "mediaFormat": "PHOTO",
                "sourceUrl": media_url
            }]
        print(f"Enviando solicitud a: {url} con body={body}")
        response = requests.post(url, headers=headers, json=body)
        response.raise_for_status()
        data = response.json()
        print(f"Respuesta recibida: {data}")
        return data
    except requests.exceptions.RequestException as e:
        raise Exception(f"Error HTTP al crear publicación: {str(e)}")
    except Exception as e:
        raise Exception(f"Error inesperado al crear publicación: {str(e)}")

def upload_media(credentials: Credentials, account_id: str, location_id: str, media_url: str, description: str = None):
    """Sube una foto a una ubicación."""
    try:
        if not account_id.startswith("accounts/"):
            account_id = f"accounts/{account_id}"
        if not location_id.startswith("locations/"):
            location_id = f"locations/{location_id}"
        url = f"https://mybusiness.googleapis.com/v4/{account_id}/{location_id}/media"
        headers = {
            "Authorization": f"Bearer {credentials.token}",
            "Content-Type": "application/json"
        }
        body = {
            "mediaFormat": "PHOTO",
            "sourceUrl": media_url,
            "locationAssociation": {
                "category": "INTERIOR"
            }
        }
        if description:
            body["description"] = description
        print(f"Enviando solicitud a: {url} con body={body}")
        response = requests.post(url, headers=headers, json=body)
        response.raise_for_status()
        data = response.json()
        print(f"Respuesta recibida: {data}")
        return data
    except requests.exceptions.RequestException as e:
        raise Exception(f"Error HTTP al subir foto: {str(e)}")
    except Exception as e:
        raise Exception(f"Error inesperado al subir foto: {str(e)}")
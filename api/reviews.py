# api/reviews.py
import requests
from google.oauth2.credentials import Credentials

def list_reviews(credentials: Credentials, account_id: str, location_id: str, page_size: int = 20, page_token: str = None):
    """Lista las reseñas de una ubicación específica con paginación."""
    try:
        if not account_id.startswith("accounts/"):
            account_id = f"accounts/{account_id}"
        if not location_id.startswith("locations/"):
            location_id = f"locations/{location_id}"
        url = f"https://mybusiness.googleapis.com/v4/{account_id}/{location_id}/reviews"
        headers = {
            "Authorization": f"Bearer {credentials.token}"
        }
        params = {
            "pageSize": page_size,
        }
        if page_token:
            params["pageToken"] = page_token
        
        print(f"Enviando solicitud a: {url} con params={params}")
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        data = response.json()
        print(f"Respuesta recibida: {data}")
        return {
            "reviews": data.get("reviews", []),
            "nextPageToken": data.get("nextPageToken", None)
        }
    except requests.exceptions.RequestException as e:
        raise Exception(f"Error HTTP al listar reseñas: {str(e)}")
    except Exception as e:
        raise Exception(f"Error inesperado al listar reseñas: {str(e)}")

def reply_to_review(credentials: Credentials, account_id: str, location_id: str, review_id: str, reply_text: str):
    """Responde a una reseña específica."""
    try:
        if not account_id.startswith("accounts/"):
            account_id = f"accounts/{account_id}"
        if not location_id.startswith("locations/"):
            location_id = f"locations/{location_id}"
        if not review_id.startswith("reviews/"):
            review_id = f"reviews/{review_id}"
        url = f"https://mybusiness.googleapis.com/v4/{account_id}/{location_id}/{review_id}/reply"
        headers = {
            "Authorization": f"Bearer {credentials.token}",
            "Content-Type": "application/json"
        }
        body = {"comment": reply_text}
        response = requests.put(url, headers=headers, json=body)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        raise Exception(f"Error HTTP al responder reseña: {str(e)}")
    except Exception as e:
        raise Exception(f"Error inesperado al responder reseña: {str(e)}")
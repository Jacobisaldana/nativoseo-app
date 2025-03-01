# api/posts.py
import requests
from google.oauth2.credentials import Credentials
from datetime import datetime
from typing import List, Optional, Dict, Any

def create_local_post(credentials: Credentials, account_id: str, location_id: str, summary: str, media_url: str = None, 
                 language_code: str = "es", topic_type: str = "STANDARD", 
                 cta_type: str = "LEARN_MORE", cta_url: str = "https://atmosferadecoraciones.com/cortinas/"):
    """
    Crea una publicación (actualización) en una ubicación con parámetros extendidos.
    
    Args:
        credentials: Credenciales de Google
        account_id: ID de la cuenta
        location_id: ID de la ubicación
        summary: Contenido de la publicación
        media_url: URL de la imagen (opcional)
        language_code: Código de idioma (por defecto "es")
        topic_type: Tipo de tema (STANDARD, EVENT, OFFER, PRODUCT)
        cta_type: Tipo de Call-to-Action (LEARN_MORE, BOOK, ORDER, SHOP, SIGN_UP, CALL)
        cta_url: URL del Call-to-Action
    """
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
        
        # Construir el objeto JSON para la solicitud
        body = {
            "languageCode": language_code,
            "summary": summary,
            "callToAction": {
                "actionType": cta_type,
                "url": cta_url
            },
            "topicType": topic_type
        }
        
        # Añadir imagen si se proporciona URL
        if media_url:
            body["media"] = [{
                "mediaFormat": "PHOTO",
                "sourceUrl": media_url
            }]
        
        print(f"Enviando solicitud a: {url}")
        print(f"Datos de la solicitud: {body}")
        
        response = requests.post(url, headers=headers, json=body)
        response.raise_for_status()
        data = response.json()
        
        print(f"Respuesta recibida: {data}")
        return data
    except requests.exceptions.RequestException as e:
        print(f"Error HTTP al crear publicación: {str(e)}")
        # Intentar obtener más detalles si es posible
        error_message = str(e)
        if hasattr(e, 'response') and e.response is not None:
            try:
                error_details = e.response.json()
                error_message = f"{error_message}: {error_details}"
            except:
                pass
        raise Exception(f"Error HTTP al crear publicación: {error_message}")
    except Exception as e:
        print(f"Error inesperado al crear publicación: {str(e)}")
        raise Exception(f"Error inesperado al crear publicación: {str(e)}")

def list_posts(credentials: Credentials, account_id: str, location_id: str, page_size: int = 10, page_token: str = None) -> Dict[str, Any]:
    """Lista las publicaciones de una ubicación específica."""
    try:
        if not account_id.startswith("accounts/"):
            account_id = f"accounts/{account_id}"
        if not location_id.startswith("locations/"):
            location_id = f"locations/{location_id}"
        
        url = f"https://mybusiness.googleapis.com/v4/{account_id}/{location_id}/localPosts"
        headers = {
            "Authorization": f"Bearer {credentials.token}"
        }
        params = {
            "pageSize": min(page_size, 20),  # Limitar a máximo 20 por página
        }
        if page_token:
            params["pageToken"] = page_token
        
        print(f"POSTS API: Enviando solicitud a: {url} con params={params}")
        response = requests.get(url, headers=headers, params=params, timeout=30)
        print(f"POSTS API: Código de respuesta: {response.status_code}")
        response.raise_for_status()
        data = response.json()
        print(f"POSTS API: Datos recibidos: {data.keys()}")
        
        # Registrar también el contenido completo para depuración
        if "localPosts" in data and data["localPosts"]:
            print(f"POSTS API: Ejemplo de post recibido: {data['localPosts'][0]}")
            # Verificar si hay imágenes en los posts
            for i, post in enumerate(data.get("localPosts", [])):
                if "media" in post and post["media"]:
                    print(f"POSTS API: Post {i} tiene media: {post['media']}")
        
        # Añadir información sobre días desde la última publicación
        posts = data.get("localPosts", [])
        last_post_date = None
        days_since_last_post = None
        
        if posts:
            # Ordenar posts por fecha (el más reciente primero)
            posts.sort(key=lambda x: x.get("createTime", ""), reverse=True)
            
            # Calcular días desde la última publicación
            if posts[0].get("createTime"):
                last_post_date = posts[0].get("createTime")
                # Formato esperado: "2023-05-15T14:30:45Z"
                try:
                    # Manejar diferentes formatos de fecha posibles
                    try:
                        # Formato con Z (UTC)
                        last_post_datetime = datetime.strptime(last_post_date, "%Y-%m-%dT%H:%M:%SZ")
                    except ValueError:
                        try:
                            # Formato con microsegundos y Z
                            last_post_datetime = datetime.strptime(last_post_date, "%Y-%m-%dT%H:%M:%S.%fZ")
                        except ValueError:
                            try:
                                # Formato con zona horaria explícita
                                if "+" in last_post_date:
                                    # Simplificar eliminando la parte de zona horaria
                                    simplified_date = last_post_date.split("+")[0]
                                    last_post_datetime = datetime.strptime(simplified_date, "%Y-%m-%dT%H:%M:%S")
                                else:
                                    # Otro formato posible
                                    last_post_datetime = datetime.strptime(last_post_date, "%Y-%m-%dT%H:%M:%S")
                            except ValueError:
                                print(f"No se pudo parsear la fecha: {last_post_date}")
                                raise
                    
                    days_since_last_post = (datetime.now() - last_post_datetime).days
                    
                    # Imprimir información de depuración
                    print(f"Última fecha de publicación: {last_post_date}")
                    print(f"Parseada como: {last_post_datetime}")
                    print(f"Días desde la última publicación: {days_since_last_post}")
                except (ValueError, TypeError):
                    days_since_last_post = None
        
        # Añadir esta información al resultado
        result = {
            "localPosts": posts,
            "nextPageToken": data.get("nextPageToken"),
            "lastPostDate": last_post_date,
            "daysSinceLastPost": days_since_last_post
        }
        
        print(f"POSTS API: Devolviendo {len(posts)} posts")
        return result
    except requests.exceptions.RequestException as e:
        print(f"Error al listar publicaciones: {str(e)}")
        raise Exception(f"Error HTTP al listar publicaciones: {str(e)}")
    except Exception as e:
        print(f"Error inesperado al listar publicaciones: {str(e)}")
        raise Exception(f"Error inesperado al listar publicaciones: {str(e)}")

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
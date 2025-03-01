from minio import Minio
from minio.error import S3Error
import os
import uuid
from datetime import timedelta

# MinIO client configuration
MINIO_ENDPOINT = "ssminiobackss.masvirtual.live"
MINIO_ACCESS_KEY = "sbwQJvwqWWm0iReJcRtF"
MINIO_SECRET_KEY = "r5ItGO7FXbv9dQ6d1lJQd3xzQyhRlfrfedWR6bbL"
MINIO_SECURE = True
MINIO_BUCKET = "temp-images"

# Initialize the MinIO client
minio_client = Minio(
    endpoint=MINIO_ENDPOINT,
    access_key=MINIO_ACCESS_KEY,
    secret_key=MINIO_SECRET_KEY,
    secure=MINIO_SECURE
)

def create_bucket_if_not_exists():
    """Create the bucket if it doesn't exist."""
    try:
        if not minio_client.bucket_exists(MINIO_BUCKET):
            minio_client.make_bucket(MINIO_BUCKET)
            print(f"Bucket '{MINIO_BUCKET}' created successfully")
        else:
            print(f"Bucket '{MINIO_BUCKET}' already exists")
    except S3Error as err:
        print(f"Error creating bucket: {err}")
        raise

def upload_file(file_data, content_type):
    """
    Upload a file to MinIO and return its URL.
    
    Args:
        file_data: The file data as bytes
        content_type: The MIME type of the file
        
    Returns:
        str: The URL of the uploaded file
    """
    try:
        # Generate a unique filename
        file_extension = content_type.split('/')[1] if '/' in content_type else 'jpg'
        object_name = f"{uuid.uuid4()}.{file_extension}"
        
        # Convert to BytesIO if necessary
        from io import BytesIO
        if not hasattr(file_data, 'read'):
            file_data_io = BytesIO(file_data)
            data_length = len(file_data)
        else:
            file_data_io = file_data
            # Seek to end to get length, then back to beginning
            file_data_io.seek(0, 2)
            data_length = file_data_io.tell()
            file_data_io.seek(0)
        
        # Upload the file
        minio_client.put_object(
            bucket_name=MINIO_BUCKET,
            object_name=object_name,
            data=file_data_io,
            length=data_length,
            content_type=content_type
        )
        
        # Generate a pre-signed URL that will expire in 24 hours
        url = minio_client.presigned_get_object(
            bucket_name=MINIO_BUCKET,
            object_name=object_name,
            expires=timedelta(hours=24)
        )
        
        return url
    except S3Error as err:
        print(f"Error uploading file: {err}")
        raise

# Create the bucket when the module is imported
create_bucket_if_not_exists()
from pydantic import BaseModel, Field
from typing_extensions import Annotated
from typing import Optional, List, Dict, Any
from datetime import datetime

# Schemas para Usuario
class UserBase(BaseModel):
    username: str
    email: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Schemas para OAuth Tokens
class TokenBase(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    expires_at: Optional[datetime] = None
    scopes: Optional[str] = None

class TokenCreate(TokenBase):
    user_id: int
    client_id: str
    client_secret: str

class TokenResponse(TokenBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Schemas para Google Accounts
class GoogleAccountBase(BaseModel):
    account_id: str
    account_name: str
    account_type: Optional[str] = None
    account_role: Optional[str] = None

class GoogleAccountCreate(GoogleAccountBase):
    user_id: int

class GoogleAccountResponse(GoogleAccountBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Schemas para Locations
class LocationBase(BaseModel):
    location_id: str
    location_name: str
    address: Optional[str] = None
    phone_number: Optional[str] = None
    website: Optional[str] = None
    business_status: Optional[str] = None

class LocationCreate(LocationBase):
    google_account_id: int

class LocationResponse(LocationBase):
    id: int
    google_account_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Schemas para Reviews
class ReviewBase(BaseModel):
    review_id: str
    reviewer_name: Optional[str] = None
    star_rating: Optional[int] = None
    comment: Optional[str] = None
    create_time: Optional[datetime] = None
    update_time: Optional[datetime] = None
    reply_text: Optional[str] = None
    reply_time: Optional[datetime] = None

class ReviewCreate(ReviewBase):
    location_id: int

class ReviewResponse(ReviewBase):
    id: int
    location_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class ReviewReply(BaseModel):
    reply_text: str

# Schemas para Posts
class PostBase(BaseModel):
    post_id: str
    summary: str
    media_url: Optional[str] = None
    create_time: Optional[datetime] = None
    update_time: Optional[datetime] = None
    state: Optional[str] = None
    search_url: Optional[str] = None

class PostCreate(BaseModel):
    summary: str
    media_url: Optional[str] = None
    location_id: int

class PostResponse(PostBase):
    id: int
    location_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Schemas para Media Items
class MediaItemBase(BaseModel):
    media_id: str
    media_url: str
    media_type: Optional[str] = None
    description: Optional[str] = None
    create_time: Optional[datetime] = None

class MediaItemCreate(BaseModel):
    media_url: str
    description: Optional[str] = None
    location_id: int

class MediaItemResponse(MediaItemBase):
    id: int
    location_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Schema para autenticación
class Token(BaseModel):
    access_token: str
    token_type: str
    refresh_token: Optional[str] = None
    expires_in: Optional[str] = None

class TokenData(BaseModel):
    username: Optional[str] = None

# Schemas para respuestas de API
class MessageResponse(BaseModel):
    message: str

class ErrorResponse(BaseModel):
    detail: str
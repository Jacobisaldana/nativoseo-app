from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean, Table, JSON
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    oauth_tokens = relationship("OauthToken", back_populates="user", cascade="all, delete-orphan")
    google_accounts = relationship("GoogleAccount", back_populates="user", cascade="all, delete-orphan")

class OauthToken(Base):
    __tablename__ = "oauth_tokens"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    access_token = Column(String, nullable=False)
    refresh_token = Column(String, nullable=False)
    token_type = Column(String, default="Bearer")
    expires_at = Column(DateTime)
    scopes = Column(String)
    client_id = Column(String)
    client_secret = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    user = relationship("User", back_populates="oauth_tokens")

class GoogleAccount(Base):
    __tablename__ = "google_accounts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    account_id = Column(String, nullable=False)
    account_name = Column(String, nullable=False)
    account_type = Column(String)
    account_role = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    user = relationship("User", back_populates="google_accounts")
    locations = relationship("Location", back_populates="google_account", cascade="all, delete-orphan")

class Location(Base):
    __tablename__ = "locations"
    
    id = Column(Integer, primary_key=True, index=True)
    google_account_id = Column(Integer, ForeignKey("google_accounts.id", ondelete="CASCADE"))
    location_id = Column(String, nullable=False)
    location_name = Column(String, nullable=False)
    address = Column(String)
    phone_number = Column(String)
    website = Column(String)
    business_status = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    google_account = relationship("GoogleAccount", back_populates="locations")
    reviews = relationship("Review", back_populates="location", cascade="all, delete-orphan")
    posts = relationship("Post", back_populates="location", cascade="all, delete-orphan")
    media_items = relationship("MediaItem", back_populates="location", cascade="all, delete-orphan")

class Review(Base):
    __tablename__ = "reviews"
    
    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="CASCADE"))
    review_id = Column(String, unique=True, nullable=False)
    reviewer_name = Column(String)
    star_rating = Column(Integer)
    comment = Column(Text)
    create_time = Column(DateTime)
    update_time = Column(DateTime)
    reply_text = Column(Text)
    reply_time = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    location = relationship("Location", back_populates="reviews")

class Post(Base):
    __tablename__ = "posts"
    
    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="CASCADE"))
    post_id = Column(String, unique=True, nullable=False)
    summary = Column(Text, nullable=False)
    media_url = Column(String)
    create_time = Column(DateTime)
    update_time = Column(DateTime)
    state = Column(String)
    search_url = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    location = relationship("Location", back_populates="posts")

class MediaItem(Base):
    __tablename__ = "media_items"
    
    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="CASCADE"))
    media_id = Column(String, unique=True, nullable=False)
    media_url = Column(String, nullable=False)
    media_type = Column(String)
    description = Column(Text)
    create_time = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    location = relationship("Location", back_populates="media_items")
from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    tokens = relationship("OauthToken", back_populates="user")
    active_locations = relationship("ActiveLocation", back_populates="user")
    google_accounts = relationship("GoogleAccount", back_populates="user")

class OauthToken(Base):
    __tablename__ = "oauth_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    access_token = Column(String)
    refresh_token = Column(String)
    expires_at = Column(DateTime(timezone=True))
    token_type = Column(String, default="Bearer")
    scopes = Column(String, nullable=True)
    client_id = Column(String, nullable=True)
    client_secret = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    user = relationship("User", back_populates="tokens")

class ActiveLocation(Base):
    __tablename__ = "active_locations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    account_id = Column(String, index=True)
    location_id = Column(String, index=True)
    location_name = Column(String)
    activated_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="active_locations")

class GoogleAccount(Base):
    __tablename__ = "google_accounts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    account_id = Column(String, index=True)
    account_name = Column(String)
    account_type = Column(String, nullable=True)
    account_role = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    user = relationship("User", back_populates="google_accounts")
    locations = relationship("Location", back_populates="google_account")

class Location(Base):
    __tablename__ = "locations"
    
    id = Column(Integer, primary_key=True, index=True)
    google_account_id = Column(Integer, ForeignKey("google_accounts.id"))
    location_id = Column(String, index=True)
    location_name = Column(String)
    address = Column(String, nullable=True)
    phone_number = Column(String, nullable=True)
    website = Column(String, nullable=True)
    business_status = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    google_account = relationship("GoogleAccount", back_populates="locations")
    reviews = relationship("Review", back_populates="location")
    posts = relationship("Post", back_populates="location")
    media_items = relationship("MediaItem", back_populates="location")

class Review(Base):
    __tablename__ = "reviews"
    
    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"))
    review_id = Column(String, index=True)
    reviewer_name = Column(String, nullable=True)
    star_rating = Column(Integer, nullable=True)
    comment = Column(Text, nullable=True)
    create_time = Column(DateTime(timezone=True), nullable=True)
    update_time = Column(DateTime(timezone=True), nullable=True)
    reply_text = Column(Text, nullable=True)
    reply_time = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    location = relationship("Location", back_populates="reviews")

class Post(Base):
    __tablename__ = "posts"
    
    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"))
    post_id = Column(String, index=True)
    summary = Column(Text)
    media_url = Column(String, nullable=True)
    create_time = Column(DateTime(timezone=True), nullable=True)
    update_time = Column(DateTime(timezone=True), nullable=True)
    state = Column(String, nullable=True)
    search_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    location = relationship("Location", back_populates="posts")

class MediaItem(Base):
    __tablename__ = "media_items"
    
    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"))
    media_id = Column(String, index=True)
    media_url = Column(String)
    media_type = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    create_time = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    location = relationship("Location", back_populates="media_items")
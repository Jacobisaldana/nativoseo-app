from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional
import models
import schemas

# Operaciones CRUD para OauthToken
def create_oauth_token(db: Session, token: schemas.TokenCreate):
    db_token = models.OauthToken(
        user_id=token.user_id,
        access_token=token.access_token,
        refresh_token=token.refresh_token,
        token_type=token.token_type,
        expires_at=token.expires_at,
        scopes=token.scopes,
        client_id=token.client_id,
        client_secret=token.client_secret
    )
    db.add(db_token)
    db.commit()
    db.refresh(db_token)
    return db_token

def get_oauth_token_by_user_id(db: Session, user_id: int):
    return db.query(models.OauthToken).filter(models.OauthToken.user_id == user_id).first()

def update_oauth_token(db: Session, token_id: int, token_data: schemas.TokenBase):
    db_token = db.query(models.OauthToken).filter(models.OauthToken.id == token_id).first()
    if db_token:
        for key, value in token_data.dict(exclude_unset=True).items():
            setattr(db_token, key, value)
        db_token.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_token)
    return db_token

# Operaciones CRUD para GoogleAccount
def create_google_account(db: Session, account: schemas.GoogleAccountCreate):
    db_account = models.GoogleAccount(
        user_id=account.user_id,
        account_id=account.account_id,
        account_name=account.account_name,
        account_type=account.account_type,
        account_role=account.account_role
    )
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return db_account

def get_google_accounts_by_user_id(db: Session, user_id: int) -> List[models.GoogleAccount]:
    return db.query(models.GoogleAccount).filter(models.GoogleAccount.user_id == user_id).all()

def get_google_account(db: Session, account_id: str, user_id: int):
    return db.query(models.GoogleAccount).filter(
        models.GoogleAccount.account_id == account_id,
        models.GoogleAccount.user_id == user_id
    ).first()

# Operaciones CRUD para Location
def create_location(db: Session, location: schemas.LocationCreate):
    db_location = models.Location(
        google_account_id=location.google_account_id,
        location_id=location.location_id,
        location_name=location.location_name,
        address=location.address,
        phone_number=location.phone_number,
        website=location.website,
        business_status=location.business_status
    )
    db.add(db_location)
    db.commit()
    db.refresh(db_location)
    return db_location

def get_locations_by_google_account_id(db: Session, google_account_id: int) -> List[models.Location]:
    return db.query(models.Location).filter(models.Location.google_account_id == google_account_id).all()

def get_location(db: Session, location_id: str, google_account_id: int):
    return db.query(models.Location).filter(
        models.Location.location_id == location_id,
        models.Location.google_account_id == google_account_id
    ).first()

# Operaciones CRUD para Review
def create_review(db: Session, review: schemas.ReviewCreate):
    db_review = models.Review(
        location_id=review.location_id,
        review_id=review.review_id,
        reviewer_name=review.reviewer_name,
        star_rating=review.star_rating,
        comment=review.comment,
        create_time=review.create_time,
        update_time=review.update_time,
        reply_text=review.reply_text,
        reply_time=review.reply_time
    )
    db.add(db_review)
    db.commit()
    db.refresh(db_review)
    return db_review

def get_reviews_by_location_id(db: Session, location_id: int, skip: int = 0, limit: int = 100) -> List[models.Review]:
    return db.query(models.Review).filter(models.Review.location_id == location_id).offset(skip).limit(limit).all()

def get_review(db: Session, review_id: str, location_id: int):
    return db.query(models.Review).filter(
        models.Review.review_id == review_id,
        models.Review.location_id == location_id
    ).first()

def update_review_reply(db: Session, review_id: str, location_id: int, reply_text: str):
    db_review = get_review(db, review_id, location_id)
    if db_review:
        db_review.reply_text = reply_text
        db_review.reply_time = datetime.utcnow()
        db_review.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_review)
    return db_review

# Operaciones CRUD para Post
def create_post(db: Session, post: schemas.PostCreate, post_id: str):
    db_post = models.Post(
        location_id=post.location_id,
        post_id=post_id,
        summary=post.summary,
        media_url=post.media_url,
        create_time=datetime.utcnow(),
        state="LIVE"
    )
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    return db_post

def get_posts_by_location_id(db: Session, location_id: int, skip: int = 0, limit: int = 100) -> List[models.Post]:
    return db.query(models.Post).filter(models.Post.location_id == location_id).offset(skip).limit(limit).all()

# Operaciones CRUD para MediaItem
def create_media_item(db: Session, media_item: schemas.MediaItemCreate, media_id: str):
    db_media = models.MediaItem(
        location_id=media_item.location_id,
        media_id=media_id,
        media_url=media_item.media_url,
        description=media_item.description,
        create_time=datetime.utcnow()
    )
    db.add(db_media)
    db.commit()
    db.refresh(db_media)
    return db_media

def get_media_items_by_location_id(db: Session, location_id: int, skip: int = 0, limit: int = 100) -> List[models.MediaItem]:
    return db.query(models.MediaItem).filter(models.MediaItem.location_id == location_id).offset(skip).limit(limit).all()
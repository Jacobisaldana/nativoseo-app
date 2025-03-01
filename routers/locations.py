from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from database import get_db
from models import User, ActiveLocation
from auth.users import get_current_user

router = APIRouter(
    prefix="/locations",
    tags=["locations"],
    responses={404: {"description": "No encontrado"}},
)

class ActiveLocationBase(BaseModel):
    account_id: str
    location_id: str
    location_name: Optional[str] = None

class ActiveLocationCreate(ActiveLocationBase):
    pass

class ActiveLocationResponse(ActiveLocationBase):
    id: int
    user_id: int
    activated_at: datetime
    
    class Config:
        from_attributes = True

@router.get("/active", response_model=List[ActiveLocationResponse])
async def get_active_locations(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtiene todas las ubicaciones activas del usuario actual."""
    active_locations = db.query(ActiveLocation).filter(
        ActiveLocation.user_id == current_user.id
    ).offset(skip).limit(limit).all()
    return active_locations

@router.post("/active", response_model=ActiveLocationResponse, status_code=status.HTTP_201_CREATED)
async def activate_location(
    location: ActiveLocationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Activa una ubicación para el usuario actual."""
    # Verificar si ya existe
    existing = db.query(ActiveLocation).filter(
        ActiveLocation.user_id == current_user.id,
        ActiveLocation.account_id == location.account_id,
        ActiveLocation.location_id == location.location_id
    ).first()
    
    if existing:
        return existing
    
    # Crear nueva ubicación activa
    db_location = ActiveLocation(
        user_id=current_user.id,
        account_id=location.account_id,
        location_id=location.location_id,
        location_name=location.location_name
    )
    db.add(db_location)
    db.commit()
    db.refresh(db_location)
    return db_location

@router.delete("/active/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_location(
    location_id: str,
    account_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Desactiva una ubicación para el usuario actual."""
    query = db.query(ActiveLocation).filter(
        ActiveLocation.user_id == current_user.id,
        ActiveLocation.location_id == location_id
    )
    
    if account_id:
        query = query.filter(ActiveLocation.account_id == account_id)
    
    location = query.first()
    
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ubicación activa no encontrada"
        )
    
    db.delete(location)
    db.commit()
    return None
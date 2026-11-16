from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.auth import UserResponse
from app.api.v1.auth import get_current_user, require_super_admin

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("", response_model=List[UserResponse])
def search_users(
    q: Optional[str] = Query(None, description="Search by username, email, or user_id"),
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(User)
    if q:
        search_filter = f"%{q.strip()}%"
        query = query.filter(
            or_(
                User.username.ilike(search_filter),
                User.email.ilike(search_filter),
                User.user_id.ilike(search_filter)
            )
        )
    return query.limit(limit).all()

@router.get("/by-user-id/{user_id}", response_model=UserResponse)
def get_user_by_bpl_id(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user = db.query(User).filter(User.user_id == user_id.upper().strip()).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"User with ID {user_id} not found")
    return user

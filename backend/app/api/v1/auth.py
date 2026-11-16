from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.models.team import Team, TeamPlayer
from app.schemas.auth import SendOTPRequest, VerifyOTPRequest, TokenResponse, UserResponse, MemberProfileResponse
from app.services.auth_service import create_and_send_otp, verify_otp_and_login_or_register
from app.utils.security import create_access_token, decode_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer(auto_error=False)

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials not provided",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials or token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

def require_super_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.SUPER_ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Super Administrators are authorized to perform this operation"
        )
    return current_user

@router.post("/send-otp")
def send_otp(req: SendOTPRequest, db: Session = Depends(get_db)):
    try:
        otp = create_and_send_otp(db, req.email.lower().strip())
        return {
            "success": True, 
            "message": f"Verification OTP sent to {req.email}",
            "debug_otp": otp
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/verify-otp", response_model=TokenResponse)
def verify_otp(req: VerifyOTPRequest, db: Session = Depends(get_db)):
    try:
        user = verify_otp_and_login_or_register(
            db=db,
            email=req.email.lower().strip(),
            otp=req.otp.strip(),
            username=req.username
        )
        token = create_access_token({"sub": user.id, "role": user.role, "user_id": user.user_id})
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": user
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Authentication server error")

@router.get("/me", response_model=MemberProfileResponse)
def get_current_member_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns personalized profile for authenticated users:
    - User details (BPL ID, username, email)
    - Assigned team (if any)
    - Team Captain info
    - Squad teammates list
    """
    membership = db.query(TeamPlayer).filter(TeamPlayer.user_id == current_user.id).first()
    team_data = None
    captain_data = None
    teammates = []
    is_capt = False

    if membership:
        team = db.query(Team).filter(Team.id == membership.team_id).first()
        if team:
            team_data = {
                "id": team.id,
                "name": team.name,
                "short_code": team.short_code,
                "primary_color": team.primary_color,
                "secondary_color": team.secondary_color
            }
            if team.captain:
                captain_data = {
                    "id": team.captain.id,
                    "user_id": team.captain.user_id,
                    "username": team.captain.username,
                    "email": team.captain.email,
                    "role": team.captain.role,
                    "is_active": team.captain.is_active
                }
            is_capt = (team.captain_id == current_user.id) or membership.is_captain

            # All players in the same team
            team_players = db.query(TeamPlayer).filter(TeamPlayer.team_id == team.id).all()
            for tp in team_players:
                if tp.user:
                    teammates.append({
                        "id": tp.user.id,
                        "user_id": tp.user.user_id,
                        "username": tp.user.username,
                        "role": tp.user.role,
                        "player_role": tp.player_role,
                        "jersey_number": tp.jersey_number,
                        "is_captain": tp.is_captain or (team.captain_id == tp.user.id)
                    })

    return {
        "user": current_user,
        "team": team_data,
        "captain": captain_data,
        "teammates": teammates,
        "is_captain_of_team": is_capt
    }

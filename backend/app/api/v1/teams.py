import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.team import Team, TeamPlayer
from app.models.user import User, UserRole
from app.schemas.team import TeamCreate, TeamUpdate, TeamResponse, AddPlayerRequest, TeamPlayerResponse
from app.api.v1.auth import require_super_admin, get_current_user

router = APIRouter(prefix="/teams", tags=["Teams"])

@router.get("", response_model=List[TeamResponse])
def get_all_teams(db: Session = Depends(get_db)):
    teams = db.query(Team).all()
    return teams

@router.get("/{team_id}", response_model=TeamResponse)
def get_team_by_id(team_id: str, db: Session = Depends(get_db)):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team

@router.post("", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
def create_team(
    team_in: TeamCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_super_admin)
):
    # Check max 8 teams limit if enforced
    total_existing = db.query(Team).count()
    if total_existing >= 8:
        raise HTTPException(
            status_code=400,
            detail="Tournament allows a maximum of 8 participating teams."
        )

    # Check unique name or short_code
    existing = db.query(Team).filter(
        (Team.name == team_in.name) | (Team.short_code == team_in.short_code)
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Team name or short code already exists"
        )

    team = Team(
        id=str(uuid.uuid4()),
        name=team_in.name.strip(),
        short_code=team_in.short_code.upper().strip(),
        logo_url=team_in.logo_url,
        primary_color=team_in.primary_color or "#047857",
        secondary_color=team_in.secondary_color or "#fbbf24",
        captain_id=team_in.captain_id
    )
    db.add(team)
    db.commit()
    db.refresh(team)
    return team

@router.put("/{team_id}", response_model=TeamResponse)
def update_team(
    team_id: str,
    team_in: TeamUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_super_admin)
):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    if team_in.name is not None:
        team.name = team_in.name.strip()
    if team_in.short_code is not None:
        team.short_code = team_in.short_code.upper().strip()
    if team_in.logo_url is not None:
        team.logo_url = team_in.logo_url
    if team_in.primary_color is not None:
        team.primary_color = team_in.primary_color
    if team_in.secondary_color is not None:
        team.secondary_color = team_in.secondary_color
    if team_in.captain_id is not None:
        team.captain_id = team_in.captain_id
        # Also ensure user role is CAPTAIN
        capt_user = db.query(User).filter(User.id == team_in.captain_id).first()
        if capt_user and capt_user.role != UserRole.SUPER_ADMIN.value:
            capt_user.role = UserRole.CAPTAIN.value

    db.commit()
    db.refresh(team)
    return team

@router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_team(
    team_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(require_super_admin)
):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    db.delete(team)
    db.commit()
    return None

@router.post("/{team_id}/players", response_model=TeamPlayerResponse)
def add_player_to_team(
    team_id: str,
    req: AddPlayerRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_super_admin)
):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    # Find registered user by BPL User ID
    user = db.query(User).filter(User.user_id == req.bpl_user_id.upper().strip()).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"No user found with ID '{req.bpl_user_id}'")

    # Prevent player from being assigned to multiple teams
    existing_membership = db.query(TeamPlayer).filter(TeamPlayer.user_id == user.id).first()
    if existing_membership:
        other_team = db.query(Team).filter(Team.id == existing_membership.team_id).first()
        other_team_name = other_team.name if other_team else "another team"
        raise HTTPException(
            status_code=400,
            detail=f"Player {user.username} ({user.user_id}) is already assigned to team '{other_team_name}'"
        )

    player = TeamPlayer(
        id=str(uuid.uuid4()),
        team_id=team.id,
        user_id=user.id,
        player_role=req.player_role or "ALL_ROUNDER",
        jersey_number=req.jersey_number,
        is_captain=req.is_captain or False
    )
    db.add(player)

    if req.is_captain:
        team.captain_id = user.id
        if user.role != UserRole.SUPER_ADMIN.value:
            user.role = UserRole.CAPTAIN.value

    db.commit()
    db.refresh(player)
    return player

@router.delete("/{team_id}/players/{player_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_player_from_team(
    team_id: str,
    player_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(require_super_admin)
):
    player = db.query(TeamPlayer).filter(
        TeamPlayer.id == player_id,
        TeamPlayer.team_id == team_id
    ).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found in this team")

    team = db.query(Team).filter(Team.id == team_id).first()
    if team and team.captain_id == player.user_id:
        team.captain_id = None

    db.delete(player)
    db.commit()
    return None

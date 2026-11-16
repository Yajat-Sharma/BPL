from typing import List, Optional
from pydantic import BaseModel
from app.schemas.auth import UserResponse

class TeamPlayerResponse(BaseModel):
    id: str
    user_id: str
    player_role: str
    jersey_number: Optional[int]
    is_captain: bool
    user: UserResponse

    class Config:
        from_attributes = True

class TeamBase(BaseModel):
    name: str
    short_code: str
    logo_url: Optional[str] = None
    primary_color: Optional[str] = "#047857"
    secondary_color: Optional[str] = "#fbbf24"

class TeamCreate(TeamBase):
    captain_id: Optional[str] = None

class TeamUpdate(BaseModel):
    name: Optional[str] = None
    short_code: Optional[str] = None
    logo_url: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    captain_id: Optional[str] = None

class TeamResponse(TeamBase):
    id: str
    captain_id: Optional[str] = None
    captain: Optional[UserResponse] = None
    players: List[TeamPlayerResponse] = []

    class Config:
        from_attributes = True

class AddPlayerRequest(BaseModel):
    bpl_user_id: str # e.g. "BPL003"
    player_role: Optional[str] = "ALL_ROUNDER"
    jersey_number: Optional[int] = None
    is_captain: Optional[bool] = False

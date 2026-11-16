from typing import Optional
from pydantic import BaseModel, EmailStr

class SendOTPRequest(BaseModel):
    email: EmailStr

class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str
    username: Optional[str] = None # Required on first registration

class UserResponse(BaseModel):
    id: str
    user_id: str
    username: str
    email: str
    role: str
    is_active: bool

    class Config:
        from_attributes = True

class TeamSummary(BaseModel):
    id: str
    name: str
    short_code: str
    primary_color: str
    secondary_color: str

class TeammateResponse(BaseModel):
    id: str
    user_id: str
    username: str
    role: str
    player_role: str
    jersey_number: Optional[int]
    is_captain: bool

class MemberProfileResponse(BaseModel):
    user: UserResponse
    team: Optional[TeamSummary] = None
    captain: Optional[UserResponse] = None
    teammates: list[TeammateResponse] = []
    is_captain_of_team: bool = False

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

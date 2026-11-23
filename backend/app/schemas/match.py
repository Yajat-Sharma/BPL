from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from app.schemas.team import TeamResponse
from app.schemas.auth import UserResponse

class MatchPlayingXICreate(BaseModel):
    team_id: str
    user_ids: List[str]

class MatchCreate(BaseModel):
    team_a_id: str
    team_b_id: str
    match_date: datetime
    venue: Optional[str] = "Bairajeshwar Cricket Ground"
    overs_per_innings: Optional[int] = 10
    description: Optional[str] = None

class MatchUpdate(BaseModel):
    venue: Optional[str] = None
    match_date: Optional[datetime] = None
    overs_per_innings: Optional[int] = None
    description: Optional[str] = None
    status: Optional[str] = None

class MatchTossRequest(BaseModel):
    toss_winner_id: str
    toss_decision: str # BAT or BOWL

class MatchStartRequest(BaseModel):
    batting_team_id: str
    bowling_team_id: str
    striker_id: str
    non_striker_id: str
    bowler_id: str
    team_a_playing_xi: List[str] # List of user IDs
    team_b_playing_xi: List[str]

class MatchPlayingXIResponse(BaseModel):
    id: str
    match_id: str
    team_id: str
    user_id: str
    user: UserResponse

    class Config:
        from_attributes = True

class MatchInningsSummaryResponse(BaseModel):
    id: str
    innings_number: int
    batting_team_id: str
    bowling_team_id: str
    total_runs: int
    wickets: int
    legal_balls_bowled: int
    total_overs_formatted: str
    current_run_rate: float
    is_completed: bool

class MatchResponse(BaseModel):
    id: str
    match_number: str
    description: Optional[str]
    team_a_id: str
    team_b_id: str
    team_a: TeamResponse
    team_b: TeamResponse
    venue: str
    match_date: datetime
    overs_per_innings: int
    status: str
    toss_winner_id: Optional[str] = None
    toss_decision: Optional[str] = None
    toss_winner: Optional[TeamResponse] = None
    winner_id: Optional[str] = None
    winner: Optional[TeamResponse] = None
    win_margin: Optional[str] = None
    current_innings_number: int
    target_runs: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

class GullyMatchCreateRequest(BaseModel):
    match_name: str
    match_type: Optional[str] = "SINGLE" # "SINGLE" or "LEAGUE"
    num_matches: Optional[int] = 1 # if league
    overs_per_innings: Optional[int] = 6
    venue: Optional[str] = "Gully Turf Ground"
    ball_type: Optional[str] = "Tennis Ball"
    
    # Team names
    team_a_name: str
    team_b_name: str
    
    # Players (plain name strings)
    team_a_players: List[str]
    team_b_players: List[str]
    
    # Toss & initial players (optional, if user wants to start right away)
    toss_winner_team: Optional[str] = "TEAM_A" # "TEAM_A" or "TEAM_B"
    toss_decision: Optional[str] = "BAT" # "BAT" or "BOWL"
    striker_name: Optional[str] = None
    non_striker_name: Optional[str] = None
    bowler_name: Optional[str] = None

class GullyMatchResponse(BaseModel):
    match_id: str
    match_number: str
    status: str
    description: str
    team_a_name: str
    team_b_name: str
    overs: int
    score_url: str
    live_url: str

from typing import List, Optional, Any, Dict
from pydantic import BaseModel
from app.schemas.auth import UserResponse

class BallDeliveryInput(BaseModel):
    runs_scored: int = 0 # 0, 1, 2, 3, 4, 6
    extra_type: str = "NONE" # NONE, WIDE, NO_BALL, BYE, LEG_BYE
    extra_runs: int = 0
    is_wicket: bool = False
    wicket_type: Optional[str] = None # BOWLED, CAUGHT, LBW, RUN_OUT, STUMPED, HIT_WICKET
    dismissed_player_id: Optional[str] = None # Mandatory if is_wicket
    fielder_id: Optional[str] = None
    custom_commentary: Optional[str] = None

class SwitchBowlerInput(BaseModel):
    bowler_id: str

class SelectNewBatsmanInput(BaseModel):
    batsman_id: str

class SwitchStrikeInput(BaseModel):
    striker_id: str
    non_striker_id: str

class LiveMatchState(BaseModel):
    match_id: str
    match_number: str
    status: str
    current_innings_number: int
    overs_per_innings: int
    batting_team: Dict[str, Any]
    bowling_team: Dict[str, Any]
    total_runs: int
    wickets: int
    overs: float # formatted like 4.2
    legal_balls: int
    crr: float
    target: Optional[int]
    rrr: Optional[float]
    striker: Optional[Dict[str, Any]]
    non_striker: Optional[Dict[str, Any]]
    bowler: Optional[Dict[str, Any]]
    recent_balls: List[Dict[str, Any]]
    last_commentary: Optional[str]
    win_margin: Optional[str]
    is_innings_completed: bool
    is_match_completed: bool

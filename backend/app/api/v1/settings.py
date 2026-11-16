from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.tournament import TournamentSettings
from app.models.user import User
from app.models.team import Team, TeamPlayer
from app.models.match import Match, MatchStatus
from app.api.v1.auth import require_super_admin

router = APIRouter(prefix="/settings", tags=["Tournament Settings"])

class SettingsUpdate(BaseModel):
    tournament_name: Optional[str] = None
    banner_url: Optional[str] = None
    logo_url: Optional[str] = None
    total_teams: Optional[int] = None
    overs_per_match: Optional[int] = None
    points_win: Optional[int] = None
    points_tie: Optional[int] = None
    points_no_result: Optional[int] = None
    status: Optional[str] = None
    
    # Box Cricket Config
    players_per_team: Optional[int] = None
    max_wickets: Optional[int] = None
    allow_last_man_batting: Optional[bool] = None
    wide_runs: Optional[int] = None
    no_ball_runs: Optional[int] = None
    no_ball_reball: Optional[bool] = None
    wide_reball: Optional[bool] = None
    roof_net_hit_rule: Optional[str] = None
    direct_hit_wall_rule: Optional[str] = None
    allow_lbw: Optional[bool] = None
    over_limit_per_bowler: Optional[int] = None

@router.get("")
def get_tournament_settings(db: Session = Depends(get_db)):
    settings_obj = db.query(TournamentSettings).first()
    if not settings_obj:
        settings_obj = TournamentSettings(
            tournament_name="Bairajeshwar Premier League (BPL)",
            overs_per_match=6,
            points_win=2,
            points_tie=1,
            points_no_result=1,
            status="UPCOMING",
            players_per_team=8,
            max_wickets=7,
            allow_last_man_batting=False,
            wide_runs=1,
            no_ball_runs=1,
            no_ball_reball=True,
            wide_reball=True,
            roof_net_hit_rule="DEAD_BALL",
            direct_hit_wall_rule="RUNS_4",
            allow_lbw=False,
            over_limit_per_bowler=2
        )
        db.add(settings_obj)
        db.commit()
        db.refresh(settings_obj)
    return settings_obj

@router.put("")
def update_tournament_settings(
    update_in: SettingsUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_super_admin)
):
    settings_obj = db.query(TournamentSettings).first()
    if not settings_obj:
        settings_obj = TournamentSettings()
        db.add(settings_obj)

    for field, val in update_in.model_dump(exclude_unset=True).items():
        setattr(settings_obj, field, val)

    db.commit()
    db.refresh(settings_obj)
    return settings_obj

@router.get("/overview")
def get_admin_overview_stats(
    db: Session = Depends(get_db)
):
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_teams = db.query(func.count(Team.id)).scalar() or 0
    total_players = db.query(func.count(TeamPlayer.id)).scalar() or 0
    
    matches_live = db.query(func.count(Match.id)).filter(Match.status == MatchStatus.LIVE.value).scalar() or 0
    matches_upcoming = db.query(func.count(Match.id)).filter(Match.status == MatchStatus.UPCOMING.value).scalar() or 0
    matches_completed = db.query(func.count(Match.id)).filter(Match.status == MatchStatus.COMPLETED.value).scalar() or 0

    settings_obj = db.query(TournamentSettings).first()

    return {
        "total_users": total_users,
        "total_teams": total_teams,
        "total_players": total_players,
        "matches_live": matches_live,
        "matches_upcoming": matches_upcoming,
        "matches_completed": matches_completed,
        "tournament_status": settings_obj.status if settings_obj else "UPCOMING",
        "tournament_name": settings_obj.tournament_name if settings_obj else "BPL",
        "box_cricket_rules": {
            "players_per_team": settings_obj.players_per_team if settings_obj else 8,
            "max_wickets": settings_obj.max_wickets if settings_obj else 7,
            "allow_last_man_batting": settings_obj.allow_last_man_batting if settings_obj else False,
            "wide_runs": settings_obj.wide_runs if settings_obj else 1,
            "no_ball_runs": settings_obj.no_ball_runs if settings_obj else 1,
            "roof_net_hit_rule": settings_obj.roof_net_hit_rule if settings_obj else "DEAD_BALL",
            "direct_hit_wall_rule": settings_obj.direct_hit_wall_rule if settings_obj else "RUNS_4",
            "allow_lbw": settings_obj.allow_lbw if settings_obj else False,
            "over_limit_per_bowler": settings_obj.over_limit_per_bowler if settings_obj else 2
        }
    }

import asyncio
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.match import Match, MatchInnings, MatchStatus
from app.models.scorecard import BattingScorecard, BowlingScorecard
from app.models.scoring import BallEvent
from app.models.user import User
from app.schemas.scoring import BallDeliveryInput, SwitchBowlerInput, SelectNewBatsmanInput, SwitchStrikeInput
from app.services.scoring_engine import (
    process_ball_delivery, 
    undo_last_ball, 
    build_match_live_payload
)
from app.services.websocket_manager import ws_manager
from app.api.v1.auth import get_current_user_optional

router = APIRouter(prefix="/scoring", tags=["Live Scoring"])

@router.get("/live/{match_id}")
def get_live_match_state(match_id: str, db: Session = Depends(get_db)):
    try:
        return build_match_live_payload(db, match_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/scorecard/{match_id}")
def get_full_scorecard(match_id: str, db: Session = Depends(get_db)):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    innings_list = db.query(MatchInnings).filter(
        MatchInnings.match_id == match.id
    ).order_by(MatchInnings.innings_number.asc()).all()

    result = {
        "match_id": match.id,
        "match_number": match.match_number,
        "status": match.status,
        "win_margin": match.win_margin,
        "innings": []
    }

    for inn in innings_list:
        batting_cards = db.query(BattingScorecard).filter(
            BattingScorecard.innings_id == inn.id
        ).order_by(BattingScorecard.batting_position.asc()).all()

        bowling_cards = db.query(BowlingScorecard).filter(
            BowlingScorecard.innings_id == inn.id
        ).all()

        batters = []
        for b in batting_cards:
            b_user = db.query(User).filter(User.id == b.batsman_id).first()
            bowler_u = db.query(User).filter(User.id == b.bowler_id).first() if b.bowler_id else None
            fielder_u = db.query(User).filter(User.id == b.fielder_id).first() if b.fielder_id else None
            
            dismissal_str = "not out"
            if b.is_out:
                if b.dismissal_type == "BOWLED":
                    dismissal_str = f"b {bowler_u.username if bowler_u else 'Bowler'}"
                elif b.dismissal_type == "CAUGHT":
                    dismissal_str = f"c {fielder_u.username if fielder_u else 'Fielder'} b {bowler_u.username if bowler_u else 'Bowler'}"
                elif b.dismissal_type == "LBW":
                    dismissal_str = f"lbw b {bowler_u.username if bowler_u else 'Bowler'}"
                elif b.dismissal_type == "RUN_OUT":
                    dismissal_str = f"run out ({fielder_u.username if fielder_u else ''})"
                elif b.dismissal_type == "STUMPED":
                    dismissal_str = f"st {fielder_u.username if fielder_u else 'Keeper'} b {bowler_u.username if bowler_u else 'Bowler'}"
                else:
                    dismissal_str = b.dismissal_type or "out"

            batters.append({
                "id": b.id,
                "player_id": b.batsman_id,
                "name": b_user.username if b_user else "Batsman",
                "dismissal": dismissal_str,
                "runs": b.runs,
                "balls": b.balls_faced,
                "fours": b.fours,
                "sixes": b.sixes,
                "sr": b.strike_rate
            })

        bowlers = []
        for bow in bowling_cards:
            bow_user = db.query(User).filter(User.id == bow.bowler_id).first()
            bowlers.append({
                "id": bow.id,
                "player_id": bow.bowler_id,
                "name": bow_user.username if bow_user else "Bowler",
                "overs": bow.overs_bowled,
                "maidens": bow.maidens,
                "runs": bow.runs_conceded,
                "wickets": bow.wickets,
                "economy": bow.economy_rate,
                "wides": bow.wides,
                "no_balls": bow.no_balls
            })

        completed_overs = inn.legal_balls_bowled // 6
        remaining_balls = inn.legal_balls_bowled % 6
        formatted_overs = f"{completed_overs}.{remaining_balls}"

        result["innings"].append({
            "innings_number": inn.innings_number,
            "batting_team_id": inn.batting_team_id,
            "batting_team_name": inn.batting_team.name if inn.batting_team else "Team",
            "bowling_team_id": inn.bowling_team_id,
            "bowling_team_name": inn.bowling_team.name if inn.bowling_team else "Team",
            "total_runs": inn.total_runs,
            "wickets": inn.wickets,
            "overs": formatted_overs,
            "extras": {
                "total": inn.wide_runs + inn.no_ball_runs + inn.bye_runs + inn.leg_bye_runs,
                "wides": inn.wide_runs,
                "no_balls": inn.no_ball_runs,
                "byes": inn.bye_runs,
                "leg_byes": inn.leg_bye_runs
            },
            "batters": batters,
            "bowlers": bowlers
        })

    return result

@router.post("/ball/{match_id}")
async def record_ball(
    match_id: str,
    delivery: BallDeliveryInput,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_optional)
):
    try:
        updated_state = process_ball_delivery(db, match_id, delivery)
        # Broadcast real-time score to all connected WebSockets
        asyncio.create_task(ws_manager.broadcast_to_match(match_id, updated_state))
        return updated_state
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/undo/{match_id}")
async def undo_delivery(
    match_id: str,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_optional)
):
    try:
        updated_state = undo_last_ball(db, match_id)
        # Broadcast reverted score immediately
        asyncio.create_task(ws_manager.broadcast_to_match(match_id, updated_state))
        return updated_state
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/switch-bowler/{match_id}")
async def switch_bowler(
    match_id: str,
    inp: SwitchBowlerInput,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_optional)
):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    innings = db.query(MatchInnings).filter(
        MatchInnings.match_id == match.id,
        MatchInnings.innings_number == match.current_innings_number
    ).first()
    if not innings:
        raise HTTPException(status_code=404, detail="Active innings not found")

    innings.current_bowler_id = inp.bowler_id
    
    # Ensure bowling scorecard exists
    bowler_card = db.query(BowlingScorecard).filter(
        BowlingScorecard.innings_id == innings.id,
        BowlingScorecard.bowler_id == inp.bowler_id
    ).first()
    if not bowler_card:
        import uuid
        db.add(BowlingScorecard(
            id=str(uuid.uuid4()),
            innings_id=innings.id,
            bowler_id=inp.bowler_id
        ))

    db.commit()
    updated_state = build_match_live_payload(db, match_id)
    asyncio.create_task(ws_manager.broadcast_to_match(match_id, updated_state))
    return updated_state

@router.post("/select-batsman/{match_id}")
async def select_batsman(
    match_id: str,
    inp: SelectNewBatsmanInput,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_optional)
):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    innings = db.query(MatchInnings).filter(
        MatchInnings.match_id == match.id,
        MatchInnings.innings_number == match.current_innings_number
    ).first()
    if not innings:
        raise HTTPException(status_code=404, detail="Active innings not found")

    if not innings.current_striker_id:
        innings.current_striker_id = inp.batsman_id
    elif not innings.current_non_striker_id:
        innings.current_non_striker_id = inp.batsman_id
    else:
        raise HTTPException(status_code=400, detail="Both striker and non-striker are already active")

    # Add batting scorecard for new batsman
    existing_card = db.query(BattingScorecard).filter(
        BattingScorecard.innings_id == innings.id,
        BattingScorecard.batsman_id == inp.batsman_id
    ).first()
    if not existing_card:
        import uuid
        position = (db.query(BattingScorecard).filter(BattingScorecard.innings_id == innings.id).count()) + 1
        db.add(BattingScorecard(
            id=str(uuid.uuid4()),
            innings_id=innings.id,
            batsman_id=inp.batsman_id,
            batting_position=position
        ))

    db.commit()
    updated_state = build_match_live_payload(db, match_id)
    asyncio.create_task(ws_manager.broadcast_to_match(match_id, updated_state))
    return updated_state

@router.post("/swap-strike/{match_id}")
async def manual_swap_strike(
    match_id: str,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_optional)
):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    innings = db.query(MatchInnings).filter(
        MatchInnings.match_id == match.id,
        MatchInnings.innings_number == match.current_innings_number
    ).first()
    if not innings or not innings.current_striker_id or not innings.current_non_striker_id:
        raise HTTPException(status_code=400, detail="Both batsmen must be on field to swap strike")

    innings.current_striker_id, innings.current_non_striker_id = (
        innings.current_non_striker_id,
        innings.current_striker_id
    )
    db.commit()
    updated_state = build_match_live_payload(db, match_id)
    asyncio.create_task(ws_manager.broadcast_to_match(match_id, updated_state))
    return updated_state

import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.match import Match, MatchInnings, MatchPlayingXI, MatchStatus
from app.models.team import Team, TeamPlayer
from app.models.scorecard import BattingScorecard, BowlingScorecard
from app.models.user import User, UserRole
from app.schemas.match import (
    MatchCreate, 
    MatchUpdate, 
    MatchResponse, 
    MatchTossRequest, 
    MatchStartRequest,
    GullyMatchCreateRequest,
    GullyMatchResponse
)
from app.api.v1.auth import get_current_user_optional, require_super_admin

router = APIRouter(prefix="/matches", tags=["Matches"])

def generate_next_match_number(db: Session) -> str:
    count = db.query(func.count(Match.id)).scalar() or 0
    return f"M{count + 1:02d}"

@router.get("", response_model=List[MatchResponse])
def get_matches(
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db)
):
    query = db.query(Match).order_by(Match.match_date.asc())
    if status_filter:
        query = query.filter(Match.status == status_filter.upper())
    return query.all()

@router.get("/{match_id}", response_model=MatchResponse)
def get_match_by_id(match_id: str, db: Session = Depends(get_db)):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    return match

@router.post("", response_model=MatchResponse, status_code=status.HTTP_201_CREATED)
def schedule_match(
    match_in: MatchCreate,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_optional)
):
    if match_in.team_a_id == match_in.team_b_id:
        raise HTTPException(status_code=400, detail="Team A and Team B cannot be the same")

    team_a = db.query(Team).filter(Team.id == match_in.team_a_id).first()
    team_b = db.query(Team).filter(Team.id == match_in.team_b_id).first()
    if not team_a or not team_b:
        raise HTTPException(status_code=404, detail="One or both selected teams do not exist")

    match_number = generate_next_match_number(db)
    match = Match(
        id=str(uuid.uuid4()),
        match_number=match_number,
        description=match_in.description or f"{team_a.name} vs {team_b.name}",
        team_a_id=match_in.team_a_id,
        team_b_id=match_in.team_b_id,
        venue=match_in.venue or "Bairajeshwar Cricket Ground",
        match_date=match_in.match_date,
        overs_per_innings=match_in.overs_per_innings or 10,
        status=MatchStatus.UPCOMING.value
    )
    db.add(match)
    db.commit()
    db.refresh(match)
    return match

@router.put("/{match_id}", response_model=MatchResponse)
def update_match(
    match_id: str,
    match_in: MatchUpdate,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_optional)
):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    if match_in.venue is not None:
        match.venue = match_in.venue
    if match_in.match_date is not None:
        match.match_date = match_in.match_date
    if match_in.overs_per_innings is not None:
        match.overs_per_innings = match_in.overs_per_innings
    if match_in.description is not None:
        match.description = match_in.description
    if match_in.status is not None:
        match.status = match_in.status.upper()

    db.commit()
    db.refresh(match)
    return match

@router.post("/{match_id}/toss", response_model=MatchResponse)
def record_toss(
    match_id: str,
    toss_req: MatchTossRequest,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_optional)
):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    if toss_req.toss_winner_id not in [match.team_a_id, match.team_b_id]:
        raise HTTPException(status_code=400, detail="Toss winner must be one of the playing teams")

    match.toss_winner_id = toss_req.toss_winner_id
    match.toss_decision = toss_req.toss_decision.upper()
    db.commit()
    db.refresh(match)
    return match

@router.post("/{match_id}/start")
def start_match(
    match_id: str,
    req: MatchStartRequest,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_optional)
):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    # Clear previous Playing XI if resetting
    db.query(MatchPlayingXI).filter(MatchPlayingXI.match_id == match.id).delete()
    
    # Save Playing XI for Team A
    for uid in req.team_a_playing_xi:
        db.add(MatchPlayingXI(
            id=str(uuid.uuid4()),
            match_id=match.id,
            team_id=match.team_a_id,
            user_id=uid
        ))
        
    # Save Playing XI for Team B
    for uid in req.team_b_playing_xi:
        db.add(MatchPlayingXI(
            id=str(uuid.uuid4()),
            match_id=match.id,
            team_id=match.team_b_id,
            user_id=uid
        ))

    # Initialize 1st Innings if not exists
    innings = db.query(MatchInnings).filter(
        MatchInnings.match_id == match.id,
        MatchInnings.innings_number == 1
    ).first()

    if not innings:
        innings = MatchInnings(
            id=str(uuid.uuid4()),
            match_id=match.id,
            innings_number=1,
            batting_team_id=req.batting_team_id,
            bowling_team_id=req.bowling_team_id,
            total_runs=0,
            wickets=0,
            legal_balls_bowled=0,
            current_striker_id=req.striker_id,
            current_non_striker_id=req.non_striker_id,
            current_bowler_id=req.bowler_id,
            is_completed=False
        )
        db.add(innings)
        db.flush()

        # Initialize striker batting card
        db.add(BattingScorecard(
            id=str(uuid.uuid4()),
            innings_id=innings.id,
            batsman_id=req.striker_id,
            batting_position=1
        ))
        # Initialize non-striker batting card
        db.add(BattingScorecard(
            id=str(uuid.uuid4()),
            innings_id=innings.id,
            batsman_id=req.non_striker_id,
            batting_position=2
        ))
        # Initialize opening bowler bowling card
        db.add(BowlingScorecard(
            id=str(uuid.uuid4()),
            innings_id=innings.id,
            bowler_id=req.bowler_id
        ))

    match.status = MatchStatus.LIVE.value
    match.current_innings_number = 1
    db.commit()
    return {"success": True, "message": "Match started successfully", "innings_id": innings.id}

@router.post("/quick-create", response_model=GullyMatchResponse, status_code=status.HTTP_201_CREATED)
def quick_create_gully_match(
    req: GullyMatchCreateRequest,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_optional)
):
    """
    1-Click Gully Cricket & Box Cricket Match / League Creator:
    - Auto creates or reuses teams & players from plain text inputs.
    - Configures overs, format, and venue.
    - Sets up opening batsmen & bowler and launches match immediately into LIVE scoring.
    """
    # 1. Helper to find or create Team
    def get_or_create_team(team_name: str, color: str) -> Team:
        clean_name = team_name.strip()
        t = db.query(Team).filter(func.lower(Team.name) == clean_name.lower()).first()
        if not t:
            short = "".join([w[0] for w in clean_name.split() if w])[:4].upper()
            if not short:
                short = clean_name[:3].upper()
            short_code = f"{short}-{uuid.uuid4().hex[:3].upper()}"
            t = Team(
                id=str(uuid.uuid4()),
                name=clean_name,
                short_code=short_code,
                primary_color=color,
                secondary_color="#fbbf24"
            )
            db.add(t)
            db.flush()
        return t

    team_a = get_or_create_team(req.team_a_name, "#047857")
    team_b = get_or_create_team(req.team_b_name, "#1d4ed8")

    # 2. Helper to find or create User by player name
    def get_or_create_player(player_name: str, team_id: str) -> User:
        clean = player_name.strip()
        p = db.query(User).filter(func.lower(User.username) == clean.lower()).first()
        if not p:
            short_id = uuid.uuid4().hex[:6].upper()
            email = f"{clean.lower().replace(' ', '_')}_{short_id}@gully.local"
            p = User(
                id=str(uuid.uuid4()),
                user_id=f"G_{short_id}",
                username=clean,
                email=email,
                role=UserRole.USER.value,
                is_active=True
            )
            db.add(p)
            db.flush()
        
        # Link player to team if not linked
        tp = db.query(TeamPlayer).filter(
            TeamPlayer.team_id == team_id,
            TeamPlayer.user_id == p.id
        ).first()
        if not tp:
            tp = TeamPlayer(
                id=str(uuid.uuid4()),
                team_id=team_id,
                user_id=p.id,
                player_role="ALL_ROUNDER"
            )
            db.add(tp)
            db.flush()
        return p

    # Create/link all players
    team_a_user_objs = [get_or_create_player(pname, team_a.id) for pname in req.team_a_players if pname.strip()]
    team_b_user_objs = [get_or_create_player(pname, team_b.id) for pname in req.team_b_players if pname.strip()]

    # 3. Create the match
    match_num = generate_next_match_number(db)
    match = Match(
        id=str(uuid.uuid4()),
        match_number=match_num,
        description=req.match_name.strip() or f"{team_a.name} vs {team_b.name}",
        team_a_id=team_a.id,
        team_b_id=team_b.id,
        venue=req.venue or "Gully Turf Ground",
        match_date=datetime.utcnow(),
        overs_per_innings=req.overs_per_innings or 6,
        status=MatchStatus.UPCOMING.value
    )
    db.add(match)
    db.flush()

    # Save playing squads for this match
    for u in team_a_user_objs:
        db.add(MatchPlayingXI(id=str(uuid.uuid4()), match_id=match.id, team_id=team_a.id, user_id=u.id))
    for u in team_b_user_objs:
        db.add(MatchPlayingXI(id=str(uuid.uuid4()), match_id=match.id, team_id=team_b.id, user_id=u.id))

    # 4. Check if toss & openers are provided to start match immediately
    if req.striker_name and req.non_striker_name and req.bowler_name:
        is_team_a_toss = (req.toss_winner_team or "TEAM_A").upper() in ["TEAM_A", "A", team_a.name.upper()]
        toss_winner_id = team_a.id if is_team_a_toss else team_b.id
        toss_dec = (req.toss_decision or "BAT").upper()

        if toss_dec == "BAT":
            batting_team_id = toss_winner_id
            bowling_team_id = team_b.id if batting_team_id == team_a.id else team_a.id
        else:
            bowling_team_id = toss_winner_id
            batting_team_id = team_b.id if bowling_team_id == team_a.id else team_a.id

        match.toss_winner_id = toss_winner_id
        match.toss_decision = toss_dec
        match.status = MatchStatus.LIVE.value
        match.current_innings_number = 1

        # Resolve openers
        striker_u = get_or_create_player(req.striker_name, batting_team_id)
        non_striker_u = get_or_create_player(req.non_striker_name, batting_team_id)
        bowler_u = get_or_create_player(req.bowler_name, bowling_team_id)

        innings = MatchInnings(
            id=str(uuid.uuid4()),
            match_id=match.id,
            innings_number=1,
            batting_team_id=batting_team_id,
            bowling_team_id=bowling_team_id,
            total_runs=0,
            wickets=0,
            legal_balls_bowled=0,
            current_striker_id=striker_u.id,
            current_non_striker_id=non_striker_u.id,
            current_bowler_id=bowler_u.id,
            is_completed=False
        )
        db.add(innings)
        db.flush()

        db.add(BattingScorecard(
            id=str(uuid.uuid4()),
            innings_id=innings.id,
            batsman_id=striker_u.id,
            batting_position=1
        ))
        db.add(BattingScorecard(
            id=str(uuid.uuid4()),
            innings_id=innings.id,
            batsman_id=non_striker_u.id,
            batting_position=2
        ))
        db.add(BowlingScorecard(
            id=str(uuid.uuid4()),
            innings_id=innings.id,
            bowler_id=bowler_u.id
        ))

    # 5. If League mode requested with multiple matches, generate upcoming fixtures
    if req.match_type == "LEAGUE" and req.num_matches and req.num_matches > 1:
        for idx in range(2, req.num_matches + 1):
            next_num = generate_next_match_number(db)
            extra_match = Match(
                id=str(uuid.uuid4()),
                match_number=next_num,
                description=f"{req.match_name.strip()} - Match {idx}",
                team_a_id=team_a.id,
                team_b_id=team_b.id,
                venue=req.venue or "Gully Turf Ground",
                match_date=datetime.utcnow(),
                overs_per_innings=req.overs_per_innings or 6,
                status=MatchStatus.UPCOMING.value
            )
            db.add(extra_match)
            db.flush()
            for u in team_a_user_objs:
                db.add(MatchPlayingXI(id=str(uuid.uuid4()), match_id=extra_match.id, team_id=team_a.id, user_id=u.id))
            for u in team_b_user_objs:
                db.add(MatchPlayingXI(id=str(uuid.uuid4()), match_id=extra_match.id, team_id=team_b.id, user_id=u.id))

    db.commit()
    db.refresh(match)

    return {
        "match_id": match.id,
        "match_number": match.match_number,
        "status": match.status,
        "description": match.description,
        "team_a_name": team_a.name,
        "team_b_name": team_b.name,
        "overs": match.overs_per_innings,
        "score_url": f"/admin/score/{match.id}",
        "live_url": f"/live/{match.id}"
    }

import json
import uuid
import math
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.match import Match, MatchInnings, MatchStatus
from app.models.scorecard import BattingScorecard, BowlingScorecard
from app.models.scoring import BallEvent, ExtraType, WicketType
from app.models.team import Team
from app.models.user import User
from app.models.tournament import TournamentSettings
from app.schemas.scoring import BallDeliveryInput

def format_overs(legal_balls: int) -> float:
    completed_overs = legal_balls // 6
    remaining_balls = legal_balls % 6
    return float(f"{completed_overs}.{remaining_balls}")

def calculate_crr(runs: int, legal_balls: int) -> float:
    if legal_balls == 0:
        return 0.0
    return round((runs / (legal_balls / 6.0)), 2)

def calculate_rrr(target: Optional[int], current_runs: int, total_overs: int, legal_balls: int) -> Optional[float]:
    if not target:
        return None
    runs_needed = target - current_runs
    balls_remaining = (total_overs * 6) - legal_balls
    if balls_remaining <= 0:
        return 0.0 if runs_needed <= 0 else 99.99
    if runs_needed <= 0:
        return 0.0
    return round((runs_needed / (balls_remaining / 6.0)), 2)

def generate_ball_commentary(
    bowler_name: str,
    striker_name: str,
    delivery: BallDeliveryInput,
    total_ball_runs: int
) -> str:
    if delivery.custom_commentary:
        return delivery.custom_commentary

    if delivery.is_wicket:
        w_type = delivery.wicket_type or "OUT"
        if w_type == WicketType.ROOF_NET_CATCH.value:
            return f"WICKET! {striker_name} caught off the top net! Sharp box cricket reflex catch!"
        elif w_type == WicketType.ONE_TIP_ONE_HAND.value:
            return f"WICKET! ONE-TIP-ONE-HAND! Brilliant catch taken cleanly by the fielder!"
        elif w_type == WicketType.DIRECT_OUT_OF_BOX.value:
            return f"OUT! Hit directly outside the box enclosure without bouncing! Batting side loses a wicket."
        return f"WICKET! {bowler_name} to {striker_name}: OUT ({w_type.replace('_', ' ')})!"
    
    if delivery.extra_type == ExtraType.WIDE.value:
        return f"WIDE ball down the leg/off line by {bowler_name}."
    if delivery.extra_type == ExtraType.NO_BALL.value:
        return f"NO BALL called against {bowler_name}!"
    if delivery.extra_type == ExtraType.ROOF_NET_HIT.value:
        return f"Ball strikes the upper roof net. Awarded {total_ball_runs} run(s) per box rules."
    if delivery.extra_type == ExtraType.WALL_HIT.value:
        return f"Clean strike directly hitting the scoring back wall for {total_ball_runs} runs!"

    if delivery.runs_scored == 6:
        return f"MAXIMUM! {striker_name} connects sweetly for a SIX over the boundary marker!"
    elif delivery.runs_scored == 4:
        return f"FOUR! Superb box placement by {striker_name}, piercing through the gap!"
    elif delivery.runs_scored == 0:
        return f"Dot ball. {bowler_name} bowls a tight line, defended by {striker_name}."
    elif delivery.runs_scored == 1:
        return f"Quick single taken by {striker_name}."
    elif delivery.runs_scored == 2:
        return f"Brisk double taken across the box pitch by {striker_name}."
    elif delivery.runs_scored == 3:
        return f"3 runs scored off excellent running by {striker_name}."
    return f"{delivery.runs_scored} run(s) scored."

def capture_innings_snapshot(db: Session, innings: MatchInnings) -> str:
    batting_cards = db.query(BattingScorecard).filter(BattingScorecard.innings_id == innings.id).all()
    bowling_cards = db.query(BowlingScorecard).filter(BowlingScorecard.innings_id == innings.id).all()
    
    snapshot = {
        "innings": {
            "total_runs": innings.total_runs,
            "wickets": innings.wickets,
            "legal_balls_bowled": innings.legal_balls_bowled,
            "wide_runs": innings.wide_runs,
            "no_ball_runs": innings.no_ball_runs,
            "bye_runs": innings.bye_runs,
            "leg_bye_runs": innings.leg_bye_runs,
            "penalty_runs": innings.penalty_runs,
            "current_striker_id": innings.current_striker_id,
            "current_non_striker_id": innings.current_non_striker_id,
            "current_bowler_id": innings.current_bowler_id,
            "is_completed": innings.is_completed
        },
        "batting_cards": [
            {
                "id": bc.id,
                "batsman_id": bc.batsman_id,
                "runs": bc.runs,
                "balls_faced": bc.balls_faced,
                "fours": bc.fours,
                "sixes": bc.sixes,
                "strike_rate": bc.strike_rate,
                "is_out": bc.is_out,
                "dismissal_type": bc.dismissal_type,
                "bowler_id": bc.bowler_id,
                "fielder_id": bc.fielder_id
            }
            for bc in batting_cards
        ],
        "bowling_cards": [
            {
                "id": bc.id,
                "bowler_id": bc.bowler_id,
                "legal_balls": bc.legal_balls,
                "overs_bowled": bc.overs_bowled,
                "maidens": bc.maidens,
                "runs_conceded": bc.runs_conceded,
                "wickets": bc.wickets,
                "economy_rate": bc.economy_rate,
                "wides": bc.wides,
                "no_balls": bc.no_balls
            }
            for bc in bowling_cards
        ]
    }
    return json.dumps(snapshot)

def process_ball_delivery(
    db: Session,
    match_id: str,
    delivery: BallDeliveryInput
) -> Dict[str, Any]:
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise ValueError("Match not found")
    if match.status != MatchStatus.LIVE.value:
        raise ValueError(f"Match is not in LIVE status (current status: {match.status})")

    innings = db.query(MatchInnings).filter(
        MatchInnings.match_id == match.id,
        MatchInnings.innings_number == match.current_innings_number
    ).first()
    if not innings or innings.is_completed:
        raise ValueError("Active innings not found or already completed")

    # Fetch tournament settings to apply Box Cricket rules
    settings_obj = db.query(TournamentSettings).first()
    wide_penalty = settings_obj.wide_runs if settings_obj else 1
    noball_penalty = settings_obj.no_ball_runs if settings_obj else 1
    wide_is_legal = False if not settings_obj or settings_obj.wide_reball else True
    noball_is_legal = False if not settings_obj or settings_obj.no_ball_reball else True
    max_wickets_allowed = settings_obj.max_wickets if settings_obj else 7
    allow_last_man = settings_obj.allow_last_man_batting if settings_obj else False

    if not innings.current_striker_id:
        raise ValueError("Active striker not selected on field")

    # If last man batting is NOT enabled, non_striker is required
    if not allow_last_man and not innings.current_non_striker_id:
        raise ValueError("Active non-striker not selected on field")

    if not innings.current_bowler_id:
        raise ValueError("Active bowler not selected on field")

    # Capture snapshot before mutating anything
    snapshot_json = capture_innings_snapshot(db, innings)

    striker_user = db.query(User).filter(User.id == innings.current_striker_id).first()
    non_striker_user = db.query(User).filter(User.id == innings.current_non_striker_id).first() if innings.current_non_striker_id else None
    bowler_user = db.query(User).filter(User.id == innings.current_bowler_id).first()

    # Determine legal delivery & extras
    is_legal = True
    extra_runs = delivery.extra_runs

    if delivery.extra_type == ExtraType.WIDE.value:
        is_legal = wide_is_legal
        if extra_runs == 0:
            extra_runs = wide_penalty
    elif delivery.extra_type == ExtraType.NO_BALL.value:
        is_legal = noball_is_legal
        if extra_runs == 0:
            extra_runs = noball_penalty
    elif delivery.extra_type in [ExtraType.ROOF_NET_HIT.value, ExtraType.WALL_HIT.value]:
        # Box cricket custom events are legal balls unless marked otherwise
        is_legal = True

    total_ball_runs = delivery.runs_scored + extra_runs
    
    # Update innings totals
    innings.total_runs += total_ball_runs
    if delivery.extra_type == ExtraType.WIDE.value:
        innings.wide_runs += extra_runs
    elif delivery.extra_type == ExtraType.NO_BALL.value:
        innings.no_ball_runs += extra_runs
    elif delivery.extra_type == ExtraType.BYE.value:
        innings.bye_runs += extra_runs
    elif delivery.extra_type == ExtraType.LEG_BYE.value:
        innings.leg_bye_runs += extra_runs

    # Increment legal balls
    current_legal_balls = innings.legal_balls_bowled
    over_number = current_legal_balls // 6
    ball_in_over = (current_legal_balls % 6) + 1 if is_legal else (current_legal_balls % 6)

    if is_legal:
        innings.legal_balls_bowled += 1

    # Update Batting Scorecard
    striker_card = db.query(BattingScorecard).filter(
        BattingScorecard.innings_id == innings.id,
        BattingScorecard.batsman_id == innings.current_striker_id
    ).first()
    if not striker_card:
        striker_card = BattingScorecard(
            id=str(uuid.uuid4()),
            innings_id=innings.id,
            batsman_id=innings.current_striker_id
        )
        db.add(striker_card)

    if delivery.extra_type != ExtraType.WIDE.value:
        # Wides do not count towards batsman balls faced
        striker_card.balls_faced += 1

    # Off-the-bat runs go to batsman (Byes and Leg Byes do NOT count to batsman)
    if delivery.extra_type not in [ExtraType.BYE.value, ExtraType.LEG_BYE.value]:
        striker_card.runs += delivery.runs_scored
        if delivery.runs_scored == 4:
            striker_card.fours += 1
        elif delivery.runs_scored == 6:
            striker_card.sixes += 1

    if striker_card.balls_faced > 0:
        striker_card.strike_rate = round((striker_card.runs / striker_card.balls_faced) * 100, 2)

    # Update Bowling Scorecard
    bowler_card = db.query(BowlingScorecard).filter(
        BowlingScorecard.innings_id == innings.id,
        BowlingScorecard.bowler_id == innings.current_bowler_id
    ).first()
    if not bowler_card:
        bowler_card = BowlingScorecard(
            id=str(uuid.uuid4()),
            innings_id=innings.id,
            bowler_id=innings.current_bowler_id
        )
        db.add(bowler_card)

    if is_legal:
        bowler_card.legal_balls += 1
        bowler_card.overs_bowled = format_overs(bowler_card.legal_balls)

    # Runs conceded by bowler (Byes and Leg Byes do NOT count against the bowler)
    conceded_this_ball = total_ball_runs
    if delivery.extra_type in [ExtraType.BYE.value, ExtraType.LEG_BYE.value]:
        conceded_this_ball = 0
    bowler_card.runs_conceded += conceded_this_ball

    if delivery.extra_type == ExtraType.WIDE.value:
        bowler_card.wides += 1
    elif delivery.extra_type == ExtraType.NO_BALL.value:
        bowler_card.no_balls += 1

    if bowler_card.legal_balls > 0:
        bowler_card.economy_rate = round((bowler_card.runs_conceded / (bowler_card.legal_balls / 6.0)), 2)

    # Handle Wickets
    dismissed_id = None
    if delivery.is_wicket:
        innings.wickets += 1
        dismissed_id = delivery.dismissed_player_id or innings.current_striker_id
        
        # Bowler credited unless run-out or direct-out-of-box
        if delivery.wicket_type not in [WicketType.RUN_OUT.value, WicketType.DIRECT_OUT_OF_BOX.value]:
            bowler_card.wickets += 1

        dismissed_card = db.query(BattingScorecard).filter(
            BattingScorecard.innings_id == innings.id,
            BattingScorecard.batsman_id == dismissed_id
        ).first()
        if dismissed_card:
            dismissed_card.is_out = True
            dismissed_card.dismissal_type = delivery.wicket_type or WicketType.BOWLED.value
            dismissed_card.bowler_id = innings.current_bowler_id if delivery.wicket_type != WicketType.RUN_OUT.value else None
            dismissed_card.fielder_id = delivery.fielder_id

        # Clear dismissed batsman slot so scorer can pick the next batsman
        if innings.current_striker_id == dismissed_id:
            innings.current_striker_id = None
        elif innings.current_non_striker_id == dismissed_id:
            innings.current_non_striker_id = None

    # Handle Strike Rotation
    runs_for_rotation = delivery.runs_scored
    if delivery.extra_type in [ExtraType.BYE.value, ExtraType.LEG_BYE.value]:
        runs_for_rotation = delivery.extra_runs

    should_rotate = (runs_for_rotation % 2 == 1)
    if should_rotate and innings.current_striker_id and innings.current_non_striker_id:
        innings.current_striker_id, innings.current_non_striker_id = (
            innings.current_non_striker_id,
            innings.current_striker_id
        )

    # Check End of Over (6 legal deliveries)
    over_completed = is_legal and (innings.legal_balls_bowled % 6 == 0)
    if over_completed and innings.current_striker_id and innings.current_non_striker_id:
        innings.current_striker_id, innings.current_non_striker_id = (
            innings.current_non_striker_id,
            innings.current_striker_id
        )
        innings.current_bowler_id = None

    # Create BallEvent record
    ball_seq = (db.query(BallEvent).filter(BallEvent.innings_id == innings.id).count()) + 1
    commentary_text = generate_ball_commentary(
        bowler_name=bowler_user.username if bowler_user else "Bowler",
        striker_name=striker_user.username if striker_user else "Batsman",
        delivery=delivery,
        total_ball_runs=total_ball_runs
    )

    ball_event = BallEvent(
        id=str(uuid.uuid4()),
        innings_id=innings.id,
        ball_sequence=ball_seq,
        over_number=over_number,
        ball_in_over=ball_in_over if is_legal else 0,
        bowler_id=bowler_user.id if bowler_user else "",
        striker_id=striker_user.id if striker_user else "",
        non_striker_id=non_striker_user.id if non_striker_user else None,
        runs_scored=delivery.runs_scored,
        extra_type=delivery.extra_type,
        extra_runs=extra_runs,
        total_ball_runs=total_ball_runs,
        is_legal_delivery=is_legal,
        is_wicket=delivery.is_wicket,
        wicket_type=delivery.wicket_type if delivery.is_wicket else None,
        dismissed_player_id=dismissed_id,
        fielder_id=delivery.fielder_id,
        commentary=commentary_text,
        previous_state_snapshot=snapshot_json
    )
    db.add(ball_event)

    # Check Innings / Match Completion using configurable Box Cricket rules
    max_overs_balls = match.overs_per_innings * 6
    is_innings_ended = False
    
    # Condition A: Configured max wickets reached (default 7 wickets for 8 players, etc.)
    if innings.wickets >= max_wickets_allowed:
        is_innings_ended = True
    # Condition B: Overs completed
    elif innings.legal_balls_bowled >= max_overs_balls:
        is_innings_ended = True
    # Condition C: 2nd Innings Target chased down
    elif match.current_innings_number == 2 and match.target_runs is not None:
        if innings.total_runs >= match.target_runs:
            is_innings_ended = True

    if is_innings_ended:
        innings.is_completed = True
        if match.current_innings_number == 1:
            match.target_runs = innings.total_runs + 1
            # Auto prepare 2nd innings
            match.current_innings_number = 2
            second_innings = MatchInnings(
                id=str(uuid.uuid4()),
                match_id=match.id,
                innings_number=2,
                batting_team_id=innings.bowling_team_id,
                bowling_team_id=innings.batting_team_id,
                total_runs=0,
                wickets=0,
                legal_balls_bowled=0,
                is_completed=False
            )
            db.add(second_innings)
        else:
            # Match Concluded!
            match.status = MatchStatus.COMPLETED.value
            first_inn = db.query(MatchInnings).filter(
                MatchInnings.match_id == match.id,
                MatchInnings.innings_number == 1
            ).first()
            first_runs = first_inn.total_runs if first_inn else 0
            second_runs = innings.total_runs

            batting_team = db.query(Team).filter(Team.id == innings.batting_team_id).first()
            bowling_team = db.query(Team).filter(Team.id == innings.bowling_team_id).first()

            if second_runs >= (match.target_runs or (first_runs + 1)):
                wickets_remaining = max_wickets_allowed - innings.wickets
                match.winner_id = innings.batting_team_id
                match.win_margin = f"{batting_team.name} won by {max(wickets_remaining, 1)} wickets"
            elif second_runs < first_runs:
                runs_diff = first_runs - second_runs
                match.winner_id = innings.bowling_team_id
                match.win_margin = f"{bowling_team.name} won by {runs_diff} runs"
            else:
                match.winner_id = None
                match.win_margin = "Match Tied!"

    db.commit()
    return build_match_live_payload(db, match.id)

def undo_last_ball(db: Session, match_id: str) -> Dict[str, Any]:
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise ValueError("Match not found")

    innings = db.query(MatchInnings).filter(
        MatchInnings.match_id == match.id,
        MatchInnings.innings_number == match.current_innings_number
    ).first()
    if not innings:
        raise ValueError("No active innings to undo")

    last_ball = db.query(BallEvent).filter(
        BallEvent.innings_id == innings.id
    ).order_by(BallEvent.ball_sequence.desc()).first()

    if not last_ball:
        if match.current_innings_number == 2:
            first_inn = db.query(MatchInnings).filter(
                MatchInnings.match_id == match.id,
                MatchInnings.innings_number == 1
            ).first()
            if first_inn:
                db.delete(innings)
                match.current_innings_number = 1
                match.status = MatchStatus.LIVE.value
                first_inn.is_completed = False
                db.commit()
                return build_match_live_payload(db, match.id)
        raise ValueError("No balls to undo in this innings")

    if not last_ball.previous_state_snapshot:
        raise ValueError("Cannot undo: ball does not contain a previous state snapshot")

    snapshot = json.loads(last_ball.previous_state_snapshot)
    inn_state = snapshot["innings"]

    innings.total_runs = inn_state["total_runs"]
    innings.wickets = inn_state["wickets"]
    innings.legal_balls_bowled = inn_state["legal_balls_bowled"]
    innings.wide_runs = inn_state["wide_runs"]
    innings.no_ball_runs = inn_state["no_ball_runs"]
    innings.bye_runs = inn_state["bye_runs"]
    innings.leg_bye_runs = inn_state["leg_bye_runs"]
    innings.penalty_runs = inn_state["penalty_runs"]
    innings.current_striker_id = inn_state["current_striker_id"]
    innings.current_non_striker_id = inn_state["current_non_striker_id"]
    innings.current_bowler_id = inn_state["current_bowler_id"]
    innings.is_completed = inn_state["is_completed"]

    for card_state in snapshot["batting_cards"]:
        bc = db.query(BattingScorecard).filter(BattingScorecard.id == card_state["id"]).first()
        if bc:
            bc.runs = card_state["runs"]
            bc.balls_faced = card_state["balls_faced"]
            bc.fours = card_state["fours"]
            bc.sixes = card_state["sixes"]
            bc.strike_rate = card_state["strike_rate"]
            bc.is_out = card_state["is_out"]
            bc.dismissal_type = card_state["dismissal_type"]
            bc.bowler_id = card_state["bowler_id"]
            bc.fielder_id = card_state["fielder_id"]

    for b_state in snapshot["bowling_cards"]:
        bc = db.query(BowlingScorecard).filter(BowlingScorecard.id == b_state["id"]).first()
        if bc:
            bc.legal_balls = b_state["legal_balls"]
            bc.overs_bowled = b_state["overs_bowled"]
            bc.maidens = b_state["maidens"]
            bc.runs_conceded = b_state["runs_conceded"]
            bc.wickets = b_state["wickets"]
            bc.economy_rate = b_state["economy_rate"]
            bc.wides = b_state["wides"]
            bc.no_balls = b_state["no_balls"]

    if match.status == MatchStatus.COMPLETED.value:
        match.status = MatchStatus.LIVE.value
        match.winner_id = None
        match.win_margin = None

    db.delete(last_ball)
    db.commit()
    return build_match_live_payload(db, match.id)

def build_match_live_payload(db: Session, match_id: str) -> Dict[str, Any]:
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise ValueError("Match not found")

    innings = db.query(MatchInnings).filter(
        MatchInnings.match_id == match.id,
        MatchInnings.innings_number == match.current_innings_number
    ).first()

    if not innings:
        innings = db.query(MatchInnings).filter(
            MatchInnings.match_id == match.id,
            MatchInnings.innings_number == 1
        ).first()

    batting_team = db.query(Team).filter(Team.id == (innings.batting_team_id if innings else match.team_a_id)).first()
    bowling_team = db.query(Team).filter(Team.id == (innings.bowling_team_id if innings else match.team_b_id)).first()

    striker_data = None
    non_striker_data = None
    bowler_data = None

    if innings:
        if innings.current_striker_id:
            user = db.query(User).filter(User.id == innings.current_striker_id).first()
            card = db.query(BattingScorecard).filter(
                BattingScorecard.innings_id == innings.id,
                BattingScorecard.batsman_id == innings.current_striker_id
            ).first()
            striker_data = {
                "id": user.id if user else None,
                "name": user.username if user else "Batsman",
                "runs": card.runs if card else 0,
                "balls": card.balls_faced if card else 0,
                "fours": card.fours if card else 0,
                "sixes": card.sixes if card else 0,
                "sr": card.strike_rate if card else 0.0
            }

        if innings.current_non_striker_id:
            user = db.query(User).filter(User.id == innings.current_non_striker_id).first()
            card = db.query(BattingScorecard).filter(
                BattingScorecard.innings_id == innings.id,
                BattingScorecard.batsman_id == innings.current_non_striker_id
            ).first()
            non_striker_data = {
                "id": user.id if user else None,
                "name": user.username if user else "Batsman",
                "runs": card.runs if card else 0,
                "balls": card.balls_faced if card else 0,
                "fours": card.fours if card else 0,
                "sixes": card.sixes if card else 0,
                "sr": card.strike_rate if card else 0.0
            }

        if innings.current_bowler_id:
            user = db.query(User).filter(User.id == innings.current_bowler_id).first()
            card = db.query(BowlingScorecard).filter(
                BowlingScorecard.innings_id == innings.id,
                BowlingScorecard.bowler_id == innings.current_bowler_id
            ).first()
            bowler_data = {
                "id": user.id if user else None,
                "name": user.username if user else "Bowler",
                "overs": card.overs_bowled if card else 0.0,
                "maidens": card.maidens if card else 0,
                "runs": card.runs_conceded if card else 0,
                "wickets": card.wickets if card else 0,
                "econ": card.economy_rate if card else 0.0
            }

    total_runs = innings.total_runs if innings else 0
    wickets = innings.wickets if innings else 0
    legal_balls = innings.legal_balls_bowled if innings else 0
    overs = format_overs(legal_balls)
    crr = calculate_crr(total_runs, legal_balls)
    rrr = calculate_rrr(match.target_runs, total_runs, match.overs_per_innings, legal_balls)

    recent_balls = []
    last_commentary = None
    if innings:
        events = db.query(BallEvent).filter(
            BallEvent.innings_id == innings.id
        ).order_by(BallEvent.ball_sequence.desc()).limit(12).all()
        for be in reversed(events):
            label = str(be.runs_scored)
            if be.is_wicket:
                label = "W"
            elif be.extra_type == ExtraType.WIDE.value:
                label = f"{be.extra_runs}wd"
            elif be.extra_type == ExtraType.NO_BALL.value:
                label = f"{be.total_ball_runs}nb"
            elif be.extra_type == ExtraType.BYE.value:
                label = f"{be.extra_runs}b"
            elif be.extra_type == ExtraType.LEG_BYE.value:
                label = f"{be.extra_runs}lb"
            elif be.extra_type == ExtraType.ROOF_NET_HIT.value:
                label = f"{be.total_ball_runs}net"
            elif be.extra_type == ExtraType.WALL_HIT.value:
                label = f"{be.total_ball_runs}wall"

            recent_balls.append({
                "sequence": be.ball_sequence,
                "over": be.over_number,
                "ball_in_over": be.ball_in_over,
                "label": label,
                "runs": be.total_ball_runs,
                "is_wicket": be.is_wicket,
                "commentary": be.commentary
            })
        if events:
            last_commentary = events[0].commentary

    return {
        "match_id": match.id,
        "match_number": match.match_number,
        "status": match.status,
        "current_innings_number": match.current_innings_number,
        "overs_per_innings": match.overs_per_innings,
        "batting_team": {
            "id": batting_team.id if batting_team else None,
            "name": batting_team.name if batting_team else "Team A",
            "short_code": batting_team.short_code if batting_team else "TMA",
            "logo_url": batting_team.logo_url if batting_team else None,
            "primary_color": batting_team.primary_color if batting_team else "#047857"
        },
        "bowling_team": {
            "id": bowling_team.id if bowling_team else None,
            "name": bowling_team.name if bowling_team else "Team B",
            "short_code": bowling_team.short_code if bowling_team else "TMB",
            "logo_url": bowling_team.logo_url if bowling_team else None,
            "primary_color": bowling_team.primary_color if bowling_team else "#fbbf24"
        },
        "total_runs": total_runs,
        "wickets": wickets,
        "overs": overs,
        "legal_balls": legal_balls,
        "crr": crr,
        "target": match.target_runs,
        "rrr": rrr,
        "striker": striker_data,
        "non_striker": non_striker_data,
        "bowler": bowler_data,
        "recent_balls": recent_balls,
        "last_commentary": last_commentary,
        "win_margin": match.win_margin,
        "is_innings_completed": innings.is_completed if innings else False,
        "is_match_completed": match.status == MatchStatus.COMPLETED.value
    }

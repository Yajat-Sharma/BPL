from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.team import Team
from app.models.match import Match, MatchInnings, MatchStatus
from app.models.scorecard import BattingScorecard, BowlingScorecard
from app.models.user import User

def calculate_points_table(db: Session) -> List[Dict[str, Any]]:
    teams = db.query(Team).all()
    completed_matches = db.query(Match).filter(Match.status == MatchStatus.COMPLETED.value).all()

    table_data = []

    for t in teams:
        played = 0
        won = 0
        lost = 0
        tied = 0
        no_result = 0
        points = 0
        
        runs_scored_total = 0
        overs_faced_total_balls = 0
        runs_conceded_total = 0
        overs_bowled_total_balls = 0

        for m in completed_matches:
            if m.team_a_id != t.id and m.team_b_id != t.id:
                continue

            played += 1
            if m.winner_id == t.id:
                won += 1
                points += 2
            elif m.winner_id is None:
                tied += 1
                points += 1
            else:
                lost += 1

            # NRR calculation
            for inn in m.innings:
                if inn.batting_team_id == t.id:
                    runs_scored_total += inn.total_runs
                    # If all out, count full allotted quota of overs
                    balls = (m.overs_per_innings * 6) if inn.wickets >= 10 else inn.legal_balls_bowled
                    overs_faced_total_balls += balls
                elif inn.bowling_team_id == t.id:
                    runs_conceded_total += inn.total_runs
                    balls = (m.overs_per_innings * 6) if inn.wickets >= 10 else inn.legal_balls_bowled
                    overs_bowled_total_balls += balls

        for_rate = (runs_scored_total / (overs_faced_total_balls / 6.0)) if overs_faced_total_balls > 0 else 0.0
        against_rate = (runs_conceded_total / (overs_bowled_total_balls / 6.0)) if overs_bowled_total_balls > 0 else 0.0
        nrr = round(for_rate - against_rate, 3)

        table_data.append({
            "team_id": t.id,
            "team_name": t.name,
            "short_code": t.short_code,
            "logo_url": t.logo_url,
            "primary_color": t.primary_color,
            "played": played,
            "won": won,
            "lost": lost,
            "tied": tied,
            "no_result": no_result,
            "points": points,
            "nrr": nrr
        })

    # Sort by Points (descending), then NRR (descending)
    table_data.sort(key=lambda x: (x["points"], x["nrr"]), reverse=True)

    # Assign position ranks
    for idx, item in enumerate(table_data):
        item["position"] = idx + 1

    return table_data

def calculate_top_batsmen(db: Session, limit: int = 10) -> List[Dict[str, Any]]:
    # Sum runs across all batting scorecards per batsman
    results = db.query(
        BattingScorecard.batsman_id,
        func.sum(BattingScorecard.runs).label("total_runs"),
        func.sum(BattingScorecard.balls_faced).label("total_balls"),
        func.sum(BattingScorecard.fours).label("total_fours"),
        func.sum(BattingScorecard.sixes).label("total_sixes"),
        func.max(BattingScorecard.runs).label("highest_score"),
        func.count(BattingScorecard.id).label("innings_played")
    ).group_by(BattingScorecard.batsman_id).order_by(func.sum(BattingScorecard.runs).desc()).limit(limit).all()

    top_batsmen = []
    for r in results:
        user = db.query(User).filter(User.id == r.batsman_id).first()
        sr = round((r.total_runs / r.total_balls) * 100, 2) if r.total_balls > 0 else 0.0
        top_batsmen.append({
            "player_id": r.batsman_id,
            "user_id": user.user_id if user else "BPL",
            "name": user.username if user else "Player",
            "total_runs": int(r.total_runs or 0),
            "balls_faced": int(r.total_balls or 0),
            "fours": int(r.total_fours or 0),
            "sixes": int(r.total_sixes or 0),
            "highest_score": int(r.highest_score or 0),
            "strike_rate": sr,
            "innings": r.innings_played
        })
    return top_batsmen

def calculate_top_bowlers(db: Session, limit: int = 10) -> List[Dict[str, Any]]:
    # Sum wickets across all bowling scorecards per bowler
    results = db.query(
        BowlingScorecard.bowler_id,
        func.sum(BowlingScorecard.wickets).label("total_wickets"),
        func.sum(BowlingScorecard.runs_conceded).label("total_runs"),
        func.sum(BowlingScorecard.legal_balls).label("total_balls"),
        func.sum(BowlingScorecard.maidens).label("total_maidens"),
        func.count(BowlingScorecard.id).label("innings_bowled")
    ).group_by(BowlingScorecard.bowler_id).order_by(func.sum(BowlingScorecard.wickets).desc(), func.sum(BowlingScorecard.runs_conceded).asc()).limit(limit).all()

    top_bowlers = []
    for r in results:
        user = db.query(User).filter(User.id == r.bowler_id).first()
        overs_float = (r.total_balls // 6) + ((r.total_balls % 6) / 10.0)
        economy = round((r.total_runs / (r.total_balls / 6.0)), 2) if r.total_balls > 0 else 0.0
        bowling_avg = round((r.total_runs / r.total_wickets), 2) if (r.total_wickets and r.total_wickets > 0) else 0.0

        top_bowlers.append({
            "player_id": r.bowler_id,
            "user_id": user.user_id if user else "BPL",
            "name": user.username if user else "Player",
            "wickets": int(r.total_wickets or 0),
            "runs_conceded": int(r.total_runs or 0),
            "overs": overs_float,
            "economy": economy,
            "average": bowling_avg,
            "maidens": int(r.total_maidens or 0)
        })
    return top_bowlers

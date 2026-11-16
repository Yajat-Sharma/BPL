import pytest
from app.database import SessionLocal, Base, engine
from app.models.match import Match, MatchInnings, MatchStatus
from app.models.team import Team
from app.models.user import User
from app.schemas.scoring import BallDeliveryInput
from app.services.scoring_engine import process_ball_delivery, undo_last_ball, build_match_live_payload

def test_scoring_strike_rotation_and_undo():
    db = SessionLocal()
    try:
        # Find the LIVE match M02
        match = db.query(Match).filter(Match.match_number == "M02").first()
        assert match is not None

        live_state_initial = build_match_live_payload(db, match.id)
        init_runs = live_state_initial["total_runs"]
        init_balls = live_state_initial["legal_balls"]
        init_striker = live_state_initial["striker"]["id"]
        init_non_striker = live_state_initial["non_striker"]["id"]

        # 1. Deliver a single (1 run) -> strike should rotate!
        delivery = BallDeliveryInput(
            runs_scored=1,
            extra_type="NONE",
            extra_runs=0,
            is_wicket=False
        )
        updated = process_ball_delivery(db, match.id, delivery)
        assert updated["total_runs"] == init_runs + 1
        assert updated["legal_balls"] == init_balls + 1
        # Batsmen should have swapped
        assert updated["striker"]["id"] == init_non_striker
        assert updated["non_striker"]["id"] == init_striker

        # 2. Undo delivery -> state should return exactly to initial
        reverted = undo_last_ball(db, match.id)
        assert reverted["total_runs"] == init_runs
        assert reverted["legal_balls"] == init_balls
        assert reverted["striker"]["id"] == init_striker
        assert reverted["non_striker"]["id"] == init_non_striker
        print("✓ Strike rotation & Undo tested successfully!")

    finally:
        db.close()

if __name__ == "__main__":
    test_scoring_strike_rotation_and_undo()

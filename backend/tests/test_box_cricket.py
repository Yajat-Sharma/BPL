import pytest
from app.database import SessionLocal
from app.models.match import Match
from app.models.tournament import TournamentSettings
from app.schemas.scoring import BallDeliveryInput
from app.services.scoring_engine import process_ball_delivery, undo_last_ball, build_match_live_payload

def test_box_cricket_special_events_and_rules():
    db = SessionLocal()
    try:
        # Verify box cricket settings
        settings = db.query(TournamentSettings).first()
        assert settings is not None
        assert settings.players_per_team == 8
        assert settings.max_wickets == 7

        # Live Match M02
        match = db.query(Match).filter(Match.match_number == "M02").first()
        assert match is not None

        init_state = build_match_live_payload(db, match.id)
        init_runs = init_state["total_runs"]

        # 1. Test Box Cricket Wall Hit (+4 runs)
        delivery_wall = BallDeliveryInput(
            runs_scored=4,
            extra_type="WALL_HIT",
            extra_runs=0,
            is_wicket=False
        )
        res_wall = process_ball_delivery(db, match.id, delivery_wall)
        assert res_wall["total_runs"] == init_runs + 4
        print("✓ Box Cricket Direct Wall 4 scored successfully!")

        # 2. Test Undo
        reverted = undo_last_ball(db, match.id)
        assert reverted["total_runs"] == init_runs
        print("✓ Undo restored exact score!")

        # 3. Test Box Cricket Top Net Hit (+1 extra run)
        delivery_net = BallDeliveryInput(
            runs_scored=0,
            extra_type="ROOF_NET_HIT",
            extra_runs=1,
            is_wicket=False
        )
        res_net = process_ball_delivery(db, match.id, delivery_net)
        assert res_net["total_runs"] == init_runs + 1
        print("✓ Box Cricket Top Net Hit (+1) scored successfully!")

        # 4. Clean up with Undo
        undo_last_ball(db, match.id)
        print("✓ Cleaned up test delivery successfully!")

    finally:
        db.close()

if __name__ == "__main__":
    test_box_cricket_special_events_and_rules()

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.stats_service import calculate_points_table, calculate_top_batsmen, calculate_top_bowlers

router = APIRouter(prefix="/stats", tags=["Statistics & Leaderboards"])

@router.get("/points-table")
def get_points_table(db: Session = Depends(get_db)):
    return calculate_points_table(db)

@router.get("/orange-cap")
def get_orange_cap(db: Session = Depends(get_db)):
    return calculate_top_batsmen(db, limit=10)

@router.get("/purple-cap")
def get_purple_cap(db: Session = Depends(get_db)):
    return calculate_top_bowlers(db, limit=10)

@router.get("/summary")
def get_tournament_stats_summary(db: Session = Depends(get_db)):
    points_table = calculate_points_table(db)
    top_batsmen = calculate_top_batsmen(db, limit=5)
    top_bowlers = calculate_top_bowlers(db, limit=5)
    
    return {
        "points_table": points_table,
        "orange_cap_leader": top_batsmen[0] if top_batsmen else None,
        "purple_cap_leader": top_bowlers[0] if top_bowlers else None,
        "top_batsmen": top_batsmen,
        "top_bowlers": top_bowlers
    }

from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Boolean
from app.database import Base

class TournamentSettings(Base):
    __tablename__ = "tournament_settings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    tournament_name = Column(String(150), default="Bairajeshwar Premier League (BPL)")
    banner_url = Column(String(500), nullable=True)
    logo_url = Column(String(500), nullable=True)
    total_teams = Column(Integer, default=8)
    overs_per_match = Column(Integer, default=6) # Box cricket typical default 6 overs
    points_win = Column(Integer, default=2)
    points_tie = Column(Integer, default=1)
    points_no_result = Column(Integer, default=1)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    status = Column(String(50), default="UPCOMING") # UPCOMING, ONGOING, COMPLETED
    
    # --- BOX CRICKET CONFIGURATION RULES ---
    players_per_team = Column(Integer, default=8)            # Box cricket typical 6 to 8 players
    max_wickets = Column(Integer, default=7)                 # Players allowed to bat (e.g. 7 wickets = 8th is last man)
    allow_last_man_batting = Column(Boolean, default=False)  # In box cricket, last man can bat alone
    wide_runs = Column(Integer, default=1)                   # Configurable runs awarded for wide
    no_ball_runs = Column(Integer, default=1)                # Configurable runs awarded for no-ball
    no_ball_reball = Column(Boolean, default=True)           # Whether no-ball must be re-bowled
    wide_reball = Column(Boolean, default=True)              # Whether wide must be re-bowled
    roof_net_hit_rule = Column(String(50), default="DEAD_BALL") # DEAD_BALL, RUNS_1, RUNS_2, OUT
    direct_hit_wall_rule = Column(String(50), default="RUNS_4") # RUNS_4, RUNS_6, OUT
    allow_lbw = Column(Boolean, default=False)               # Many box crickets disable LBW
    over_limit_per_bowler = Column(Integer, default=2)       # Max overs one bowler can bowl
    
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

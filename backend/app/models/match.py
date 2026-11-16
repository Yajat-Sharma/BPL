import enum
from datetime import datetime
from sqlalchemy import Column, String, ForeignKey, Integer, DateTime, Boolean, Float
from sqlalchemy.orm import relationship
from app.database import Base

class MatchStatus(str, enum.Enum):
    UPCOMING = "UPCOMING"
    LIVE = "LIVE"
    COMPLETED = "COMPLETED"
    ABANDONED = "ABANDONED"

class TossDecision(str, enum.Enum):
    BAT = "BAT"
    BOWL = "BOWL"

class Match(Base):
    __tablename__ = "matches"

    id = Column(String(36), primary_key=True, index=True)
    match_number = Column(String(20), unique=True, nullable=False) # e.g. M01, M02
    description = Column(String(255), nullable=True) # e.g. "Match 1: Building Derby"
    team_a_id = Column(String(36), ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    team_b_id = Column(String(36), ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    venue = Column(String(100), default="Bairajeshwar Cricket Ground")
    match_date = Column(DateTime, nullable=False)
    overs_per_innings = Column(Integer, default=10)
    status = Column(String(20), default=MatchStatus.UPCOMING.value, nullable=False)
    
    toss_winner_id = Column(String(36), ForeignKey("teams.id", ondelete="SET NULL"), nullable=True)
    toss_decision = Column(String(10), nullable=True) # BAT or BOWL
    winner_id = Column(String(36), ForeignKey("teams.id", ondelete="SET NULL"), nullable=True)
    win_margin = Column(String(100), nullable=True) # e.g. "Team A won by 14 runs"
    
    current_innings_number = Column(Integer, default=1)
    target_runs = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    team_a = relationship("Team", foreign_keys=[team_a_id])
    team_b = relationship("Team", foreign_keys=[team_b_id])
    toss_winner = relationship("Team", foreign_keys=[toss_winner_id])
    winner = relationship("Team", foreign_keys=[winner_id])
    innings = relationship("MatchInnings", back_populates="match", cascade="all, delete-orphan", order_by="MatchInnings.innings_number")
    playing_xi = relationship("MatchPlayingXI", back_populates="match", cascade="all, delete-orphan")

class MatchInnings(Base):
    __tablename__ = "match_innings"

    id = Column(String(36), primary_key=True, index=True)
    match_id = Column(String(36), ForeignKey("matches.id", ondelete="CASCADE"), nullable=False)
    innings_number = Column(Integer, nullable=False) # 1 or 2
    batting_team_id = Column(String(36), ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    bowling_team_id = Column(String(36), ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    
    total_runs = Column(Integer, default=0)
    wickets = Column(Integer, default=0)
    legal_balls_bowled = Column(Integer, default=0) # 6 balls = 1 over
    wide_runs = Column(Integer, default=0)
    no_ball_runs = Column(Integer, default=0)
    bye_runs = Column(Integer, default=0)
    leg_bye_runs = Column(Integer, default=0)
    penalty_runs = Column(Integer, default=0)
    is_completed = Column(Boolean, default=False)
    
    # Active players on field
    current_striker_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    current_non_striker_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    current_bowler_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    match = relationship("Match", back_populates="innings")
    batting_team = relationship("Team", foreign_keys=[batting_team_id])
    bowling_team = relationship("Team", foreign_keys=[bowling_team_id])
    current_striker = relationship("User", foreign_keys=[current_striker_id])
    current_non_striker = relationship("User", foreign_keys=[current_non_striker_id])
    current_bowler = relationship("User", foreign_keys=[current_bowler_id])
    
    batting_scorecards = relationship("BattingScorecard", back_populates="innings", cascade="all, delete-orphan")
    bowling_scorecards = relationship("BowlingScorecard", back_populates="innings", cascade="all, delete-orphan")
    ball_events = relationship("BallEvent", back_populates="innings", cascade="all, delete-orphan", order_by="BallEvent.ball_sequence")

class MatchPlayingXI(Base):
    __tablename__ = "match_playing_xi"

    id = Column(String(36), primary_key=True, index=True)
    match_id = Column(String(36), ForeignKey("matches.id", ondelete="CASCADE"), nullable=False)
    team_id = Column(String(36), ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    match = relationship("Match", back_populates="playing_xi")
    team = relationship("Team")
    user = relationship("User")

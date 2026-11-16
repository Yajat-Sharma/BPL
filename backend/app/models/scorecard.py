from sqlalchemy import Column, String, ForeignKey, Integer, Float, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class BattingScorecard(Base):
    __tablename__ = "batting_scorecards"

    id = Column(String(36), primary_key=True, index=True)
    innings_id = Column(String(36), ForeignKey("match_innings.id", ondelete="CASCADE"), nullable=False)
    batsman_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    batting_position = Column(Integer, default=1)
    
    runs = Column(Integer, default=0)
    balls_faced = Column(Integer, default=0)
    fours = Column(Integer, default=0)
    sixes = Column(Integer, default=0)
    strike_rate = Column(Float, default=0.0)
    
    is_out = Column(Boolean, default=False)
    dismissal_type = Column(String(50), nullable=True) # BOWLED, CAUGHT, LBW, RUN_OUT, STUMPED, HIT_WICKET, NOT_OUT
    bowler_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    fielder_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    innings = relationship("MatchInnings", back_populates="batting_scorecards")
    batsman = relationship("User", foreign_keys=[batsman_id])
    bowler = relationship("User", foreign_keys=[bowler_id])
    fielder = relationship("User", foreign_keys=[fielder_id])

class BowlingScorecard(Base):
    __tablename__ = "bowling_scorecards"

    id = Column(String(36), primary_key=True, index=True)
    innings_id = Column(String(36), ForeignKey("match_innings.id", ondelete="CASCADE"), nullable=False)
    bowler_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    legal_balls = Column(Integer, default=0) # Total legal balls bowled
    overs_bowled = Column(Float, default=0.0) # e.g. 2.4 overs
    maidens = Column(Integer, default=0)
    runs_conceded = Column(Integer, default=0)
    wickets = Column(Integer, default=0)
    economy_rate = Column(Float, default=0.0)
    wides = Column(Integer, default=0)
    no_balls = Column(Integer, default=0)

    innings = relationship("MatchInnings", back_populates="bowling_scorecards")
    bowler = relationship("User", foreign_keys=[bowler_id])

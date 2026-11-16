import enum
from datetime import datetime
from sqlalchemy import Column, String, ForeignKey, Integer, Boolean, Text, DateTime
from sqlalchemy.orm import relationship
from app.database import Base

class ExtraType(str, enum.Enum):
    NONE = "NONE"
    WIDE = "WIDE"
    NO_BALL = "NO_BALL"
    BYE = "BYE"
    LEG_BYE = "LEG_BYE"
    PENALTY = "PENALTY"
    ROOF_NET_HIT = "ROOF_NET_HIT"   # Special box cricket event
    WALL_HIT = "WALL_HIT"           # Special box cricket boundary/declaration wall

class WicketType(str, enum.Enum):
    BOWLED = "BOWLED"
    CAUGHT = "CAUGHT"
    LBW = "LBW"
    RUN_OUT = "RUN_OUT"
    STUMPED = "STUMPED"
    HIT_WICKET = "HIT_WICKET"
    ROOF_NET_CATCH = "ROOF_NET_CATCH" # Box cricket special catch off net/roof
    ONE_TIP_ONE_HAND = "ONE_TIP_ONE_HAND" # Classic box cricket dismissal
    DIRECT_OUT_OF_BOX = "DIRECT_OUT_OF_BOX" # Over the box net without touching ground = OUT

class BallEvent(Base):
    __tablename__ = "ball_events"

    id = Column(String(36), primary_key=True, index=True)
    innings_id = Column(String(36), ForeignKey("match_innings.id", ondelete="CASCADE"), nullable=False)
    ball_sequence = Column(Integer, nullable=False) # Sequential delivery number in innings (1, 2, 3...)
    over_number = Column(Integer, nullable=False) # 0-indexed over (0 to N-1)
    ball_in_over = Column(Integer, nullable=False) # 1 to 6 (for legal balls)
    
    bowler_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    striker_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    non_striker_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True) # Nullable for last man batting
    
    runs_scored = Column(Integer, default=0) # Runs scored off bat
    extra_type = Column(String(20), default=ExtraType.NONE.value)
    extra_runs = Column(Integer, default=0) # Additional runs from extras
    total_ball_runs = Column(Integer, default=0) # runs_scored + extra_runs
    
    is_legal_delivery = Column(Boolean, default=True) # False for WIDE or NO_BALL
    is_wicket = Column(Boolean, default=False)
    wicket_type = Column(String(50), nullable=True)
    dismissed_player_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    fielder_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    commentary = Column(Text, nullable=True)
    # Full snapshot of state prior to ball delivery stored as JSON text for instantaneous 100% accurate Undo
    previous_state_snapshot = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    innings = relationship("MatchInnings", back_populates="ball_events")
    bowler = relationship("User", foreign_keys=[bowler_id])
    striker = relationship("User", foreign_keys=[striker_id])
    non_striker = relationship("User", foreign_keys=[non_striker_id])
    dismissed_player = relationship("User", foreign_keys=[dismissed_player_id])
    fielder = relationship("User", foreign_keys=[fielder_id])

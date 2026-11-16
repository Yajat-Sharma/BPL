from datetime import datetime
from sqlalchemy import Column, String, ForeignKey, Integer, Boolean, DateTime
from sqlalchemy.orm import relationship
from app.database import Base

class Team(Base):
    __tablename__ = "teams"

    id = Column(String(36), primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    short_code = Column(String(10), unique=True, nullable=False) # e.g. BPL-ROYALS, BPL-KINGS
    logo_url = Column(String(500), nullable=True)
    primary_color = Column(String(20), default="#047857") # Emerald Green default
    secondary_color = Column(String(20), default="#fbbf24") # Golden Yellow default
    captain_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    captain = relationship("User", foreign_keys=[captain_id])
    players = relationship("TeamPlayer", back_populates="team", cascade="all, delete-orphan")

class TeamPlayer(Base):
    __tablename__ = "team_players"

    id = Column(String(36), primary_key=True, index=True)
    team_id = Column(String(36), ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    player_role = Column(String(50), default="ALL_ROUNDER") # BATSMAN, BOWLER, ALL_ROUNDER, WICKET_KEEPER
    jersey_number = Column(Integer, nullable=True)
    is_captain = Column(Boolean, default=False)
    joined_at = Column(DateTime, default=datetime.utcnow)

    team = relationship("Team", back_populates="players")
    user = relationship("User")

import enum
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Enum
from app.database import Base

class UserRole(str, enum.Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    CAPTAIN = "CAPTAIN"
    USER = "USER"

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(20), unique=True, index=True, nullable=False) # e.g. BPL001
    username = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    role = Column(String(20), default=UserRole.USER.value, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class EmailOTP(Base):
    __tablename__ = "email_otps"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), index=True, nullable=False)
    otp_code = Column(String(6), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    is_used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

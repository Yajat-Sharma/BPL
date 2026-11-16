import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Bairajeshwar Premier League (BPL)"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "bpl_super_secret_jwt_key_bairajeshwar_2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./bpl.db")
    
    # Tournament Defaults
    DEFAULT_TOURNAMENT_NAME: str = "Bairajeshwar Premier League 2026"
    DEFAULT_OVERS: int = 10
    POINTS_WIN: int = 2
    POINTS_TIE: int = 1
    POINTS_NO_RESULT: int = 1
    
    # Super Admin Seed
    ADMIN_EMAIL: str = os.getenv("ADMIN_EMAIL", "admin@bpl.com")
    ADMIN_USERNAME: str = os.getenv("ADMIN_USERNAME", "bpl_admin")

    class Config:
        case_sensitive = True

settings = Settings()

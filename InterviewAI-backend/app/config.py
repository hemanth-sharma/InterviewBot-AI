# from pydantic import BaseSettings
from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/interviewbot"
    SECRET_KEY: str = "supersecretkey"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    OPENAI_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    GOOGLE_CLIENT_ID: str | None = None
    GOOGLE_CLIENT_SECRET: str | None = None
    RAPIDAPI_KEY: str | None = None
    RAPIDAPI_HOST: str | None = None
    FRONTEND_URL: str = "http://localhost:3000"

    class Config:
        env_file = f".env.{os.getenv('APP_ENV', 'dev')}"
        env_file_encoding = "utf-8"

settings = Settings()

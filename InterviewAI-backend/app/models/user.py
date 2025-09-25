# app/models/user.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from datetime import datetime
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)   
    name = Column(String, nullable=True)
    role = Column(String, nullable=True)
    provider = Column(String, nullable=True)          
    provider_id = Column(String, nullable=True)       
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

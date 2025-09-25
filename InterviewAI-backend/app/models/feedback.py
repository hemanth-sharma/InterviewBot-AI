# app/models/user.py
from sqlalchemy import Column, Integer, String, DateTime, Text
from datetime import datetime
from app.database import Base

class Feedback(Base):
    __tablename__ = "feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, nullable=False)
    feedback_type = Column(String, nullable=False)
    feedback_text = Column(Text, nullable=False)        
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

from datetime import datetime
from app.models.content import Interview
from sqlalchemy.orm import Session


def deactivate_if_expired(interview: Interview, db: Session):
    """Helper: deactivate interview if it has expired"""
    if interview.is_active and interview.expires_at and datetime.utcnow() > interview.expires_at:
        interview.is_active = False
        db.commit()
        db.refresh(interview)

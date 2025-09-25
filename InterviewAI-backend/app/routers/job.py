# app/routers/job.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.content import JobDescription
from app.schemas.content import JobDescriptionCreate, JobDescriptionResponse

router = APIRouter()

@router.post("/", response_model=JobDescriptionResponse)
def create_jd(payload: JobDescriptionCreate, db: Session = Depends(get_db)):
    jd = JobDescription(title=payload.title, jd_text=payload.jd_text, user_id=payload.user_id)
    db.add(jd)
    db.commit()
    db.refresh(jd)
    return jd

@router.get("/{jd_id}", response_model=JobDescriptionResponse)
def get_jd(jd_id: int, db: Session = Depends(get_db)):
    jd = db.query(JobDescription).filter(JobDescription.id == jd_id).first()
    if not jd:
        raise HTTPException(404, "JD not found")
    return jd

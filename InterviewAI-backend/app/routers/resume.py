# app/routers/resume.py
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.content import Resume
from app.schemas.content import ResumeCreate, ResumeResponse
from app.services.parse_and_ai import parse_file

import os
from pathlib import Path

router = APIRouter()

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@router.post("/upload", response_model=ResumeResponse)
async def upload_resume(file: UploadFile = File(...), user_id: int | None = None, db: Session = Depends(get_db)):
    # Save file bytes
    contents = await file.read()
    filename = file.filename
    save_path = UPLOAD_DIR / filename
    # handle filename collisions
    counter = 1
    base = save_path.stem
    ext = save_path.suffix
    while save_path.exists():
        save_path = UPLOAD_DIR / f"{base}_{counter}{ext}"
        counter += 1
    with open(save_path, "wb") as f:
        f.write(contents)

    # parse file
    raw_text = parse_file(filename, contents)

    # persist
    db_resume = Resume(filename=str(save_path), raw_text=raw_text, user_id=user_id)
    db.add(db_resume)
    db.commit()
    db.refresh(db_resume)
    return db_resume

@router.get("/{resume_id}", response_model=ResumeResponse)
def get_resume(resume_id: int, db: Session = Depends(get_db)):
    r = db.query(Resume).filter(Resume.id == resume_id).first()
    if not r:
        raise HTTPException(404, "Resume not found")
    return r

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.content import Interview
from app.schemas.content import InterviewSummary, InterviewDetail
from app.services.history_and_scores import calculate_scores, generate_feedback

router = APIRouter()


@router.get("/user/{user_id}", response_model=list[InterviewSummary])
def list_history(user_id: int, db: Session = Depends(get_db)):
    interviews = db.query(Interview).filter(Interview.user_id == user_id).order_by(Interview.created_at.desc()).all()
    results = []
    for i in interviews:
        scores = calculate_scores(i, db)
        results.append(InterviewSummary(id=i.id, created_at=i.created_at, **scores))
    return results


@router.get("/user/{user_id}/last", response_model=InterviewSummary)
def last_interview(user_id: int, db: Session = Depends(get_db)):
    interview = (
        db.query(Interview).filter(Interview.user_id == user_id)
        .order_by(Interview.created_at.desc())
        .first()
    )
    if not interview:
        raise HTTPException(status_code=404, detail="No interviews found")
    scores = calculate_scores(interview, db)
    return InterviewSummary(id=interview.id, created_at=interview.created_at, **scores)


@router.get("/{interview_id}", response_model=InterviewDetail)
def interview_detail(interview_id: int, db: Session = Depends(get_db)):
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    scores = calculate_scores(interview, db)
    feedback = generate_feedback(interview, scores)
    return InterviewDetail(id=interview.id, created_at=interview.created_at, feedback=feedback, **scores)

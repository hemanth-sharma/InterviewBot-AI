# app/routers/interview.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.database import get_db
from app.models.content import Interview, Question, Resume, JobDescription, Transcript, Answer
from app.schemas.content import InterviewCreate, InterviewOut, AnswerCreate, AnswerOut
from app.services.scoring import score_text_answer, aggregate_scores, score_with_llm
from app.services.code_runner import run_python_code
from app.services.question_generator import generate_next_question
import uuid
import json

router = APIRouter()

# ------------------------------
# Interview Flow
# ------------------------------

@router.post("/start", response_model=InterviewOut)
def start_interview(payload: InterviewCreate, db: Session = Depends(get_db)):
    """Start an interview session."""
    # Fetch resume & JD text if available
    resume_text = ""
    jd_text = ""

    if payload.resume_id:
        r = db.query(Resume).filter(Resume.id == payload.resume_id).first()
        if not r:
            raise HTTPException(status_code=404, detail="Resume not found")
        resume_text = r.raw_text or ""

    if payload.job_description_id:
        j = db.query(JobDescription).filter(JobDescription.id == payload.job_description_id).first()
        if not j:
            raise HTTPException(status_code=404, detail="Job description not found")
        jd_text = j.jd_text or ""

    # Create interview row
    interview = Interview(
        user_id=payload.user_id,
        resume_id=payload.resume_id,
        job_description_id=payload.job_description_id,
        created_at=datetime.utcnow(),
        started_at=datetime.utcnow(),
        is_active=True,
    )
    timer = payload.timer_minutes or 30
    interview.expires_at = datetime.utcnow() + timedelta(minutes=timer)

    db.add(interview)
    db.commit()
    db.refresh(interview)

    # Generate the very first introduction question
    q = generate_next_question(interview, resume_text, jd_text, step=0)
    question = Question(
        interview_id=interview.id,
        qtype=q.get("qtype", "intro"),
        text=q.get("text", "Tell me about yourself."),
        extra=json.dumps(q.get("extra")) if q.get("extra") else None,
        ordinal=1
    )
    db.add(question)
    db.commit()
    db.refresh(interview)

    return interview


@router.post("/{interview_id}/next")
def next_question(interview_id: int, db: Session = Depends(get_db)):
    """Generate and store the next question for an interview."""
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview or not interview.is_active:
        raise HTTPException(status_code=404, detail="Interview not found or inactive")

    # Count how many questions already asked
    existing_qs = db.query(Question).filter(Question.interview_id == interview_id).all()
    step = len(existing_qs)

    # Get resume + JD text for context
    resume_text = ""
    jd_text = ""
    if interview.resume_id:
        r = db.query(Resume).filter(Resume.id == interview.resume_id).first()
        resume_text = r.raw_text or ""
    if interview.job_description_id:
        j = db.query(JobDescription).filter(JobDescription.id == interview.job_description_id).first()
        jd_text = j.jd_text or ""

    # Generate next question
    q = generate_next_question(interview, resume_text, jd_text, step=step)

    question = Question(
        interview_id=interview.id,
        qtype=q.get("qtype", "general"),
        text=q.get("text", ""),
        extra=json.dumps(q.get("extra")) if q.get("extra") else None,
        ordinal=step + 1
    )
    db.add(question)
    db.commit()
    return {"question_id": question.id, "text": question.text, "qtype": question.qtype}


@router.post("/{interview_id}/answer", response_model=AnswerOut)
def answer_question(interview_id: int, payload: AnswerCreate, db: Session = Depends(get_db)):
    """Store an answer for the latest question."""
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview or not interview.is_active:
        raise HTTPException(status_code=404, detail="Interview not found or inactive")

    # Ensure the question exists
    question = db.query(Question).filter(Question.id == payload.question_id,
                                         Question.interview_id == interview_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found for this interview")

    ans = Answer(
        interview_id=interview_id,
        question_id=payload.question_id,
        user_text=payload.user_text,
        is_coding=payload.is_coding,
        code=payload.code,
        code_language=payload.code_language
    )

    # Get previous question and previous answer 
    # interview_id fetch the last question and answer
    # send required info to scoring.score_answer function
    # Use llm in score_answer func to get score.

    # Scoring # Here I want to have a common function that will handle the scoring logic. 
    if payload.is_coding and payload.code:
        success, output = run_python_code(payload.code, "")
        ans.code_result = output
        ans.score = 10 if success else 0
    else:
        ans.score = score_text_answer(payload.user_text or "")
        ans.score = score_with_llm(
            question.text,
            payload.user_text or "",
            qtype=question.qtype,
        )

    db.add(ans)
    db.commit()
    db.refresh(ans)
    return ans


@router.post("/{interview_id}/end")
def end_interview(interview_id: int, db: Session = Depends(get_db)):
    """End interview and compute score."""
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    answers = db.query(Answer).filter(Answer.interview_id == interview_id).all()
    tech_scores = [a.score for a in answers if a and not a.is_coding]
    coding_scores = [a.score for a in answers if a and a.is_coding]
    behavioral_scores = [a.score for a in answers if a and not a.is_coding]  # refine later

    total = aggregate_scores(tech_scores, behavioral_scores, coding_scores)
    interview.total_score = total
    interview.is_active = False

    db.commit()
    db.refresh(interview)
    return {"interview_id": interview_id, "total_score": total}

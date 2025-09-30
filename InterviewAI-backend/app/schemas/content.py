# app/schemas/content.py
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ResumeCreate(BaseModel):
    filename: str
    raw_text: Optional[str] = None
    user_id: Optional[int] = None

class ResumeResponse(BaseModel):
    id: int
    filename: str
    raw_text: Optional[str]
    uploaded_at: datetime
    user_id: Optional[int]

    class Config:
        from_attributes = True

class JobDescriptionCreate(BaseModel):
    title: Optional[str] = None
    jd_text: str
    user_id: Optional[int] = None

class JobDescriptionResponse(BaseModel):
    id: int
    title: Optional[str]
    jd_text: str
    uploaded_at: datetime
    user_id: Optional[int]

    class Config:
        from_attributes = True

class QuestionOut(BaseModel):
    id: int
    qtype: str
    text: str
    extra: Optional[str]
    ordinal: int

    class Config:
        from_attributes = True

class InterviewCreate(BaseModel):
    resume_id: Optional[int] = None
    job_description_id: Optional[int] = None
    user_id: Optional[int] = None
    timer_minutes: Optional[int] = 30


class InterviewOut(BaseModel):
    id: int
    resume_id: Optional[int]
    job_description_id: Optional[int]
    created_at: datetime
    started_at: Optional[datetime]
    expires_at: Optional[datetime]
    is_active: bool
    user_id: Optional[int]
    total_score: Optional[int]
    questions: List[QuestionOut] = []

    class Config:
        from_attributes = True


class InterviewSummary(BaseModel):
    id: int
    created_at: datetime
    technical_score: int
    behavioral_score: int
    coding_score: int
    overall_score: int

    class Config:
        from_attributes = True



class InterviewDetail(InterviewSummary):
    feedback: str


class AnswerCreate(BaseModel):
    question_id: Optional[int] = None
    user_text: Optional[str] = None
    is_coding: Optional[bool] = False
    code: Optional[str] = None
    code_language: Optional[str] = None

class AnswerOut(BaseModel):
    id: int
    question_id: Optional[int]
    user_text: Optional[str]
    created_at: datetime
    is_coding: bool
    code: Optional[str]
    code_language: Optional[str]
    code_result: Optional[str]
    score: Optional[int]

    class Config:
        from_attributes = True

class TranscriptOut(BaseModel):
    id: int
    interview_id: int
    speaker: str
    text: str
    created_at: datetime

    class Config:
        from_attributes = True



class CodeRunRequest(BaseModel):
    code: str
    language_code: str   # e.g. "python", "cpp", "java", "javascript", "go"
    stdin: Optional[str] = None

class CodeRunResponse(BaseModel):
    success: bool
    output: str

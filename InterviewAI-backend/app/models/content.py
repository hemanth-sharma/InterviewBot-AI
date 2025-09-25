# app/models/content.py
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Resume(Base):
    __tablename__ = "resumes"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    raw_text = Column(Text, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    user_id = Column(Integer, nullable=True)

    interviews = relationship("Interview", back_populates="resume")

class JobDescription(Base):
    __tablename__ = "job_descriptions"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=True)
    jd_text = Column(Text, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    user_id = Column(Integer, nullable=True)

    interviews = relationship("Interview", back_populates="job_description")

class Interview(Base):
    __tablename__ = "interviews"
    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id"), nullable=True)
    job_description_id = Column(Integer, ForeignKey("job_descriptions.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=False)
    user_id = Column(Integer, nullable=True)
    total_score = Column(Integer, nullable=True)  # aggregate

    resume = relationship("Resume", back_populates="interviews")
    job_description = relationship("JobDescription", back_populates="interviews")
    questions = relationship("Question", back_populates="interview", cascade="all, delete-orphan")
    transcripts = relationship("Transcript", back_populates="interview", cascade="all, delete-orphan")
    answers = relationship("Answer", back_populates="interview", cascade="all, delete-orphan")

class Question(Base):
    __tablename__ = "questions"
    id = Column(Integer, primary_key=True, index=True)
    interview_id = Column(Integer, ForeignKey("interviews.id"))
    qtype = Column(String, nullable=False)  # 'resume', 'behavioral', 'coding'
    text = Column(Text, nullable=False)
    extra = Column(Text, nullable=True)  # metadata JSON or helper text
    ordinal = Column(Integer, nullable=False)

    interview = relationship("Interview", back_populates="questions")
    answers = relationship("Answer", back_populates="question", cascade="all, delete-orphan")


class Answer(Base):
    __tablename__ = "answers"
    id = Column(Integer, primary_key=True, index=True)
    interview_id = Column(Integer, ForeignKey("interviews.id"))
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=True)
    user_text = Column(Text, nullable=True)  # user's textual answer or transcribed speech
    created_at = Column(DateTime, default=datetime.utcnow)
    is_coding = Column(Boolean, default=False)
    code = Column(Text, nullable=True)  # code submitted
    code_language = Column(String, nullable=True)
    code_result = Column(Text, nullable=True)  # test output or evaluation summary
    score = Column(Integer, nullable=True)  # per-answer score

    interview = relationship("Interview", back_populates="answers")
    question = relationship("Question", back_populates="answers")


class Transcript(Base):
    __tablename__ = "transcripts"
    id = Column(Integer, primary_key=True, index=True)
    interview_id = Column(Integer, ForeignKey("interviews.id"))
    speaker = Column(String, nullable=False)  # 'interviewer' or 'candidate'
    text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    interview = relationship("Interview", back_populates="transcripts")

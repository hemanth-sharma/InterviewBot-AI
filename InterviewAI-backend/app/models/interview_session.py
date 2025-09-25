# app/models/interview_session.py
from typing import List, Dict, Optional
from datetime import datetime

class InterviewSession:
    def __init__(self, session_id: str, user_id: str, resume: str, jd: str):
        self.session_id = session_id
        self.user_id = user_id
        self.resume = resume
        self.jd = jd
        self.history: List[Dict] = []  # [{q:..., a:..., qtype:...}]
        self.started_at = datetime.utcnow()
        self.current_index = 0
        self.is_active = True

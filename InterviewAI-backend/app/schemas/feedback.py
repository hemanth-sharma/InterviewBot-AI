from pydantic import BaseModel, EmailStr

class FeedbackCreate(BaseModel):
    email: EmailStr
    feedback_type: str
    feedback_text: str

class FeedbackResponse(BaseModel):
    id: int
    email: EmailStr
    feedback_type: str
    feedback_text: str

    class Config:
        from_attributes = True

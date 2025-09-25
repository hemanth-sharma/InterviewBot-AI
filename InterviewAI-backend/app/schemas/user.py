# app/schemas/user.py
from pydantic import BaseModel, EmailStr
from typing import Optional

# Input for registration
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None
    role: Optional[str] = None

# Response-safe user
class UserResponse(BaseModel):
    id: int
    email: EmailStr
    name: Optional[str]
    role: Optional[str]

    class Config:
        from_attributes = True

# For login input (email + password)
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Token response
class Token(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    expires_in: Optional[int] = None

# Token data (decoded contents)
class TokenData(BaseModel):
    sub: Optional[str] = None
    exp: Optional[int] = None

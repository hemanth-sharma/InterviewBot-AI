from fastapi import APIRouter, Depends, HTTPException, status, Body, Response
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from typing import Optional
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, UserLogin, Token
from app.utils.jwt_handler import create_access_token, create_refresh_token, decode_token
from app.utils.auth import get_current_user
from app.config import settings

# For Google token verification
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# -----------------
# Register
# -----------------
@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_pw = pwd_context.hash(user_in.password)
    user = User(email=user_in.email, hashed_password=hashed_pw, name=user_in.name, role=user_in.role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

# -----------------
# Login (email/password)
# -----------------

@router.post("/login", response_model=Token)
def login(payload: UserLogin, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not user.hashed_password or not pwd_context.verify(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    access = create_access_token({"sub": user.email})
    refresh = create_refresh_token({"sub": user.email})

    # Set HTTP-only cookies
    response.set_cookie(
        key="accessToken",
        value=access,
        httponly=True,
        secure=True,      # True in production (HTTPS)
        samesite="lax",   # or "strict"
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/"
    )
    response.set_cookie(
        key="refreshToken",
        value=refresh,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=30 * 24 * 60 * 60,  # 30 days
        path="/"
    )

    return Token(access_token=access, refresh_token=refresh, expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES)


# -----------------
# Refresh tokens
# -----------------
@router.post("/refresh", response_model=Token)
def refresh_token(response: Response, refresh_token: str = Body(..., embed=True)):
    payload = decode_token(refresh_token)
    sub = payload.get("sub")
    access = create_access_token({"sub": sub})
    new_refresh = create_refresh_token({"sub": sub})

    response.set_cookie(
        key="accessToken",
        value=access,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/"
    )
    response.set_cookie(
        key="refreshToken",
        value=new_refresh,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=30 * 24 * 60 * 60,
        path="/"
    )
    return Token(access_token=access, refresh_token=new_refresh, expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

# -----------------
# Google Sign-in
# Expect frontend to POST {"id_token": "<google-id-token>"}
# -----------------
@router.post("/google", response_model=Token)
def google_login(response: Response, id_token_str: str = Body(..., embed=True), db: Session = Depends(get_db)):
    """
    Verify Google ID token (from client) and create or fetch user.
    Returns JWT tokens.
    """
    try:
        # Verify token and get payload
        request = google_requests.Request()
        # This will validate signature and expiry using Google's public keys
        id_info = id_token.verify_oauth2_token(id_token_str, request, audience=None)
        # id_info contains: email, email_verified, name, sub (google user id), picture, etc.
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid Google ID token")

    email = id_info.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Google token did not contain an email")

    # Find or create user
    user = db.query(User).filter(User.email == email).first()
    if not user:
        # Create user (no password)
        user = User(
            email=email,
            name=id_info.get("name"),
            provider="google",
            provider_id=id_info.get("sub"),
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # optionally sync provider info
        if not user.provider:
            user.provider = "google"
            user.provider_id = id_info.get("sub")
            db.commit()
            db.refresh(user)

    # Issue tokens
    access = create_access_token({"sub": user.email})
    refresh = create_refresh_token({"sub": user.email})

    response.set_cookie(
        key="accessToken",
        value=access,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/"
    )
    response.set_cookie(
        key="refreshToken",
        value=refresh,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=30 * 24 * 60 * 60,
        path="/"
    )

    return Token(access_token=access, refresh_token=refresh, expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

# -----------------
# Protected example route
# -----------------
@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return current_user

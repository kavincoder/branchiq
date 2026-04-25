from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse
from app.utils.security import verify_password, create_access_token
from app.services.audit import log_action

limiter = Limiter(key_func=get_remote_address)
router = APIRouter()

COOKIE_NAME = "branchiq_token"
COOKIE_MAX_AGE = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60

MAX_FAILED_ATTEMPTS = 5  # lock after 5 consecutive failures


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.username == payload.username).first()

    # Intentionally vague error — don't reveal if username or password was wrong
    if not user or not verify_password(payload.password, user.hashed_password):
        if user:
            user.failed_login_count = (user.failed_login_count or 0) + 1
            db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Contact your manager.",
        )

    if (user.failed_login_count or 0) >= MAX_FAILED_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account temporarily locked after multiple failed attempts. Contact your manager.",
        )

    # Successful login — reset failure counter, record timestamp
    user.failed_login_count = 0
    user.last_login = datetime.now(timezone.utc)
    db.commit()

    token = create_access_token({"sub": user.user_id, "role": user.role})

    # Set httpOnly cookie — JS cannot read this, eliminates XSS token theft
    # In production, frontend (vercel.app) and backend (onrender.com) are different
    # domains — requires SameSite=None + Secure so the browser sends the cookie
    # on cross-origin fetch requests (credentials: 'include').
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="none" if settings.is_production else "lax",
        max_age=COOKIE_MAX_AGE,
        secure=settings.is_production,         # True in prod (HTTPS), False in dev
        path="/",
    )

    log_action(
        db=db,
        table_name="users",
        record_id=user.user_id,
        action="login",
        performed_by=user.user_id,
        performed_by_name=user.full_name,
        ip_address=request.client.host if request.client else None,
    )

    # Return non-sensitive user metadata in body for frontend display
    return TokenResponse(
        access_token=token,
        user_id=user.user_id,
        full_name=user.full_name,
        role=user.role,
    )


@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(response: Response):
    response.delete_cookie(key=COOKIE_NAME, path="/")
    return {"message": "Logged out successfully"}

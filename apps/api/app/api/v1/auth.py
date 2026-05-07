from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.deps import get_current_user
from app.core.security import issue_session_token, verify_password
from app.db.session import get_db
from app.models import User
from app.schemas import LoginRequest, MeResponse

router = APIRouter(prefix="/auth", tags=["auth"])
_settings = get_settings()


@router.post("/login", response_model=MeResponse)
def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).one_or_none()
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")
    token = issue_session_token(user.id)
    response.set_cookie(
        key=_settings.session_cookie_name,
        value=token,
        max_age=_settings.session_max_age_seconds,
        httponly=True,
        samesite="lax",
        secure=False,  # Phase 2: True in prod with HTTPS
        path="/",
    )
    return MeResponse(id=user.id, email=user.email, name=user.name, role=user.role)


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(_settings.session_cookie_name, path="/")
    return {"ok": True}


@router.get("/me", response_model=MeResponse)
def me(user: User = Depends(get_current_user)):
    return MeResponse(id=user.id, email=user.email, name=user.name, role=user.role)

from datetime import datetime, timedelta, timezone

from itsdangerous import BadSignature, SignatureExpired, TimestampSigner
from passlib.context import CryptContext

from app.core.config import get_settings

_settings = get_settings()
_signer = TimestampSigner(_settings.secret_key)
_pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    return _pwd.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return _pwd.verify(plain, hashed)


def issue_session_token(user_id: int) -> str:
    return _signer.sign(str(user_id)).decode("utf-8")


def parse_session_token(token: str) -> int | None:
    try:
        raw = _signer.unsign(token, max_age=_settings.session_max_age_seconds)
        return int(raw.decode("utf-8"))
    except (BadSignature, SignatureExpired, ValueError):
        return None


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def expiry(seconds: int) -> datetime:
    return utcnow() + timedelta(seconds=seconds)

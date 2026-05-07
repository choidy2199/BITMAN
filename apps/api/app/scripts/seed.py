"""기본 관리자 계정 시드. `python -m app.scripts.seed`로 실행."""
from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models import User, UserRole

DEFAULT_EMAIL = "admin@bitman.local"
DEFAULT_PASSWORD = "admin1234"


def main() -> None:
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == DEFAULT_EMAIL).one_or_none()
        if existing:
            print(f"User already exists: {DEFAULT_EMAIL}")
            return
        u = User(
            email=DEFAULT_EMAIL,
            name="Admin",
            password_hash=hash_password(DEFAULT_PASSWORD),
            role=UserRole.ADMIN,
        )
        db.add(u)
        db.commit()
        print(f"Created admin: {DEFAULT_EMAIL} / {DEFAULT_PASSWORD}")
    finally:
        db.close()


if __name__ == "__main__":
    main()

from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models import AuditLog, User

router = APIRouter(prefix="/history", tags=["history"])


class HistoryItem(BaseModel):
    id: int
    actor_id: int | None
    action: str
    target_type: str
    target_id: str
    before: dict[str, Any] | None = None
    after: dict[str, Any] | None = None
    created_at: datetime

    class Config:
        from_attributes = True


@router.get("", response_model=list[HistoryItem])
def list_history(
    target_type: str | None = Query(default=None),
    limit: int = Query(default=100, le=500),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit)
    if target_type:
        q = q.where(AuditLog.target_type == target_type)
    return db.execute(q).scalars().all()

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models import (
    AuditLog,
    CompareDiff,
    CompareSession,
    PricelistVersion,
    User,
    UserSheet,
    VersionStatus,
)
from app.models.compare_session import DiffType
from app.schemas import (
    DiffItem,
    DiffSelectionUpdate,
    SessionSummary,
)
from app.schemas.user_sheet import ColumnMapping
from app.workers.tasks import run_compare
from pydantic import BaseModel

router = APIRouter(prefix="/compare", tags=["compare"])


class CompareCreatePayload(BaseModel):
    user_sheet_id: int
    version_id: int
    sheet_name: str
    header_row: int = 1
    mapping: ColumnMapping


@router.post("", response_model=SessionSummary)
def create_session(
    payload: CompareCreatePayload,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    sheet = db.get(UserSheet, payload.user_sheet_id)
    if sheet is None or sheet.owner_id != user.id:
        raise HTTPException(404, "User sheet not found")
    version = db.get(PricelistVersion, payload.version_id)
    if version is None:
        raise HTTPException(404, "Pricelist version not found")
    if version.status != VersionStatus.VERIFIED:
        raise HTTPException(400, "Pricelist version is not verified yet")

    session = CompareSession(
        user_sheet_id=payload.user_sheet_id,
        version_id=payload.version_id,
        created_by_id=user.id,
        status="pending",
        sheet_name=payload.sheet_name,
        header_row=payload.header_row,
        mapping=payload.mapping.model_dump(),
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    run_compare.delay(
        session.id,
        payload.sheet_name,
        payload.header_row,
        payload.mapping.model_dump(),
    )
    db.add(
        AuditLog(
            actor_id=user.id,
            action="compare.create",
            target_type="compare_session",
            target_id=str(session.id),
            after={"user_sheet_id": payload.user_sheet_id, "version_id": payload.version_id},
        )
    )
    db.commit()
    return _to_summary(session)


def _to_summary(s: CompareSession) -> SessionSummary:
    return SessionSummary(
        id=s.id,
        status=s.status,
        summary=s.summary,
        sheet_name=s.sheet_name,
        header_row=s.header_row,
        mapping=s.mapping,
    )


@router.get("/{session_id}", response_model=SessionSummary)
def get_session(
    session_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)
):
    s = db.get(CompareSession, session_id)
    if s is None:
        raise HTTPException(404, "Not found")
    return _to_summary(s)


@router.get("/{session_id}/diffs", response_model=list[DiffItem])
def list_diffs(
    session_id: int,
    diff_type: DiffType | None = Query(default=None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = select(CompareDiff).where(CompareDiff.session_id == session_id)
    if diff_type is not None:
        q = q.where(CompareDiff.diff_type == diff_type)
    q = q.order_by(CompareDiff.id.asc())
    return db.execute(q).scalars().all()


@router.patch("/{session_id}/diffs")
def update_selection(
    session_id: int,
    payload: DiffSelectionUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    if not payload.diff_ids:
        return {"ok": True, "updated": 0}
    n = (
        db.query(CompareDiff)
        .filter(CompareDiff.session_id == session_id, CompareDiff.id.in_(payload.diff_ids))
        .update({"selected": payload.selected}, synchronize_session=False)
    )
    db.commit()
    return {"ok": True, "updated": n}

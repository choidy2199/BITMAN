from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models import AuditLog, CompareSession, MergeJob, User, UserSheet
from app.schemas import MergeJobResponse
from app.workers.tasks import run_merge

router = APIRouter(tags=["merge"])


class MergeRequest(BaseModel):
    add_new_rows: bool = True
    mark_removed: bool = True


@router.post(
    "/compare/{session_id}/merge",
    response_model=MergeJobResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_merge(
    session_id: int,
    payload: MergeRequest = MergeRequest(),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    session = db.get(CompareSession, session_id)
    if session is None:
        raise HTTPException(404, "Session not found")
    if session.status != "ready":
        raise HTTPException(400, "Session not ready")
    if not session.sheet_name or not session.mapping:
        raise HTTPException(400, "Session is missing sheet_name/mapping; recreate compare session")

    job = MergeJob(
        session_id=session_id,
        status="pending",
        created_by_id=user.id,
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    run_merge.delay(
        job.id,
        session.sheet_name,
        session.mapping,
        {"add_new_rows": payload.add_new_rows, "mark_removed": payload.mark_removed},
    )
    db.add(
        AuditLog(
            actor_id=user.id,
            action="merge.create",
            target_type="merge_job",
            target_id=str(job.id),
            after={"session_id": session_id},
        )
    )
    db.commit()
    return job


@router.get("/merges/{job_id}", response_model=MergeJobResponse)
def get_merge(
    job_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)
):
    job = db.get(MergeJob, job_id)
    if job is None:
        raise HTTPException(404, "Not found")
    return job


@router.get("/merges/{job_id}/download")
def download_merge(
    job_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    job = db.get(MergeJob, job_id)
    if job is None or job.status != "done" or not job.output_path:
        raise HTTPException(404, "Merge not ready")
    p = Path(job.output_path)
    if not p.exists():
        raise HTTPException(410, "File missing")
    session = db.get(CompareSession, job.session_id)
    sheet = db.get(UserSheet, session.user_sheet_id) if session else None
    download_name = (
        f"{Path(sheet.original_filename).stem}_merged.xlsx" if sheet else p.name
    )
    return FileResponse(
        path=str(p),
        filename=download_name,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )

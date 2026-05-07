from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models import User, UserSheet
from app.schemas import UserSheetPreview, UserSheetResponse
from app.services.excel_read import preview_workbook
from app.storage.files import save_upload

router = APIRouter(prefix="/user-sheets", tags=["user-sheets"])


@router.post("/upload", response_model=UserSheetResponse, status_code=status.HTTP_201_CREATED)
async def upload(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    name = (file.filename or "upload").lower()
    if not name.endswith(".xlsx"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Only .xlsx accepted")
    data = await file.read()
    path, checksum = save_upload("user-sheets", file.filename or "upload", data)
    sheet = UserSheet(
        owner_id=user.id,
        original_filename=file.filename or "upload",
        storage_path=str(path),
        checksum=checksum,
    )
    db.add(sheet)
    db.commit()
    db.refresh(sheet)
    return sheet


@router.get("/{sheet_id}/preview", response_model=UserSheetPreview)
def preview(
    sheet_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    sheet = db.get(UserSheet, sheet_id)
    if sheet is None or sheet.owner_id != user.id:
        raise HTTPException(404, "Not found")
    return preview_workbook(sheet.storage_path)

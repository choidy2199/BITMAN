from decimal import Decimal
from typing import Any

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models import (
    AuditLog,
    ExtractionArtifact,
    PricelistItem,
    PricelistVersion,
    SourceKind,
    User,
    VersionStatus,
)
from app.schemas import ExtractionResponse, PricelistVersionResponse
from app.storage.files import save_upload
from app.workers.tasks import extract_pricelist

router = APIRouter(prefix="/pricelists", tags=["pricelists"])

_ALLOWED_EXT = {"pdf", "xlsx"}


@router.post("/upload", response_model=PricelistVersionResponse, status_code=status.HTTP_201_CREATED)
async def upload(
    file: UploadFile = File(...),
    effective_month: str | None = Form(default=None),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    name = (file.filename or "upload").lower()
    ext = name.rsplit(".", 1)[-1] if "." in name else ""
    if ext not in _ALLOWED_EXT:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Only PDF or XLSX accepted")
    data = await file.read()
    path, checksum = save_upload("pricelists", file.filename or "upload", data)
    version = PricelistVersion(
        source_filename=file.filename or "upload",
        source_kind=SourceKind.PDF if ext == "pdf" else SourceKind.XLSX,
        effective_month=effective_month,
        uploaded_by_id=user.id,
        status=VersionStatus.UPLOADED,
        storage_path=str(path),
        checksum=checksum,
    )
    db.add(version)
    db.commit()
    db.refresh(version)

    extract_pricelist.delay(version.id)
    db.add(
        AuditLog(
            actor_id=user.id,
            action="pricelist.upload",
            target_type="pricelist_version",
            target_id=str(version.id),
            after={"filename": version.source_filename},
        )
    )
    db.commit()
    return version


@router.get("", response_model=list[PricelistVersionResponse])
def list_versions(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    rows = db.execute(
        select(PricelistVersion).order_by(PricelistVersion.created_at.desc()).limit(100)
    ).scalars().all()
    return rows


@router.get("/{version_id}", response_model=PricelistVersionResponse)
def get_version(
    version_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)
):
    v = db.get(PricelistVersion, version_id)
    if v is None:
        raise HTTPException(404, "Not found")
    return v


@router.get("/{version_id}/extraction", response_model=ExtractionResponse)
def get_extraction(
    version_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)
):
    artifact = db.query(ExtractionArtifact).filter_by(version_id=version_id).one_or_none()
    if artifact is None:
        raise HTTPException(404, "No extraction artifact (still processing?)")
    return ExtractionResponse(
        version_id=version_id,
        rows=artifact.rows or [],
        column_mapping=artifact.column_mapping,
        confidence=float(artifact.confidence),
        page_count=artifact.page_count,
        edited=artifact.edited,
    )


@router.patch("/{version_id}/extraction")
def update_extraction(
    version_id: int,
    payload: dict[str, Any],
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """rows 전체를 교체. 검증 화면에서 일괄 PATCH."""
    artifact = db.query(ExtractionArtifact).filter_by(version_id=version_id).one_or_none()
    if artifact is None:
        raise HTTPException(404, "No extraction artifact")
    if "rows" in payload:
        artifact.rows = payload["rows"]
    if "column_mapping" in payload:
        artifact.column_mapping = payload["column_mapping"]
    artifact.edited = True
    db.commit()
    db.add(
        AuditLog(
            actor_id=user.id,
            action="pricelist.extraction.update",
            target_type="pricelist_version",
            target_id=str(version_id),
        )
    )
    db.commit()
    return {"ok": True}


@router.post("/{version_id}/verify")
def verify(
    version_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    """추출 결과를 pricelist_items로 확정."""
    version = db.get(PricelistVersion, version_id)
    if version is None:
        raise HTTPException(404, "Not found")
    artifact = db.query(ExtractionArtifact).filter_by(version_id=version_id).one_or_none()
    if artifact is None:
        raise HTTPException(400, "No extraction artifact")
    mapping = artifact.column_mapping or {}
    if "sku" not in mapping:
        raise HTTPException(400, "SKU column not mapped")

    db.query(PricelistItem).filter_by(version_id=version_id).delete()
    inserted = 0
    for row in artifact.rows or []:
        cells = row.get("cells") or {}
        sku_raw = cells.get(str(mapping.get("sku")))
        from app.services.normalize import normalize_sku, normalize_text, parse_price

        sku = normalize_sku(sku_raw)
        if not sku:
            continue
        list_price = parse_price(cells.get(str(mapping.get("list_price")))) if mapping.get(
            "list_price"
        ) else None
        dealer_price = parse_price(cells.get(str(mapping.get("dealer_price")))) if mapping.get(
            "dealer_price"
        ) else None
        item = PricelistItem(
            version_id=version_id,
            sku=sku,
            model_name=normalize_text(cells.get(str(mapping.get("model_name"))))
            if mapping.get("model_name")
            else None,
            category=normalize_text(cells.get(str(mapping.get("category"))))
            if mapping.get("category")
            else None,
            list_price=Decimal(list_price) if list_price is not None else None,
            dealer_price=Decimal(dealer_price) if dealer_price is not None else None,
            raw_attrs=cells,
        )
        db.add(item)
        inserted += 1

    version.status = VersionStatus.VERIFIED
    db.add(
        AuditLog(
            actor_id=user.id,
            action="pricelist.verify",
            target_type="pricelist_version",
            target_id=str(version_id),
            after={"items": inserted},
        )
    )
    db.commit()
    return {"ok": True, "items": inserted}

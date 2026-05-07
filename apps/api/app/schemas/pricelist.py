from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from app.models.pricelist import SourceKind, VersionStatus


class PricelistVersionResponse(BaseModel):
    id: int
    source_filename: str
    source_kind: SourceKind
    effective_month: str | None = None
    status: VersionStatus
    extraction_error: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class ExtractionCellEdit(BaseModel):
    row_id: str
    field: str
    value: Any


class ExtractionResponse(BaseModel):
    version_id: int
    rows: list[dict[str, Any]] = Field(default_factory=list)
    column_mapping: dict[str, str] | None = None
    confidence: float = 0.0
    page_count: int = 0
    edited: bool = False

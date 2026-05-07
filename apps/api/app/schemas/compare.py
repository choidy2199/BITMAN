from typing import Any

from pydantic import BaseModel

from app.models.compare_session import DiffType


class SessionSummary(BaseModel):
    id: int
    status: str
    summary: dict[str, int] | None = None
    sheet_name: str | None = None
    header_row: int = 1
    mapping: dict[str, Any] | None = None


class DiffItem(BaseModel):
    id: int
    diff_type: DiffType
    sku: str
    before: dict[str, Any] | None = None
    after: dict[str, Any] | None = None
    match_confidence: float
    source_ref: dict[str, Any] | None = None
    selected: bool

    class Config:
        from_attributes = True


class DiffSelectionUpdate(BaseModel):
    diff_ids: list[int]
    selected: bool

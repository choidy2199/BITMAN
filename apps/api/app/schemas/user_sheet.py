from datetime import datetime

from pydantic import BaseModel, Field


class ColumnMapping(BaseModel):
    """사용자 Excel의 컬럼 문자(A, B, ...) 또는 0-based index 문자열 매핑."""

    sku: str
    model_name: str | None = None
    list_price: str | None = None
    dealer_price: str | None = None
    category: str | None = None
    extras: dict[str, str] = Field(default_factory=dict)


class UserSheetResponse(BaseModel):
    id: int
    original_filename: str
    created_at: datetime

    class Config:
        from_attributes = True


class UserSheetPreview(BaseModel):
    sheets: list[dict]
    """예: [{"name": "단가표", "headers": [{"col": "A", "value": "코드"}, ...], "data_rows": 1234}]"""

    suggested_mapping: ColumnMapping | None = None


class SheetMappingRequest(BaseModel):
    sheet_name: str
    header_row: int = 1
    mapping: ColumnMapping
    save_as_template: str | None = None

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class UserSheetTemplate(Base, TimestampMixin):
    """사용자 Excel 컬럼 매핑 저장(재사용)."""

    __tablename__ = "user_sheet_templates"

    id: Mapped[int] = mapped_column(primary_key=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    sheet_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    header_row: Mapped[int] = mapped_column(default=1, nullable=False)
    mapping: Mapped[dict] = mapped_column(JSONB, nullable=False)
    """
    예: {"sku": "A", "model_name": "B", "list_price": "D", "dealer_price": "E", "category": "F"}
    값은 1-based Excel 컬럼 문자.
    """


class UserSheet(Base, TimestampMixin):
    """사용자가 업로드한 Excel."""

    __tablename__ = "user_sheets"

    id: Mapped[int] = mapped_column(primary_key=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    original_filename: Mapped[str] = mapped_column(String(512), nullable=False)
    storage_path: Mapped[str] = mapped_column(String(1024), nullable=False)
    checksum: Mapped[str] = mapped_column(String(128), nullable=False)
    sheet_layout: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    """업로드 시 추정한 시트/헤더 정보. 예: {"sheets": [{"name": "단가표", "headers": [...]}]}"""

    template_id: Mapped[int | None] = mapped_column(
        ForeignKey("user_sheet_templates.id"), nullable=True
    )
    template: Mapped[UserSheetTemplate | None] = relationship()

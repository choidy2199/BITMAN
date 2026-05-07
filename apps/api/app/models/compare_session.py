from enum import Enum

from sqlalchemy import Boolean, ForeignKey, Numeric, String
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class DiffType(str, Enum):
    ADDED = "added"
    REMOVED = "removed"
    PRICE_CHANGED = "price_changed"
    MODEL_NAME_CHANGED = "model_name_changed"
    SKU_CHANGED_SUSPECTED = "sku_changed_suspected"
    CATEGORY_CHANGED = "category_changed"
    UNCHANGED = "unchanged"


class CompareSession(Base, TimestampMixin):
    __tablename__ = "compare_sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_sheet_id: Mapped[int] = mapped_column(
        ForeignKey("user_sheets.id", ondelete="CASCADE"), nullable=False
    )
    version_id: Mapped[int] = mapped_column(
        ForeignKey("pricelist_versions.id", ondelete="CASCADE"), nullable=False
    )
    created_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="pending", nullable=False)
    summary: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    """카운트 요약. 예: {"added": 12, "removed": 2, "price_changed": 34, "model_name_changed": 1}"""

    sheet_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    header_row: Mapped[int] = mapped_column(default=1, nullable=False)
    mapping: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    """비교 시 사용한 ColumnMapping. 머지에서 그대로 재사용."""

    diffs: Mapped[list["CompareDiff"]] = relationship(
        back_populates="session", cascade="all, delete-orphan"
    )


class CompareDiff(Base):
    __tablename__ = "compare_diffs"

    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[int] = mapped_column(
        ForeignKey("compare_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    diff_type: Mapped[DiffType] = mapped_column(
        SAEnum(DiffType, name="diff_type"), nullable=False, index=True
    )
    sku: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    before: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    after: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    match_confidence: Mapped[float] = mapped_column(Numeric(5, 4), default=1.0, nullable=False)
    source_ref: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    """원본 행 좌표 등. 예: {"sheet": "단가표", "row": 42}"""
    selected: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    decision_note: Mapped[str | None] = mapped_column(String(512), nullable=True)

    session: Mapped[CompareSession] = relationship(back_populates="diffs")


class MergeJob(Base, TimestampMixin):
    __tablename__ = "merge_jobs"

    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[int] = mapped_column(
        ForeignKey("compare_sessions.id", ondelete="CASCADE"), nullable=False
    )
    output_path: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="pending", nullable=False)
    warnings: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    error: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    created_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)

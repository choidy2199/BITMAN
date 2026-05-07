from enum import Enum

from sqlalchemy import Boolean, ForeignKey, Integer, Numeric, String, UniqueConstraint
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class SourceKind(str, Enum):
    PDF = "pdf"
    XLSX = "xlsx"


class VersionStatus(str, Enum):
    UPLOADED = "uploaded"
    EXTRACTING = "extracting"
    REVIEW = "review"
    VERIFIED = "verified"
    ARCHIVED = "archived"
    FAILED = "failed"


class PricelistVersion(Base, TimestampMixin):
    """본사가 배포한 단가표 1버전 = 1행."""

    __tablename__ = "pricelist_versions"

    id: Mapped[int] = mapped_column(primary_key=True)
    source_filename: Mapped[str] = mapped_column(String(512), nullable=False)
    source_kind: Mapped[SourceKind] = mapped_column(
        SAEnum(SourceKind, name="source_kind"), nullable=False
    )
    effective_month: Mapped[str | None] = mapped_column(String(7), nullable=True)  # YYYY-MM
    uploaded_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    status: Mapped[VersionStatus] = mapped_column(
        SAEnum(VersionStatus, name="version_status"),
        default=VersionStatus.UPLOADED,
        nullable=False,
    )
    storage_path: Mapped[str] = mapped_column(String(1024), nullable=False)
    checksum: Mapped[str] = mapped_column(String(128), nullable=False)
    extraction_error: Mapped[str | None] = mapped_column(String(2048), nullable=True)

    items: Mapped[list["PricelistItem"]] = relationship(
        back_populates="version", cascade="all, delete-orphan"
    )
    artifact: Mapped["ExtractionArtifact | None"] = relationship(
        back_populates="version", cascade="all, delete-orphan", uselist=False
    )


class PricelistItem(Base):
    """검증 완료된 본사 단가표 행 (제품 마스터)."""

    __tablename__ = "pricelist_items"
    __table_args__ = (UniqueConstraint("version_id", "sku", name="uq_pricelist_items_version_sku"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    version_id: Mapped[int] = mapped_column(
        ForeignKey("pricelist_versions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    sku: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    model_name: Mapped[str | None] = mapped_column(String(512), nullable=True)
    category: Mapped[str | None] = mapped_column(String(128), nullable=True)
    list_price: Mapped[float | None] = mapped_column(Numeric(14, 2), nullable=True)
    dealer_price: Mapped[float | None] = mapped_column(Numeric(14, 2), nullable=True)
    currency: Mapped[str] = mapped_column(String(8), default="KRW", nullable=False)
    raw_attrs: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    version: Mapped[PricelistVersion] = relationship(back_populates="items")


class ExtractionArtifact(Base, TimestampMixin):
    """PDF 추출 raw 데이터 + 사용자 편집 이력."""

    __tablename__ = "extraction_artifacts"

    id: Mapped[int] = mapped_column(primary_key=True)
    version_id: Mapped[int] = mapped_column(
        ForeignKey("pricelist_versions.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    rows: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    column_mapping: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    confidence: Mapped[float] = mapped_column(Numeric(5, 4), default=0.0, nullable=False)
    page_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    edited: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    version: Mapped[PricelistVersion] = relationship(back_populates="artifact")

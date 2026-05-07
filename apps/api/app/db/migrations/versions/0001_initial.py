"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-05-07

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0001"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    user_role = sa.Enum("admin", "editor", name="user_role")
    source_kind = sa.Enum("pdf", "xlsx", name="source_kind")
    version_status = sa.Enum(
        "uploaded", "extracting", "review", "verified", "archived", "failed",
        name="version_status",
    )
    diff_type = sa.Enum(
        "added", "removed", "price_changed", "model_name_changed",
        "sku_changed_suspected", "category_changed", "unchanged",
        name="diff_type",
    )

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("role", user_role, nullable=False, server_default="editor"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "pricelist_versions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("source_filename", sa.String(512), nullable=False),
        sa.Column("source_kind", source_kind, nullable=False),
        sa.Column("effective_month", sa.String(7), nullable=True),
        sa.Column("uploaded_by_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("status", version_status, nullable=False, server_default="uploaded"),
        sa.Column("storage_path", sa.String(1024), nullable=False),
        sa.Column("checksum", sa.String(128), nullable=False),
        sa.Column("extraction_error", sa.String(2048), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "pricelist_items",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "version_id",
            sa.Integer(),
            sa.ForeignKey("pricelist_versions.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("sku", sa.String(64), nullable=False),
        sa.Column("model_name", sa.String(512), nullable=True),
        sa.Column("category", sa.String(128), nullable=True),
        sa.Column("list_price", sa.Numeric(14, 2), nullable=True),
        sa.Column("dealer_price", sa.Numeric(14, 2), nullable=True),
        sa.Column("currency", sa.String(8), nullable=False, server_default="KRW"),
        sa.Column("raw_attrs", postgresql.JSONB(), nullable=True),
        sa.UniqueConstraint("version_id", "sku", name="uq_pricelist_items_version_sku"),
    )
    op.create_index("ix_pricelist_items_version_id", "pricelist_items", ["version_id"])
    op.create_index("ix_pricelist_items_sku", "pricelist_items", ["sku"])

    op.create_table(
        "extraction_artifacts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "version_id",
            sa.Integer(),
            sa.ForeignKey("pricelist_versions.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column("rows", postgresql.JSONB(), nullable=False, server_default="[]"),
        sa.Column("column_mapping", postgresql.JSONB(), nullable=True),
        sa.Column("confidence", sa.Numeric(5, 4), nullable=False, server_default="0"),
        sa.Column("page_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("edited", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "user_sheet_templates",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("owner_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("sheet_name", sa.String(120), nullable=True),
        sa.Column("header_row", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("mapping", postgresql.JSONB(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_user_sheet_templates_owner_id", "user_sheet_templates", ["owner_id"])

    op.create_table(
        "user_sheets",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("owner_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("original_filename", sa.String(512), nullable=False),
        sa.Column("storage_path", sa.String(1024), nullable=False),
        sa.Column("checksum", sa.String(128), nullable=False),
        sa.Column("sheet_layout", postgresql.JSONB(), nullable=True),
        sa.Column("template_id", sa.Integer(), sa.ForeignKey("user_sheet_templates.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_user_sheets_owner_id", "user_sheets", ["owner_id"])

    op.create_table(
        "compare_sessions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "user_sheet_id",
            sa.Integer(),
            sa.ForeignKey("user_sheets.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "version_id",
            sa.Integer(),
            sa.ForeignKey("pricelist_versions.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("created_by_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("status", sa.String(32), nullable=False, server_default="pending"),
        sa.Column("summary", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "compare_diffs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "session_id",
            sa.Integer(),
            sa.ForeignKey("compare_sessions.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("diff_type", diff_type, nullable=False),
        sa.Column("sku", sa.String(64), nullable=False),
        sa.Column("before", postgresql.JSONB(), nullable=True),
        sa.Column("after", postgresql.JSONB(), nullable=True),
        sa.Column("match_confidence", sa.Numeric(5, 4), nullable=False, server_default="1"),
        sa.Column("source_ref", postgresql.JSONB(), nullable=True),
        sa.Column("selected", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("decision_note", sa.String(512), nullable=True),
    )
    op.create_index("ix_compare_diffs_session_id", "compare_diffs", ["session_id"])
    op.create_index("ix_compare_diffs_diff_type", "compare_diffs", ["diff_type"])
    op.create_index("ix_compare_diffs_sku", "compare_diffs", ["sku"])

    op.create_table(
        "merge_jobs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "session_id",
            sa.Integer(),
            sa.ForeignKey("compare_sessions.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("output_path", sa.String(1024), nullable=True),
        sa.Column("status", sa.String(32), nullable=False, server_default="pending"),
        sa.Column("warnings", postgresql.JSONB(), nullable=True),
        sa.Column("error", sa.String(2048), nullable=True),
        sa.Column("created_by_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "audit_logs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("actor_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("action", sa.String(64), nullable=False),
        sa.Column("target_type", sa.String(64), nullable=False),
        sa.Column("target_id", sa.String(64), nullable=False),
        sa.Column("before", postgresql.JSONB(), nullable=True),
        sa.Column("after", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_audit_logs_actor_id", "audit_logs", ["actor_id"])
    op.create_index("ix_audit_logs_action", "audit_logs", ["action"])
    op.create_index("ix_audit_logs_target_type", "audit_logs", ["target_type"])
    op.create_index("ix_audit_logs_target_id", "audit_logs", ["target_id"])


def downgrade() -> None:
    op.drop_table("audit_logs")
    op.drop_table("merge_jobs")
    op.drop_table("compare_diffs")
    op.drop_table("compare_sessions")
    op.drop_table("user_sheets")
    op.drop_table("user_sheet_templates")
    op.drop_table("extraction_artifacts")
    op.drop_table("pricelist_items")
    op.drop_table("pricelist_versions")
    op.drop_table("users")
    sa.Enum(name="diff_type").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="version_status").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="source_kind").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="user_role").drop(op.get_bind(), checkfirst=True)

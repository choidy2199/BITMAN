"""Celery 비동기 작업: PDF 추출, 비교 실행, 머지 실행."""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

from app.db.session import SessionLocal
from app.models import (
    CompareDiff,
    CompareSession,
    ExtractionArtifact,
    MergeJob,
    PricelistVersion,
    UserSheet,
    VersionStatus,
)
from app.models.compare_session import DiffType
from app.schemas.user_sheet import ColumnMapping
from app.services import compare_engine, excel_read, merge_engine, pdf_extract
from app.storage.files import copy_to_output
from app.workers.celery_app import celery_app

log = logging.getLogger(__name__)


@celery_app.task(name="extract_pricelist")
def extract_pricelist(version_id: int) -> dict[str, Any]:
    db = SessionLocal()
    try:
        version = db.get(PricelistVersion, version_id)
        if version is None:
            return {"ok": False, "error": "version not found"}
        version.status = VersionStatus.EXTRACTING
        db.commit()

        path = Path(version.storage_path)
        try:
            if version.source_kind.value == "pdf":
                result = pdf_extract.extract_tables(path)
                rows = result.rows
                column_mapping = result.column_mapping
                confidence = result.confidence
                page_count = result.page_count
            else:
                # xlsx 직업로드: 첫 시트의 행을 그대로 추출
                preview = excel_read.preview_workbook(path)
                rows = []
                column_mapping = {}
                confidence = 1.0
                page_count = len(preview.get("sheets") or [])
                # xlsx는 이미 정형이라 기본 매핑/행 처리는 사용자가 검증화면에서 확정.

            artifact = (
                db.query(ExtractionArtifact).filter_by(version_id=version_id).one_or_none()
            )
            if artifact is None:
                artifact = ExtractionArtifact(version_id=version_id)
                db.add(artifact)
            artifact.rows = rows
            artifact.column_mapping = column_mapping
            artifact.confidence = confidence
            artifact.page_count = page_count

            version.status = VersionStatus.REVIEW
            version.extraction_error = None
            db.commit()
            return {"ok": True, "rows": len(rows), "confidence": confidence}
        except Exception as exc:  # pragma: no cover - defensive
            log.exception("Extraction failed")
            version.status = VersionStatus.FAILED
            version.extraction_error = str(exc)[:2000]
            db.commit()
            return {"ok": False, "error": str(exc)}
    finally:
        db.close()


@celery_app.task(name="run_compare")
def run_compare(session_id: int, sheet_name: str, header_row: int, mapping: dict) -> dict[str, Any]:
    db = SessionLocal()
    try:
        session = db.get(CompareSession, session_id)
        if session is None:
            return {"ok": False, "error": "session not found"}
        session.status = "running"
        db.commit()

        try:
            user_sheet = db.get(UserSheet, session.user_sheet_id)
            mapping_obj = ColumnMapping(**mapping)
            user_rows = excel_read.read_rows(
                user_sheet.storage_path, sheet_name, header_row, mapping_obj
            )

            from sqlalchemy import select

            from app.models import PricelistItem

            hq_items = (
                db.execute(select(PricelistItem).where(PricelistItem.version_id == session.version_id))
                .scalars()
                .all()
            )
            hq_dicts = [
                {
                    "sku": i.sku,
                    "model_name": i.model_name,
                    "list_price": i.list_price,
                    "dealer_price": i.dealer_price,
                    "category": i.category,
                }
                for i in hq_items
            ]

            diffs = compare_engine.compare(user_rows, hq_dicts)

            # 기존 diff 제거(재실행 대비)
            db.query(CompareDiff).filter_by(session_id=session_id).delete()
            for d in diffs:
                db.add(
                    CompareDiff(
                        session_id=session_id,
                        diff_type=d.diff_type,
                        sku=d.sku,
                        before=d.before,
                        after=d.after,
                        match_confidence=d.confidence,
                        source_ref=d.source_ref,
                        selected=d.diff_type
                        in {DiffType.ADDED, DiffType.PRICE_CHANGED, DiffType.MODEL_NAME_CHANGED},
                    )
                )
            session.summary = compare_engine.summarize(diffs)
            session.status = "ready"
            db.commit()
            return {"ok": True, "summary": session.summary}
        except Exception as exc:
            log.exception("Compare failed")
            session.status = "failed"
            db.commit()
            return {"ok": False, "error": str(exc)}
    finally:
        db.close()


@celery_app.task(name="run_merge")
def run_merge(job_id: int, sheet_name: str, mapping: dict, options: dict) -> dict[str, Any]:
    db = SessionLocal()
    try:
        job = db.get(MergeJob, job_id)
        if job is None:
            return {"ok": False, "error": "job not found"}
        job.status = "running"
        db.commit()
        try:
            session = db.get(CompareSession, job.session_id)
            user_sheet = db.get(UserSheet, session.user_sheet_id)
            selected = (
                db.query(CompareDiff)
                .filter_by(session_id=session.id, selected=True)
                .all()
            )
            payload = [
                {
                    "diff_type": d.diff_type.value,
                    "sku": d.sku,
                    "before": d.before,
                    "after": d.after,
                    "source_ref": d.source_ref,
                }
                for d in selected
            ]
            mapping_obj = ColumnMapping(**mapping)
            tmp_out = Path(user_sheet.storage_path).with_name(f"merge-{job_id}.xlsx")
            result = merge_engine.apply_merge(
                user_sheet.storage_path,
                tmp_out,
                sheet_name=sheet_name,
                mapping=mapping_obj,
                selected_diffs=payload,
                add_new_rows=options.get("add_new_rows", True),
                mark_removed=options.get("mark_removed", True),
            )
            stem = Path(user_sheet.original_filename).stem
            final = copy_to_output(result.output_path, f"{stem}_merged.xlsx")
            tmp_out.unlink(missing_ok=True)

            job.output_path = str(final)
            job.warnings = result.warnings
            job.status = "done"
            db.commit()
            return {"ok": True, "output_path": str(final), "applied": result.applied}
        except Exception as exc:
            log.exception("Merge failed")
            job.status = "failed"
            job.error = str(exc)[:2000]
            db.commit()
            return {"ok": False, "error": str(exc)}
    finally:
        db.close()

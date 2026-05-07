"""PDF → 표 추출. 1차 pdfplumber, 2차(Phase 2) camelot 폴백.

추출 결과는 `ExtractionResult.rows`로, 각 행은
{"row_id": "p1-r0", "cells": {"0": "2767-20", "1": "임팩트 렌치", ...},
 "confidence": 0.85, "needs_review": false}
형식이다.
"""
from __future__ import annotations

import statistics
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import pdfplumber

from app.services.normalize import HEADER_KEYWORDS, infer_column_mapping, normalize_text


@dataclass
class ExtractionResult:
    rows: list[dict[str, Any]] = field(default_factory=list)
    column_mapping: dict[str, str] = field(default_factory=dict)
    confidence: float = 0.0
    page_count: int = 0
    headers: list[str] = field(default_factory=list)


def _is_header_row(cells: list[str]) -> bool:
    joined = " ".join((c or "").strip().lower() for c in cells)
    if not joined:
        return False
    hits = 0
    for keywords in HEADER_KEYWORDS.values():
        if any(k in joined for k in keywords):
            hits += 1
    return hits >= 2


def _row_confidence(cells: list[Any], expected_cols: int) -> float:
    if expected_cols == 0:
        return 0.0
    non_empty = sum(1 for c in cells if c not in (None, ""))
    return min(1.0, non_empty / expected_cols)


def extract_tables(pdf_path: str | Path) -> ExtractionResult:
    """pdfplumber로 모든 페이지의 표를 추출하고 행을 누적."""
    pdf_path = Path(pdf_path)
    result = ExtractionResult()
    rows: list[dict[str, Any]] = []
    headers: list[str] = []
    confidences: list[float] = []

    with pdfplumber.open(pdf_path) as pdf:
        result.page_count = len(pdf.pages)
        for page_idx, page in enumerate(pdf.pages):
            tables = page.extract_tables() or []
            for tbl_idx, table in enumerate(tables):
                if not table:
                    continue
                expected_cols = max(len(r) for r in table)
                for r_idx, raw_row in enumerate(table):
                    cells = [normalize_text(c) for c in raw_row]
                    if not headers and _is_header_row([c or "" for c in cells]):
                        headers = [c or "" for c in cells]
                        continue
                    if all(c is None for c in cells):
                        continue
                    confidence = _row_confidence(cells, expected_cols)
                    confidences.append(confidence)
                    rows.append(
                        {
                            "row_id": f"p{page_idx + 1}-t{tbl_idx}-r{r_idx}",
                            "page": page_idx + 1,
                            "table": tbl_idx,
                            "cells": {str(i): v for i, v in enumerate(cells)},
                            "confidence": round(confidence, 4),
                            "needs_review": confidence < 0.6,
                        }
                    )

    result.rows = rows
    result.headers = headers
    if headers:
        result.column_mapping = infer_column_mapping(headers)
    result.confidence = round(statistics.mean(confidences), 4) if confidences else 0.0
    return result

"""사용자 Excel ↔ 본사 단가표 비교.

매칭 키: 정규화된 SKU. 일치 시 가격/모델명/카테고리 변경을 분류.
사용자에게 있고 본사에 없으면 REMOVED, 본사에 있고 사용자에 없으면 ADDED.
"""
from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from typing import Any

from app.models.compare_session import DiffType
from app.services.normalize import normalize_sku, normalize_text


def _eq_price(a: Any, b: Any) -> bool:
    if a is None and b is None:
        return True
    if a is None or b is None:
        return False
    try:
        return Decimal(str(a)) == Decimal(str(b))
    except Exception:
        return str(a) == str(b)


def _eq_text(a: Any, b: Any) -> bool:
    return normalize_text(a) == normalize_text(b)


@dataclass
class DiffOut:
    diff_type: DiffType
    sku: str
    before: dict[str, Any] | None
    after: dict[str, Any] | None
    confidence: float = 1.0
    source_ref: dict[str, Any] | None = None


def _row_to_dict(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "sku": row.get("sku"),
        "model_name": row.get("model_name"),
        "list_price": str(row["list_price"]) if row.get("list_price") is not None else None,
        "dealer_price": str(row["dealer_price"]) if row.get("dealer_price") is not None else None,
        "category": row.get("category"),
    }


def compare(
    user_rows: list[dict[str, Any]],
    hq_items: list[dict[str, Any]],
) -> list[DiffOut]:
    """사용자 행과 본사 항목을 비교하여 diff 리스트 반환.

    user_rows: excel_read.read_rows의 출력 (각 행에 _row 키)
    hq_items:  PricelistItem을 dict로 직렬화한 것 (sku, model_name, list_price, dealer_price, category)
    """
    user_by_sku: dict[str, dict[str, Any]] = {}
    for r in user_rows:
        sku = normalize_sku(r.get("sku"))
        if sku:
            user_by_sku[sku] = r

    hq_by_sku: dict[str, dict[str, Any]] = {}
    for item in hq_items:
        sku = normalize_sku(item.get("sku"))
        if sku:
            hq_by_sku[sku] = item

    diffs: list[DiffOut] = []

    # ADDED, *_CHANGED
    for sku, hq in hq_by_sku.items():
        user = user_by_sku.get(sku)
        if user is None:
            diffs.append(
                DiffOut(
                    diff_type=DiffType.ADDED,
                    sku=sku,
                    before=None,
                    after=_row_to_dict(hq),
                )
            )
            continue

        source_ref = {"row": user.get("_row")}

        if not _eq_price(user.get("list_price"), hq.get("list_price")) or not _eq_price(
            user.get("dealer_price"), hq.get("dealer_price")
        ):
            diffs.append(
                DiffOut(
                    diff_type=DiffType.PRICE_CHANGED,
                    sku=sku,
                    before=_row_to_dict(user),
                    after=_row_to_dict(hq),
                    source_ref=source_ref,
                )
            )
            continue

        if not _eq_text(user.get("model_name"), hq.get("model_name")):
            diffs.append(
                DiffOut(
                    diff_type=DiffType.MODEL_NAME_CHANGED,
                    sku=sku,
                    before=_row_to_dict(user),
                    after=_row_to_dict(hq),
                    source_ref=source_ref,
                )
            )
            continue

        if not _eq_text(user.get("category"), hq.get("category")) and (
            user.get("category") or hq.get("category")
        ):
            diffs.append(
                DiffOut(
                    diff_type=DiffType.CATEGORY_CHANGED,
                    sku=sku,
                    before=_row_to_dict(user),
                    after=_row_to_dict(hq),
                    source_ref=source_ref,
                )
            )

    # REMOVED
    for sku, user in user_by_sku.items():
        if sku not in hq_by_sku:
            diffs.append(
                DiffOut(
                    diff_type=DiffType.REMOVED,
                    sku=sku,
                    before=_row_to_dict(user),
                    after=None,
                    source_ref={"row": user.get("_row")},
                )
            )

    return diffs


def summarize(diffs: list[DiffOut]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for d in diffs:
        counts[d.diff_type.value] = counts.get(d.diff_type.value, 0) + 1
    return counts

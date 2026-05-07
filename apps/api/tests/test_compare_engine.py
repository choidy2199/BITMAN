from decimal import Decimal

from app.models.compare_session import DiffType
from app.services.compare_engine import compare, summarize


def _user(sku, model, lp, dp, cat="공구", row=10):
    return {
        "sku": sku,
        "model_name": model,
        "list_price": Decimal(str(lp)) if lp is not None else None,
        "dealer_price": Decimal(str(dp)) if dp is not None else None,
        "category": cat,
        "_row": row,
    }


def _hq(sku, model, lp, dp, cat="공구"):
    return {
        "sku": sku,
        "model_name": model,
        "list_price": Decimal(str(lp)) if lp is not None else None,
        "dealer_price": Decimal(str(dp)) if dp is not None else None,
        "category": cat,
    }


def test_added_when_only_in_hq():
    diffs = compare([], [_hq("2767-20", "임팩트", 500000, 350000)])
    assert len(diffs) == 1
    assert diffs[0].diff_type == DiffType.ADDED
    assert diffs[0].sku == "2767-20"


def test_removed_when_only_in_user():
    diffs = compare([_user("OLD-1", "구모델", 100, 80)], [])
    assert any(d.diff_type == DiffType.REMOVED and d.sku == "OLD-1" for d in diffs)


def test_price_changed_detected():
    diffs = compare(
        [_user("A", "X", 100, 80)],
        [_hq("A", "X", 110, 80)],
    )
    types = [d.diff_type for d in diffs]
    assert DiffType.PRICE_CHANGED in types


def test_model_name_changed_when_prices_match():
    diffs = compare(
        [_user("A", "구모델", 100, 80)],
        [_hq("A", "신모델", 100, 80)],
    )
    assert any(d.diff_type == DiffType.MODEL_NAME_CHANGED for d in diffs)


def test_unchanged_emits_nothing():
    diffs = compare(
        [_user("A", "X", 100, 80)],
        [_hq("A", "X", 100, 80)],
    )
    assert diffs == []


def test_summarize_counts_by_type():
    diffs = compare(
        [_user("A", "X", 100, 80), _user("B", "Y", 50, 40)],
        [_hq("A", "X", 110, 80), _hq("C", "Z", 30, 20)],
    )
    summary = summarize(diffs)
    assert summary.get("price_changed", 0) == 1
    assert summary.get("added", 0) == 1
    assert summary.get("removed", 0) == 1

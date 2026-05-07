from decimal import Decimal

from app.services.normalize import (
    col_index,
    col_letter,
    infer_column_mapping,
    normalize_sku,
    parse_price,
)


def test_normalize_sku_strips_whitespace_and_uppercases():
    assert normalize_sku("  2767-20 ") == "2767-20"
    assert normalize_sku("m18 fhz") == "M18FHZ"
    assert normalize_sku(None) is None
    assert normalize_sku("") is None


def test_parse_price_handles_korean_won():
    assert parse_price("123,456원") == Decimal("123456")
    assert parse_price("₩99,000") == Decimal("99000")
    assert parse_price("-") is None
    assert parse_price(None) is None
    assert parse_price("1234.5") == Decimal("1234.5")


def test_col_letter_and_index_roundtrip():
    for i in [0, 1, 25, 26, 27, 51, 52, 701, 702]:
        assert col_index(col_letter(i)) == i


def test_infer_column_mapping_picks_obvious_headers():
    headers = ["코드", "모델명", "카테고리", "정가", "딜러가"]
    mapping = infer_column_mapping(headers)
    assert mapping["sku"] == "0"
    assert mapping["model_name"] == "1"
    assert mapping["category"] == "2"
    assert mapping["list_price"] == "3"
    assert mapping["dealer_price"] == "4"

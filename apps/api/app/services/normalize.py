"""SKU 정규화, 가격 파싱, 헤더 추론 등 데이터 클렌징 헬퍼."""
from __future__ import annotations

import re
from decimal import Decimal, InvalidOperation
from typing import Any

_SKU_INVALID = re.compile(r"[^A-Z0-9\-]")
_PRICE_DROPCHARS = re.compile(r"[^\d.\-]")


def normalize_sku(value: Any) -> str | None:
    """공백/대시/대소문자/특수문자 정규화. 한국 Milwaukee SKU는 영숫자+대시 형태."""
    if value is None:
        return None
    s = str(value).strip().upper()
    if not s:
        return None
    s = s.replace(" ", "")
    s = _SKU_INVALID.sub("", s)
    return s or None


def parse_price(value: Any) -> Decimal | None:
    """`123,456원`, `₩123,456`, `123456.0` 모두 Decimal로 변환."""
    if value is None:
        return None
    s = str(value).strip()
    if not s:
        return None
    s = _PRICE_DROPCHARS.sub("", s)
    if not s or s in ("-", "."):
        return None
    try:
        return Decimal(s)
    except InvalidOperation:
        return None


def normalize_text(value: Any) -> str | None:
    if value is None:
        return None
    s = str(value).strip()
    s = re.sub(r"\s+", " ", s)
    return s or None


# 헤더 추론용 키워드 매핑.
HEADER_KEYWORDS: dict[str, list[str]] = {
    "sku": ["sku", "코드", "품번", "모델번호", "model no", "model number", "item code"],
    "model_name": ["모델명", "모델", "품명", "제품명", "model name", "description", "name"],
    "list_price": ["정가", "list price", "msrp", "권장소비자가", "소비자가"],
    "dealer_price": [
        "딜러가",
        "단가",
        "판매가",
        "공급가",
        "할인가",
        "dealer",
        "wholesale",
        "net",
    ],
    "category": ["카테고리", "분류", "category", "group"],
}


def infer_column_mapping(headers: list[str]) -> dict[str, str]:
    """헤더 문자열 리스트를 받아 표준 필드 → 헤더 인덱스 문자열 매핑 추론."""
    out: dict[str, str] = {}
    lowered = [(i, str(h).strip().lower()) for i, h in enumerate(headers) if h is not None]
    for field, keywords in HEADER_KEYWORDS.items():
        for i, h in lowered:
            if any(k in h for k in keywords):
                out[field] = str(i)
                break
    return out


def col_letter(index: int) -> str:
    """0-based index → Excel 컬럼 문자 (0 → A, 26 → AA)."""
    s = ""
    n = index
    while True:
        s = chr(ord("A") + (n % 26)) + s
        n = n // 26 - 1
        if n < 0:
            break
    return s


def col_index(letter: str) -> int:
    """Excel 컬럼 문자 → 0-based index."""
    n = 0
    for ch in letter.upper():
        n = n * 26 + (ord(ch) - ord("A") + 1)
    return n - 1

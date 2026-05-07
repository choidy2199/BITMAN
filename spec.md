# Milwaukee 단가표 관리 — 설계 스펙

> 클로드 채팅에 이 파일을 첨부하고 "이 스펙대로 단일 HTML 파일로 만들어줘"라고
> 요청하면, 아래 핵심 로직(특히 비교 엔진·머지 엔진)을 가진 1인용 도구가 나옵니다.

---

## 1. 목적

밀워키 한국 총판/딜러 업무에서 매월 반복하는 작업을 자동화한다.

- **본사가 매월 단가표(PDF 또는 Excel)를 배포** → 신제품 추가, 코드/모델명 변경,
  가격 변경, 단종이 섞여 있다.
- **내가 자체 관리하는 Excel 단가표**가 별도로 있다 (셀 색상·수식·병합셀 등 커스텀 포맷 포함).
- 두 파일을 비교해서 변경 항목을 항목별로 보여주고, 내가 선택한 변경사항만
  내 원본 Excel에 머지하여 다운로드한다. **원본 포맷은 그대로 보존.**

## 2. 핵심 워크플로

```
[본사 PDF 또는 Excel]
        │
        ▼
   ① 추출/검증            ← 표를 파싱하고, 신뢰도 낮은 셀은 사용자 확인
        │
        ▼
   본사 단가표 마스터(SKU/모델명/정가/딜러가/카테고리)
        │
[내 Excel]
        │
        ▼
   ② 컬럼 매핑            ← 내 Excel의 어느 컬럼이 SKU/모델명/가격인지 지정
        │
        ▼
   ③ 비교(diff 분류)      ← ADDED/REMOVED/PRICE_CHANGED/MODEL_NAME_CHANGED 등
        │
        ▼
   ④ 변경 항목 리뷰/선택   ← 적용할 항목 체크
        │
        ▼
   ⑤ 셀 단위 머지         ← 내 Excel에 값만 갱신, 스타일/수식/병합셀 보존
        │
        ▼
   {원본명}_merged_{타임스탬프}.xlsx
```

## 3. 단일 HTML 1인용 버전을 만들 때 권장 스택

서버 없이 브라우저에서 모두 처리한다.

| 영역 | 라이브러리 (CDN으로 로드) | 용도 |
|---|---|---|
| Excel 읽기 | [SheetJS / xlsx](https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js) | .xlsx 파싱 |
| Excel 쓰기 (포맷 보존) | [ExcelJS](https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js) | 셀 단위 갱신, 스타일 보존 |
| PDF 표 추출 | [PDF.js](https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.mjs) | 텍스트 PDF의 표 좌표·텍스트 추출 |
| UI | 순수 HTML + 약간의 CSS, 또는 Tailwind CDN | 단순 폼/표 |

**중요**: SheetJS의 무료 버전은 셀 스타일을 충분히 보존하지 않으므로,
**머지 출력은 ExcelJS로 작성**해야 한다. 읽기는 SheetJS가 쉬운 편이지만
스타일 보존을 위해서는 ExcelJS만 써도 된다.

## 4. UI (단일 HTML) — 한 페이지에 4개 섹션

```
┌──────────────────────────────────────────────────────────┐
│ Milwaukee 단가표 비교/머지                                │
├──────────────────────────────────────────────────────────┤
│ 1) 본사 단가표 (PDF 또는 XLSX) [파일 선택]               │
│    └ 추출 결과 미리보기 (편집 가능 그리드)                │
│       헤더: SKU | 모델명 | 카테고리 | 정가 | 딜러가      │
│       (각 컬럼에 드롭다운으로 매핑 — 자동 추론, 수동 보정)│
│                                                          │
│ 2) 내 Excel [파일 선택]                                  │
│    └ 시트 선택 + 컬럼 매핑                               │
│       SKU 컬럼: [A▼]  모델명: [B▼]  정가: [D▼] ...       │
│                                                          │
│ 3) 비교 결과                                             │
│    [신규 12] [단종 2] [가격변경 34] [모델명변경 1]      │
│    ┌────────────────────────────────────────────────┐   │
│    │ ☑ 유형     SKU       변경 전 → 변경 후     행  │   │
│    │ ☑ 신규     2855-20   — → 신제품 드릴        —  │   │
│    │ ☑ 가격변경 2767-20   500,000 → 520,000      42 │   │
│    │ ☐ 단종     2780-20   그라인더 → —           58 │   │
│    └────────────────────────────────────────────────┘   │
│    [모두 선택] [모두 해제]                               │
│    옵션: ☑ 신규 행 추가  ☑ 단종은 _단종후보 시트에 기록  │
│                                                          │
│ 4) [내 Excel에 적용 → 다운로드]                          │
└──────────────────────────────────────────────────────────┘
```

상태는 메모리에만 보관(새로고침하면 초기화). 1인용이라 인증/DB 불필요.

## 5. 데이터 모델 (메모리상 JS 객체)

```js
// 본사 단가표 1행
HQItem = {
  sku: "2767-20",          // 정규화된 코드 (대문자, 공백/특수문자 제거)
  model_name: "M18 임팩트 렌치",
  category: "Power Tool",
  list_price: 599000,       // Number (Decimal 처리는 Number로 충분, 통화기호/콤마 제거)
  dealer_price: 419300,
}

// 내 Excel 1행
UserRow = {
  sku: "2767-20",
  model_name: "M18 임팩트렌치",
  list_price: 599000,
  dealer_price: 419300,
  category: null,
  _row: 42,                // openpyxl 좌표용 (1-based 시트 행 번호)
}

// 비교 결과 1건
Diff = {
  diff_type: "added" | "removed" | "price_changed" | "model_name_changed" | "category_changed",
  sku: "2767-20",
  before: UserRow | null,
  after:  HQItem  | null,
  source_ref: { row: 42 } | null,
  selected: true,
}
```

## 6. 정규화 규칙 (필수 — 비교 정확도의 90%를 좌우)

### SKU 정규화
```js
function normalizeSku(value) {
  if (value == null) return null;
  let s = String(value).trim().toUpperCase();
  s = s.replace(/\s+/g, "");           // 공백 제거
  s = s.replace(/[^A-Z0-9-]/g, "");    // 영숫자+대시만 남김
  return s || null;
}
// "  2767-20 " → "2767-20"
// "m18 fhz"   → "M18FHZ"
// "48-11-1850" → "48-11-1850"
```

### 가격 파싱
```js
function parsePrice(value) {
  if (value == null) return null;
  let s = String(value).trim();
  s = s.replace(/[^\d.\-]/g, "");      // 통화기호/콤마 제거
  if (!s || s === "-" || s === ".") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
// "₩599,000" → 599000
// "599,000원" → 599000
// "1234.5"   → 1234.5
```

### 텍스트 정규화
```js
function normalizeText(value) {
  if (value == null) return null;
  return String(value).trim().replace(/\s+/g, " ") || null;
}
```

### 헤더 키워드 매핑 (자동 컬럼 추론)
```js
const HEADER_KEYWORDS = {
  sku:          ["sku", "코드", "품번", "모델번호", "model no", "model number", "item code", "item no"],
  model_name:   ["모델명", "모델", "품명", "제품명", "model name", "description", "name"],
  list_price:   ["정가", "list price", "msrp", "권장소비자가", "소비자가"],
  dealer_price: ["딜러가", "단가", "판매가", "공급가", "할인가", "dealer", "wholesale", "net"],
  category:     ["카테고리", "분류", "category", "group"],
};

function inferMapping(headers) {
  const out = {};
  headers.forEach((h, i) => {
    const lower = String(h || "").toLowerCase();
    for (const [field, keywords] of Object.entries(HEADER_KEYWORDS)) {
      if (out[field]) continue;
      if (keywords.some(k => lower.includes(k))) out[field] = i;
    }
  });
  return out;
}
```

## 7. 비교 엔진 (그대로 JS로 옮기면 됨)

```js
function compare(userRows, hqItems) {
  const userBySku = new Map();
  for (const r of userRows) {
    const sku = normalizeSku(r.sku);
    if (sku) userBySku.set(sku, r);
  }
  const hqBySku = new Map();
  for (const i of hqItems) {
    const sku = normalizeSku(i.sku);
    if (sku) hqBySku.set(sku, i);
  }

  const diffs = [];
  for (const [sku, hq] of hqBySku) {
    const user = userBySku.get(sku);
    if (!user) {
      diffs.push({ diff_type: "added", sku, before: null, after: hq, source_ref: null });
      continue;
    }
    const ref = { row: user._row };
    if (user.list_price !== hq.list_price || user.dealer_price !== hq.dealer_price) {
      diffs.push({ diff_type: "price_changed", sku, before: user, after: hq, source_ref: ref });
      continue;
    }
    if (normalizeText(user.model_name) !== normalizeText(hq.model_name)) {
      diffs.push({ diff_type: "model_name_changed", sku, before: user, after: hq, source_ref: ref });
      continue;
    }
    if (normalizeText(user.category) !== normalizeText(hq.category) &&
        (user.category || hq.category)) {
      diffs.push({ diff_type: "category_changed", sku, before: user, after: hq, source_ref: ref });
    }
  }
  for (const [sku, user] of userBySku) {
    if (!hqBySku.has(sku)) {
      diffs.push({ diff_type: "removed", sku, before: user, after: null, source_ref: { row: user._row } });
    }
  }
  return diffs;
}
```

분류 규칙(우선순위 순):
1. 본사에만 있음 → `added`
2. 둘 다 있는데 가격 다름 → `price_changed` (정가/딜러가 중 하나라도 다르면)
3. 가격 같고 모델명 다름 → `model_name_changed`
4. 그 외 카테고리만 다름 → `category_changed`
5. 사용자에만 있음 → `removed`

## 8. 머지 엔진 — 셀 단위 갱신 (가장 중요)

**원칙**: 내 원본을 다시 그리지 말고, 셀 좌표를 받아 값만 덮어쓴다. 스타일/수식/
병합셀은 절대 건드리지 않는다.

### ExcelJS 의사코드

```js
async function applyMerge(srcArrayBuffer, sheetName, mapping, selectedDiffs, options) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(srcArrayBuffer);
  const ws = wb.getWorksheet(sheetName);
  if (!ws) throw new Error("Sheet not found: " + sheetName);

  const colLetter = (letter) => letter.toUpperCase();
  const skuCol    = colLetter(mapping.sku);
  const modelCol  = mapping.model_name;
  const listCol   = mapping.list_price;
  const dealerCol = mapping.dealer_price;
  const catCol    = mapping.category;

  // 마지막 데이터 행 = SKU 컬럼이 비지 않은 마지막 행
  let lastDataRow = 1;
  ws.eachRow((row, rowNumber) => {
    if (row.getCell(skuCol).value) lastDataRow = rowNumber;
  });
  let nextNewRow = lastDataRow + 1;

  // 단종 시트 준비
  let removedSheet = null;
  if (options.markRemoved) {
    removedSheet = wb.getWorksheet("_단종후보") || wb.addWorksheet("_단종후보");
    if (removedSheet.rowCount === 0) {
      removedSheet.addRow(["SKU", "모델명", "정가", "딜러가", "카테고리", "기록일"]);
    }
  }

  const warnings = [];
  let applied = 0;

  for (const d of selectedDiffs) {
    if (d.diff_type === "price_changed" ||
        d.diff_type === "model_name_changed" ||
        d.diff_type === "category_changed") {
      const row = d.source_ref?.row;
      if (!row) { warnings.push(`${d.sku}: row 좌표 없음`); continue; }
      if (modelCol  && d.after.model_name   != null) ws.getCell(`${modelCol}${row}`).value = d.after.model_name;
      if (listCol   && d.after.list_price   != null) ws.getCell(`${listCol}${row}`).value = d.after.list_price;
      if (dealerCol && d.after.dealer_price != null) ws.getCell(`${dealerCol}${row}`).value = d.after.dealer_price;
      if (catCol    && d.after.category     != null) ws.getCell(`${catCol}${row}`).value = d.after.category;
      applied++;
    }
    else if (d.diff_type === "added") {
      if (!options.addNewRows) continue;
      const target = nextNewRow;
      // 윗 행 스타일 복제
      const tmpl = ws.getRow(lastDataRow);
      const newRow = ws.getRow(target);
      tmpl.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const nc = newRow.getCell(colNumber);
        nc.style = JSON.parse(JSON.stringify(cell.style)); // deep clone
        // 수식이면 행 오프셋 적용 (간단 버전: 같은 컬럼의 같은 식을 행만 바꿔서 사용)
        if (typeof cell.value === "object" && cell.value?.formula) {
          const offset = target - lastDataRow;
          const adjusted = cell.value.formula.replace(/([A-Z]+)(\d+)/g, (_, col, n) => col + (Number(n) + offset));
          nc.value = { formula: adjusted };
        }
      });
      newRow.getCell(skuCol).value = d.sku;
      if (modelCol)  newRow.getCell(modelCol).value  = d.after.model_name ?? null;
      if (listCol)   newRow.getCell(listCol).value   = d.after.list_price ?? null;
      if (dealerCol) newRow.getCell(dealerCol).value = d.after.dealer_price ?? null;
      if (catCol)    newRow.getCell(catCol).value    = d.after.category ?? null;
      newRow.commit();
      nextNewRow++;
      applied++;
    }
    else if (d.diff_type === "removed" && removedSheet) {
      removedSheet.addRow([
        d.sku,
        d.before.model_name,
        d.before.list_price,
        d.before.dealer_price,
        d.before.category,
        new Date().toISOString().slice(0, 10),
      ]);
      applied++;
    }
  }

  const out = await wb.xlsx.writeBuffer();
  return { buffer: out, applied, warnings };
}
```

### 중요한 보존 규칙
- 가격 변경 등 **기존 행 수정** 시: `cell.value = ...` 만 하면 ExcelJS가 스타일을 유지함.
  단, `cell` 객체를 새로 만들지 말 것.
- **신규 행 삽입** 시: 가장 가까운 윗 행의 스타일을 deep clone 해서 복제.
- **수식**: 단순한 케이스(예: `=D2-E2`)는 셀 참조의 행 번호만 옵셋 처리. 복잡한
  수식은 그대로 두고 사용자가 확인하게 한다.
- **병합셀**(`ws.mergedCells`): 절대 변경하지 않음. ExcelJS는 로드/저장에서 자동 보존.
- **단종은 행 삭제 금지**. 별도 시트에 기록하고 원본 행은 그대로 둔다.

## 9. PDF 추출 (텍스트 PDF만 — 스캔본은 미지원)

PDF.js로 페이지마다 텍스트 아이템과 좌표를 받아 행/열로 클러스터링한다.

### 휴리스틱
1. 페이지의 모든 텍스트 아이템을 `(x, y, text)` 리스트로 수집.
2. **y 좌표가 비슷한 것들끼리 묶어 행**으로 만든다 (허용 오차 ~3pt).
3. 각 행 안에서 **x 좌표 기준으로 정렬**한 뒤, 인접 아이템 간 x 간격이
   **임계값(~10pt)** 이상이면 다른 컬럼으로 분리.
4. 첫 번째로 헤더 키워드(`코드/SKU/정가/...`)가 매칭되는 행을 헤더로 지정.
5. 헤더 이후의 행을 데이터로 누적.
6. 행마다 신뢰도 = 비어있지 않은 셀 수 / 전체 컬럼 수.

이 방식은 라인이 명확한 표에서 잘 동작하고, **셀 병합/줄바꿈/회전 텍스트가 있는
복잡한 표는 빠진다**. 그래서 검증 화면에서 사용자가 손본다.

PDF가 잘 안 되면 **사용자가 직접 본사 Excel 변환본을 올리는 우회로**를 둔다.
(파일 입력에서 .pdf와 .xlsx 둘 다 받게)

## 10. 단일 HTML 구현 단계 (Claude에게 시킬 순서)

1. 빈 HTML 골격 + Tailwind CDN + ExcelJS, SheetJS, PDF.js CDN 로드
2. 4개 섹션 (본사파일 / 내파일 / 비교결과 / 머지) 정적 레이아웃
3. **본사 Excel 업로드 → 시트 선택 → 헤더 자동 추론 → 매핑 그리드** 구현
4. 본사 PDF 업로드 → PDF.js로 텍스트 추출 → 표로 클러스터링 → 동일 그리드에 표시
5. **내 Excel 업로드 → 시트/매핑 UI** 구현
6. **`compare()` 호출 → 카운트 카드 + 변경 항목 표** 렌더
7. 체크박스 선택 + 옵션 토글
8. **`applyMerge()` 호출 → Blob 다운로드** (`URL.createObjectURL`)
9. 단위 테스트 케이스(주석으로 적어둠) — 실데이터로 끝까지 한 번 돌려본다

### 머지 검증 체크리스트
머지된 파일을 열어서 다음을 확인:
- [ ] 가격이 변경된 행의 셀 색상/굵기가 그대로인가
- [ ] 다른 컬럼의 수식 (`=D2-E2` 등) 결과가 정상인가
- [ ] 병합셀 영역이 그대로 유지되는가
- [ ] 신규 행이 마지막 데이터 아래에 추가되었고 윗 행 서식을 따르는가
- [ ] 단종 항목이 `_단종후보` 시트에 기록되었는가 (원본 시트의 그 행은 그대로)

## 11. 알려진 한계 (단일 HTML 버전 기준)

- **스캔본 PDF 미지원** — OCR 라이브러리 추가 필요(Tesseract.js)하지만 한국어 정확도 낮음.
  본사 PDF가 텍스트 PDF인지 먼저 확인.
- **`.xlsm` 매크로/차트** — ExcelJS가 일부 메타를 잃을 수 있어 `.xlsx`만 권장.
- **fuzzy 매칭(SKU 코드만 바뀐 동일 제품)** — Phase 2. 우선은 SKU 정확매칭.
- **이력 저장** — 1인용이라 별도 DB 없이 머지 시점에 변경 항목을 텍스트 로그
  파일로도 같이 다운로드해서 사용자가 보관(.txt 또는 함께 만든 시트).

## 12. 클로드에게 던질 1줄 프롬프트 예시

```
첨부한 spec.md대로 단일 HTML 파일 1개로 동작하는 도구를 만들어줘.
- 외부 의존성은 모두 CDN으로
- 서버 없음(브라우저 안에서만 동작)
- 머지 출력은 ExcelJS로 작성, 스타일/수식/병합셀 보존이 최우선
- 본사 Excel 우선, PDF는 가능하면 동작하지만 안 되면 안내 메시지로 대체
- 코드 안에 컬럼 매핑 자동 추론, SKU 정규화, 비교 분류 5종, 머지 옵션 2개를 포함
파일 이름: bitman.html. 한 파일에 다 넣어줘.
```

---

## 부록 A: 기존에 만든 백엔드 (참고용, 단일 HTML로 가면 폐기)

전체 모노레포(`apps/api`, `apps/web`, Postgres, Redis, Celery)를 만들었지만,
1인용으로는 과대 설계임. 핵심 알고리즘만 위 6~8장에 정리되어 있고,
원본 Python 코드는 다음 파일들에 있다 (필요 시 JS로 포팅 참고):

- `apps/api/app/services/normalize.py` — SKU/가격/텍스트 정규화, 헤더 추론
- `apps/api/app/services/compare_engine.py` — 비교 분류 로직
- `apps/api/app/services/merge_engine.py` — openpyxl 기반 머지 (셀 단위 갱신, 신규
  행 삽입 시 스타일 복제 + 수식 Translator, 단종은 별도 시트)
- `apps/api/app/services/pdf_extract.py` — pdfplumber 기반 PDF 표 추출

테스트 (실제로 통과한 시나리오):
- 셀 색상(노란 배경) + 굵게 폰트 + `=D2-E2` 수식 + `H1:I1` 병합셀이 모두 머지 후
  보존됨을 검증
- 신규 행 삽입 시 윗 행 스타일이 복제되고 수식이 행 오프셋으로 자동 조정됨
- 단종 항목이 `_단종후보` 시트에 기록되며 원본 시트는 그대로 유지됨

---

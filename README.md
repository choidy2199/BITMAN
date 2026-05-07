# BITMAN — Milwaukee 단가표 관리 웹앱

Milwaukee 한국 총판/딜러용 단가표 관리 웹앱. 본사 PDF/Excel 단가표와 사용자 자체 관리 Excel을 비교하여 신제품·코드/모델명 변경·단가 변경·단종 항목을 검출하고, 사용자 Excel의 셀 서식·수식·병합셀을 보존한 채 변경사항을 머지한다.

## 구조

```
BITMAN/
├── apps/
│   ├── web/      # Next.js 14 + TypeScript + Tailwind
│   └── api/      # FastAPI + SQLAlchemy + Celery + Alembic
├── packages/
│   └── shared/   # OpenAPI → TypeScript 타입 자동 생성
├── infra/        # docker-compose, nginx
└── scripts/
```

## 빠른 시작 (개발)

```bash
# 1. 환경변수 복사
cp infra/env/.env.example .env

# 2. Docker 스택 기동 (web, api, worker, postgres, redis)
docker compose -f infra/docker-compose.yml up --build

# 3. 시드 사용자 생성
docker compose -f infra/docker-compose.yml exec api python -m app.scripts.seed
```

- Web: http://localhost:3000
- API: http://localhost:8000/docs
- 기본 계정: `admin@bitman.local` / `admin1234` (시드 후)

## 핵심 흐름

1. `/pricelists/upload` — 본사 PDF 업로드 → pdfplumber 추출 → 비동기 변환
2. `/pricelists/[id]/verify` — 추출 결과 그리드에서 검증/수정 → 확정
3. `/compare/new` — 사용자 Excel 업로드 + 컬럼 매핑 → 본사 버전 선택 → 비교
4. `/compare/[sessionId]/review` — 변경 종류별 리뷰, 머지 대상 선택
5. `/merges/[id]` — 머지 결과 다운로드 (`.xlsx`, 원본 포맷 보존)
6. `/history` — 변경 이력 조회

## 기술 스택

- Frontend: Next.js 14 App Router, TypeScript, Tailwind, TanStack Table
- Backend: FastAPI, SQLAlchemy 2.x, Alembic, Pydantic v2
- 비동기: Celery + Redis
- DB: PostgreSQL 16
- PDF: pdfplumber (1차), camelot-py (Phase 2 폴백)
- Excel: openpyxl (포맷 보존), pandas (비교)
- 매칭: rapidfuzz (Phase 2 fuzzy)

## 제약 (MVP)

- `.xlsx`만 지원 (`.xls` 거부, `.xlsm`/매크로/차트는 Phase 2)
- 텍스트 PDF 우선 (스캔본 OCR은 Phase 2)
- SKU 정확 매칭 기반 비교 (모델명 fuzzy는 Phase 2)

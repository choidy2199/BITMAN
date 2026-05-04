# TOOLBOX

산업용 공구 입찰형 마켓플레이스. **크림(KREAM) + 네이버 스마트스토어** 컨셉.

> 판매자가 가격을 입찰하고, 소비자가 최저가로 구매하는 구조. 단일 상품 페이지 / 다수 판매자 입찰 / 합배송 / 보증금 / 에스크로.

## 단계

현재 **Phase 0 — 뼈대 구축**. 모노레포·DB 마이그레이션·3채널 라우트 그룹·인프라 스텁만 자리잡음. 비즈니스 로직은 Phase 1+에서.

자세한 단계는 노션의 [인프라 로드맵 Phase 0~5] 참조.

## 빠른 시작

```bash
# 1. 의존성 설치
pnpm install

# 2. 환경변수 셋업
cp .env.example .env.local
# .env.local에 Supabase / 토스페이먼츠 키 입력

# 3. (옵션) 로컬 Supabase 띄우기
cd packages/db && pnpm supabase start
pnpm supabase db reset                  # 마이그레이션 + seed 적용

# 4. 개발 서버
pnpm dev
# → http://localhost:3000
```

## 모노레포 구조

```
apps/
  web/                  Next.js 14 App Router (3채널 통합)
  cron-worker/          백그라운드 잡 (자동 정산, 자동 구매확정 등)

packages/
  config/               tsconfig, eslint, tailwind preset
  ui/                   디자인 토큰 + 컴포넌트 (toollab-design-system)
  domain/               비즈니스 타입 + 순수 함수 (수수료, 입찰, 합배송)
  db/                   Supabase 클라이언트 + 15개 테이블 마이그레이션
  auth/                 역할 가드 (buyer/seller/admin)
  cache/                캐시 인터페이스 — Phase 2에 Upstash Redis 교체
  queue/                큐 인터페이스 — Phase 4에 Upstash QStash 교체
  search/               검색 인터페이스 — Phase 3에 Algolia 교체
  payments/             토스페이먼츠 인터페이스 — Phase 1에서 실연결
  notify/               카카오 알림톡 인터페이스 + 9개 템플릿 코드
```

## 3채널 라우팅

| 채널 | 경로 | 접근 |
|---|---|---|
| 구매자 | `/`, `/products`, `/cart`, `/mypage` | 비로그인 가능 (가격 블러) |
| 판매자 | `/seller/*` | role=seller AND 승인됨 |
| 관리자 | `/admin/*` | role=admin |

자세한 매트릭스는 [docs/channels.md](./docs/channels.md).

## 핵심 원칙

노션 "사이트 만들 때 지켜야 하는 규칙" 10가지를 코드 레벨로 강제:

- 한 파일 300줄 이하
- TypeScript 100%
- shadcn/ui + Tailwind (직접 CSS 금지)
- Zustand(UI) + TanStack Query(서버)
- 작은 커밋, 자주 커밋
- 3채널 모듈 독립

노션 "동시접속 1만 명 아키텍처 설계"의 원칙:

- **읽기는 분산** (cache + read replica + search engine)
- **쓰기는 줄세움** (queue)
- 코드는 1만 동접 기준, 인프라는 단계적

## 문서

- [docs/architecture.md](./docs/architecture.md) — 시스템 아키텍처
- [docs/erd.md](./docs/erd.md) — 데이터 모델 (Mermaid)
- [docs/channels.md](./docs/channels.md) — 3채널 라우팅/권한 매트릭스

# TOOLBOX 시스템 아키텍처

## 1. 한 줄 요약

크림 양방향 입찰 + 합배송 + 에스크로를 **단일 Next.js 앱(3채널)** + Supabase + 단계적 인프라 증설로 구현.

## 2. 트래픽 처리 원칙 (1만 동접 대비)

> 노션 "동시접속 1만 명을 견디는 아키텍처 설계" 그대로.

```
[읽기 95%]                       [쓰기 5%]
- 상품 검색                       - 입찰 등록
- 시세 차트 조회                   - 결제
- 판매자 목록                     - 정산
       ↓                              ↓
   캐시 + Read Replica            큐 + Primary DB
```

읽기는 분산, 쓰기는 줄세움.

## 3. 컴포넌트

| 레이어 | 도구 | Phase 0 상태 |
|---|---|---|
| CDN/WAF | Cloudflare | 미적용 (Phase 3+) |
| 프론트/SSR | Next.js 14 + Vercel | ✅ 셋업 |
| API | Next.js Route Handlers | ✅ 골조 |
| DB | Supabase Postgres (`Daehan`, Seoul) | ✅ 마이그레이션 SQL |
| 캐시 | `@toolbox/cache` (in-memory stub → Upstash Redis) | ✅ 인터페이스 |
| 큐 | `@toolbox/queue` (즉시실행 stub → Upstash QStash) | ✅ 인터페이스 |
| 검색 | `@toolbox/search` (Supabase ilike → Algolia) | ✅ 인터페이스 |
| 결제 | 토스페이먼츠 (일반결제 + 빌링키 + 에스크로) | ✅ 인터페이스 |
| 알림 | 카카오 알림톡 (NHN Cloud or 카카오 i 비즈) | ✅ 9개 템플릿 enum |
| 인증 | Supabase Auth + 네이버/구글/애플 OAuth | ✅ 골조 |
| 모니터링 | Sentry + Vercel Analytics | Phase 1 |

## 4. 도메인 분리 (3채널)

```
/             구매자 — 홈, 상품, 검색, 장바구니, 결제, 마이페이지
/seller/*     판매자 — 가입, 입찰, 주문 처리, 정산
/admin/*      관리자 — 제품 등록, 판매자 승인, 정산 승인, 회원
```

각 채널은 **독립 모듈**로 취급. 한 채널 수정이 다른 채널에 영향 없게 (노션 "코드 작업 규칙 — 5번"). `apps/web/src/app/(buyer|seller|admin)` 라우트 그룹으로 격리.

## 5. 입찰 매칭 시나리오 (Phase 1+)

### 즉시구매
```
구매자가 판매 입찰 N개 중 하나 선택
  → bids row의 stock 차감 (트랜잭션 내 SELECT FOR UPDATE)
  → orders / order_items / payments INSERT
  → 토스페이먼츠 charge() (escrow=true)
  → notify.sendKakao(ORDER_RECEIVED_TO_SELLER)
```

### 즉시판매 (구매 입찰 수락)
```
판매자가 buyer_bids 중 하나 수락
  → 트랜잭션 내 buyer_bid.status = 'matched' (CAS)
  → 동일 buyer_bid에 다른 판매자 수락 시도 시 status 충돌로 거부
  → payments.autoCharge(billing_key) — 빌링키 자동결제
  → orders 생성
  → notify.sendKakao(BID_MATCHED) → 구매자
```

### 자동 최저가 입찰 (Phase 2)
```
경쟁자가 더 낮은 가격으로 입찰 → trigger
  → @toolbox/domain의 nextAutoBidPrice() 계산
  → bids.sale_price 자동 하향 (min_sale_price 침범 X)
  → notify.sendKakao(LOWEST_PRICE_BEATEN)는 자동입찰 OFF인 판매자에게만
```

## 6. 운영 위험 4가지 (노션 정리)

1. **정산 정합성** — 모든 돈의 움직임은 추가만 가능, 수정 불가. Phase 1에서 `transaction_log` 테이블 별도 운영 검토.
2. **CS 폭증** — 챗봇 + FAQ + 단계별 에스컬레이션 (Phase 3).
3. **트래픽 스파이크** — Vercel·Supabase 오토스케일링 + DB 커넥션 풀 한도 점검.
4. **보안** — Cloudflare WAF + Turnstile + 결제 3DS + 이상거래 감지 (Phase 3).

## 7. 단계적 인프라 증설

| 단계 | 동접 | 추가 인프라 | 월 비용 |
|---|---|---|---|
| Phase 0 (지금) | ~100 | Vercel Hobby + Supabase Free | $0 |
| Phase 1 | ~500 | Vercel Pro + Supabase Pro | ~$50 |
| Phase 2 | ~1,000 | + Upstash Redis | ~$150 |
| Phase 3 | ~3,000 | + Algolia + QStash | ~$500 |
| Phase 4 | ~5,000 | + Read Replica | ~$1,500 |
| Phase 5 | ~10,000 | 자체 서버 + 자체 PG | ~$5,000+ |

판단 기준: 인프라 비용 > 수수료 수익의 10%, P95 응답 > 1s, 월 API > 500만건 — **2개 이상 해당 시 다음 단계로**.

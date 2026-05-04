# 3채널 라우팅 / 권한 매트릭스

## 라우트 그룹

```
apps/web/src/app/
├── (buyer)/      구매자 — public + 본인 마이페이지
├── (seller)/     판매자 — role=seller AND 승인됨
├── (admin)/      관리자 — role=admin
└── (auth)/       로그인/가입
```

## 경로별 접근

| 경로 | 비로그인 | 구매자 | 판매자 | 관리자 |
|---|---|---|---|---|
| `/` | ✅ (가격 블러) | ✅ | ✅ | ✅ |
| `/products` | ✅ (가격 블러) | ✅ | ✅ | ✅ |
| `/products/[id]` | ✅ (가격/입찰/그래프 블러) | ✅ | ✅ | ✅ |
| `/cart` | → /login | ✅ | ✅ | ✅ |
| `/checkout` | → /login | ✅ | — | — |
| `/orders/*` | → /login | 본인 주문만 | — | — |
| `/mypage` | → /login | ✅ | — | — |
| `/seller/register` | → /login | ✅ (판매자 전환) | — | — |
| `/seller` | → /login | → /seller/register | ✅ (승인 후) | ✅ |
| `/seller/bids` | → /login | → /seller/register | ✅ | ✅ |
| `/seller/orders` | → /login | → /seller/register | ✅ | ✅ |
| `/seller/settlements` | → /login | → /seller/register | ✅ | ✅ |
| `/admin/*` | 403 | 403 | 403 | ✅ |

## 미들웨어 동작

`apps/web/src/middleware.ts`에서:

1. Supabase 세션 확인 → `auth.getUser()`
2. `public.users.role` 조회
3. 라우트 prefix별 가드:
   - `/admin` → role !== 'admin' → 403
   - `/seller` → role !== 'seller' AND role !== 'admin' → /seller/register
4. 환경변수 미설정(Phase 0 개발 편의) 시 우회

## 가격 블러 (비로그인)

노션 "UI관련 — 접근 제한":
- 비로그인 상태: 제품 이미지 + 제품명만
- 가격, 입찰, 거래내역, 그래프 → 블러 + "로그인 후 이용 가능합니다" 오버레이

서버 사이드에서 비로그인 시 가격 필드를 마스킹하지 말고, **클라이언트에서 블러** 처리. (SEO 메타에는 가격이 있어야 OG 카드 노출 가능 — 단, 검색 엔진 인덱싱 정책은 추후 결정)

## 데스크탑 신규창 동작

노션 "관리자 Page" 메모:
> 홈화면에서 제품 클릭 시 홈화면은 그대로, 새로운 창이 열린다. 데스크탑 한정.

→ 구매자 홈에서 제품 카드 클릭 시 `target="_blank"` (Phase 1 구현). 모바일은 동일 탭 네비.

## 권한 ↔ DB RLS 매핑

| 채널 | 미들웨어 가드 | DB RLS |
|---|---|---|
| 비로그인 | — | `bids` SELECT (active만), `products` SELECT (active만), `brands` / `categories` SELECT |
| 구매자 | login 필요 라우트 | 본인 `orders`, `buyer_bids`, `billing_keys`, `notifications` |
| 판매자 | seller 라우트 | 본인 `bids`, 본인 상품의 `buyer_bids` SELECT, 본인 `seller_profiles`, 본인 `settlements` |
| 관리자 | admin 라우트 | 모든 테이블 (RLS bypass) |

미들웨어와 RLS는 **이중 방어**. 미들웨어가 뚫려도 DB가 막고, DB가 뚫려도 미들웨어가 막음.

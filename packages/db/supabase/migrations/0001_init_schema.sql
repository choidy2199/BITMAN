-- TOOLBOX 초기 스키마. 15개 테이블.
-- 노션 "프로젝트 개요", "관리자/판매자/구매자 Page", "공통 체크리스트" 종합.
--
-- 원칙:
--   * 모든 PK는 UUID
--   * created_at / updated_at 표준 컬럼
--   * 금액은 INT (KRW 원 단위, 소수점 없음)
--   * 소프트 삭제는 status enum으로 처리

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ========================================================================
-- 1. users — auth.users 확장 (1:1)
-- ========================================================================
create type user_role as enum ('buyer', 'seller', 'admin');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'buyer',
  email text,
  phone text,                      -- 카카오 알림톡 발송용
  oauth_provider text,             -- 'naver' | 'google' | 'apple'
  marketing_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index users_role_idx on public.users(role);

-- ========================================================================
-- 2. seller_profiles — 사업자 정보 + 보증금 + 신용점수
-- ========================================================================
create type seller_status as enum ('pending', 'approved', 'suspended', 'withdrawn');

create table public.seller_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  business_name text not null,
  business_no text not null,                    -- 사업자등록번호
  representative_name text not null,
  business_address text not null,
  cert_url text,                                -- 통판업 사본 (Storage URL)
  bank_name text not null,
  bank_account text not null,
  bank_holder text not null,
  deposit_amount int not null default 1000000,  -- 100만원
  deposit_paid boolean not null default false,
  credit_score int not null default 100,
  status seller_status not null default 'pending',
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index seller_profiles_status_idx on public.seller_profiles(status);

-- ========================================================================
-- 3. brands
-- ========================================================================
create type brand_tier as enum ('major', 'minor', 'indie');

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  name_ko text not null,
  name_en text,
  logo_url text,
  tier brand_tier not null default 'major',
  monthly_fee int not null default 0,           -- minor/indie 입점비 (Phase 3)
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create unique index brands_name_ko_uq on public.brands(name_ko);

-- ========================================================================
-- 4. categories — 대/소분류 (self-reference)
-- ========================================================================
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories(id) on delete cascade,
  name text not null,
  slug text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create unique index categories_slug_uq on public.categories(slug);
create index categories_parent_idx on public.categories(parent_id);

-- ========================================================================
-- 5. products — 관리자만 등록. 단일 페이지 / 다수 판매자 입찰
-- ========================================================================
create type product_composition as enum ('bare', 'set');

create table public.products (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id),
  category_id uuid references public.categories(id),
  model_no text not null,
  name text not null,
  name_en text,
  thumbnail_url text,
  specs jsonb not null default '{}'::jsonb,     -- {voltage, torque, weight, battery, ...}
  composition product_composition not null default 'bare',
  commission_rate numeric(5,4),                 -- null이면 글로벌 기본값 사용
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index products_model_brand_uq on public.products(brand_id, model_no, composition);
create index products_brand_idx on public.products(brand_id);
create index products_category_idx on public.products(category_id);

-- ========================================================================
-- 6. bids — 판매 입찰. (product_id, seller_id) UNIQUE
-- ========================================================================
create type sell_bid_status as enum ('active', 'paused', 'sold_out', 'withdrawn');

create table public.bids (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  seller_id uuid not null references public.users(id) on delete cascade,
  cost_price int not null,                      -- 매입가 (판매자만 보임)
  sale_price int not null,                      -- 택배비 포함가 (소비자 노출)
  shipping_cost int not null default 0,         -- 내부 관리용
  courier text not null,                        -- 'CJ', 'HANJIN', 'LOTTE', ...
  stock int not null check (stock >= 0),
  status sell_bid_status not null default 'active',
  -- 자동 입찰 (Phase 2)
  auto_bid_enabled boolean not null default false,
  min_sale_price int,
  auto_bid_decrement int default 500,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index bids_product_seller_uq on public.bids(product_id, seller_id);
create index bids_product_active_idx on public.bids(product_id, sale_price)
  where status = 'active' and stock > 0;
create index bids_seller_idx on public.bids(seller_id);

-- ========================================================================
-- 7. buyer_bids — 구매 입찰 (크림식)
-- ========================================================================
create type buy_bid_status as enum ('open', 'matched', 'expired', 'canceled');

create table public.buyer_bids (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  buyer_id uuid not null references public.users(id) on delete cascade,
  desired_price int not null,
  qty int not null check (qty > 0),
  billing_key_id uuid not null,                 -- billing_keys FK (아래)
  expires_at timestamptz not null,
  status buy_bid_status not null default 'open',
  matched_seller_id uuid references public.users(id),
  matched_at timestamptz,
  created_at timestamptz not null default now()
);
create index buyer_bids_product_open_idx on public.buyer_bids(product_id, desired_price desc)
  where status = 'open';
create index buyer_bids_buyer_idx on public.buyer_bids(buyer_id);

-- ========================================================================
-- 8. orders — 거래
-- ========================================================================
create type order_status as enum (
  'paid', 'preparing', 'shipped', 'delivered', 'confirmed', 'canceled', 'disputed'
);
create type escrow_state as enum ('held', 'released', 'refunded');

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.users(id),
  seller_id uuid not null references public.users(id),
  total_amount int not null,
  shipping_amount int not null default 0,
  status order_status not null default 'paid',
  escrow_state escrow_state not null default 'held',
  shipped_at timestamptz,
  delivered_at timestamptz,
  confirmed_at timestamptz,
  auto_confirm_at timestamptz,                  -- 배송완료 + N일
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_buyer_idx on public.orders(buyer_id, created_at desc);
create index orders_seller_idx on public.orders(seller_id, created_at desc);
create index orders_status_idx on public.orders(status) where status in ('paid','preparing','shipped','delivered');

-- ========================================================================
-- 9. order_items — 합배송 위해 다대일
-- ========================================================================
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  bid_id uuid references public.bids(id),
  buyer_bid_id uuid references public.buyer_bids(id),
  unit_price int not null,
  qty int not null,
  commission_rate numeric(5,4) not null,
  commission_amount int not null,
  created_at timestamptz not null default now(),
  check ((bid_id is not null) or (buyer_bid_id is not null))
);
create index order_items_order_idx on public.order_items(order_id);
create index order_items_product_idx on public.order_items(product_id);

-- ========================================================================
-- 10. shipments — 배송
-- ========================================================================
create table public.shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  tracking_no text not null,
  courier text not null,
  shipped_at timestamptz not null default now(),
  delivered_at timestamptz,
  last_tracked_at timestamptz,
  status text not null default 'in_transit'    -- in_transit | delivered | exception
);
create unique index shipments_tracking_uq on public.shipments(courier, tracking_no);
create index shipments_order_idx on public.shipments(order_id);

-- ========================================================================
-- 11. payments — 토스페이먼츠
-- ========================================================================
create type payment_status as enum (
  'READY', 'IN_PROGRESS', 'WAITING_FOR_DEPOSIT', 'DONE',
  'CANCELED', 'PARTIAL_CANCELED', 'ABORTED', 'EXPIRED'
);
create type payment_method as enum ('CARD', 'TOSS_PAY', 'TRANSFER', 'NAVER_PAY', 'KAKAO_PAY');

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  pg_tx_id text not null,
  method payment_method not null,
  amount int not null,
  status payment_status not null,
  approved_at timestamptz,
  raw_payload jsonb,
  created_at timestamptz not null default now()
);
create unique index payments_pg_tx_uq on public.payments(pg_tx_id);
create index payments_order_idx on public.payments(order_id);

-- ========================================================================
-- 12. billing_keys — 구매입찰 카드 사전등록
-- ========================================================================
create table public.billing_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  pg_billing_key text not null,                 -- 토스 빌링키
  card_last4 text not null,
  card_brand text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index billing_keys_user_idx on public.billing_keys(user_id) where deleted_at is null;

-- 7번 테이블의 billing_key_id FK 추가 (순환참조 회피용 alter)
alter table public.buyer_bids
  add constraint buyer_bids_billing_key_fk
  foreign key (billing_key_id) references public.billing_keys(id);

-- ========================================================================
-- 13. settlements — 정산
-- ========================================================================
create type settlement_state as enum ('pending', 'approved', 'paid_out');

create table public.settlements (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.users(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  amount int not null,                          -- 정산 예정액 합계
  state settlement_state not null default 'pending',
  paid_out_at timestamptz,
  created_at timestamptz not null default now()
);
create index settlements_seller_state_idx on public.settlements(seller_id, state);

-- ========================================================================
-- 14. price_history — 시세 차트 (체결 시 자동 INSERT, Phase 1에서 트리거)
-- ========================================================================
create table public.price_history (
  id bigserial primary key,
  product_id uuid not null references public.products(id) on delete cascade,
  price int not null,
  qty int not null default 1,
  traded_at timestamptz not null default now()
);
create index price_history_product_traded_idx on public.price_history(product_id, traded_at desc);

-- ========================================================================
-- 15. notifications — 발송 이력
-- ========================================================================
create type notify_channel as enum ('kakao', 'sms', 'email');

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  template_code text not null,
  channel notify_channel not null default 'kakao',
  payload jsonb not null default '{}'::jsonb,
  sent_at timestamptz,
  failed_at timestamptz,
  failure_reason text,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications(user_id, created_at desc);

-- ========================================================================
-- updated_at 트리거 (재사용)
-- ========================================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_set_updated before update on public.users
  for each row execute function public.set_updated_at();
create trigger seller_profiles_set_updated before update on public.seller_profiles
  for each row execute function public.set_updated_at();
create trigger products_set_updated before update on public.products
  for each row execute function public.set_updated_at();
create trigger bids_set_updated before update on public.bids
  for each row execute function public.set_updated_at();
create trigger orders_set_updated before update on public.orders
  for each row execute function public.set_updated_at();

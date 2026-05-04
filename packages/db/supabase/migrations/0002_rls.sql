-- TOOLBOX RLS 정책 (초안).
-- 노션 "공통 체크리스트 — 보안: Supabase RLS 정책 전체 설계"
--
-- 원칙:
--   * 모든 테이블 RLS enable
--   * 본인 데이터 + 관리자만 노출이 기본
--   * 판매자 ID 마스킹은 view로 별도 처리 (0003에서)

-- helper: 현재 사용자의 role 추출
create or replace function public.current_user_role()
returns text language sql stable as $$
  select role::text from public.users where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean language sql stable as $$
  select coalesce(public.current_user_role() = 'admin', false)
$$;

-- ========================================================================
-- users
-- ========================================================================
alter table public.users enable row level security;

create policy users_self_select on public.users for select
  using (id = auth.uid() or public.is_admin());

create policy users_self_update on public.users for update
  using (id = auth.uid()) with check (id = auth.uid());

create policy users_admin_all on public.users for all
  using (public.is_admin()) with check (public.is_admin());

-- ========================================================================
-- seller_profiles — 본인 + admin
-- ========================================================================
alter table public.seller_profiles enable row level security;

create policy seller_profiles_self_select on public.seller_profiles for select
  using (user_id = auth.uid() or public.is_admin());

create policy seller_profiles_self_insert on public.seller_profiles for insert
  with check (user_id = auth.uid());

create policy seller_profiles_self_update on public.seller_profiles for update
  using (user_id = auth.uid() and status != 'approved')
  with check (user_id = auth.uid());

create policy seller_profiles_admin on public.seller_profiles for all
  using (public.is_admin()) with check (public.is_admin());

-- ========================================================================
-- brands / categories — 누구나 읽기, admin만 쓰기
-- ========================================================================
alter table public.brands enable row level security;
create policy brands_public_read on public.brands for select using (is_active = true or public.is_admin());
create policy brands_admin_write on public.brands for all using (public.is_admin()) with check (public.is_admin());

alter table public.categories enable row level security;
create policy categories_public_read on public.categories for select using (is_active = true or public.is_admin());
create policy categories_admin_write on public.categories for all using (public.is_admin()) with check (public.is_admin());

-- ========================================================================
-- products — 활성 상품은 누구나 읽기 (가격 블러는 클라이언트 처리)
-- ========================================================================
alter table public.products enable row level security;

create policy products_public_read on public.products for select
  using (is_active = true or public.is_admin());

create policy products_admin_write on public.products for all
  using (public.is_admin()) with check (public.is_admin());

-- ========================================================================
-- bids — 판매자: 자기 입찰 CRUD / 구매자: 활성 입찰 SELECT (단, cost_price는 view에서 마스킹)
-- ========================================================================
alter table public.bids enable row level security;

create policy bids_public_active_select on public.bids for select
  using (status = 'active' or seller_id = auth.uid() or public.is_admin());

create policy bids_seller_insert on public.bids for insert
  with check (seller_id = auth.uid() and public.current_user_role() = 'seller');

create policy bids_seller_update on public.bids for update
  using (seller_id = auth.uid()) with check (seller_id = auth.uid());

create policy bids_seller_delete on public.bids for delete
  using (seller_id = auth.uid());

create policy bids_admin_all on public.bids for all
  using (public.is_admin()) with check (public.is_admin());

-- ========================================================================
-- buyer_bids — 본인(구매자) + 해당 상품 판매자 + admin
-- ========================================================================
alter table public.buyer_bids enable row level security;

create policy buyer_bids_buyer_select on public.buyer_bids for select
  using (buyer_id = auth.uid() or public.is_admin());

create policy buyer_bids_seller_select on public.buyer_bids for select
  using (
    status = 'open'
    and exists (
      select 1 from public.bids b
      where b.product_id = buyer_bids.product_id and b.seller_id = auth.uid()
    )
  );

create policy buyer_bids_buyer_insert on public.buyer_bids for insert
  with check (buyer_id = auth.uid());

create policy buyer_bids_buyer_update on public.buyer_bids for update
  using (buyer_id = auth.uid() and status = 'open')
  with check (buyer_id = auth.uid());

-- ========================================================================
-- orders / order_items / shipments — 본인(구매자/판매자) + admin
-- ========================================================================
alter table public.orders enable row level security;
create policy orders_party_select on public.orders for select
  using (buyer_id = auth.uid() or seller_id = auth.uid() or public.is_admin());
create policy orders_admin_write on public.orders for all
  using (public.is_admin()) with check (public.is_admin());

alter table public.order_items enable row level security;
create policy order_items_party_select on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (o.buyer_id = auth.uid() or o.seller_id = auth.uid())
    )
    or public.is_admin()
  );

alter table public.shipments enable row level security;
create policy shipments_party_select on public.shipments for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = shipments.order_id
        and (o.buyer_id = auth.uid() or o.seller_id = auth.uid())
    )
    or public.is_admin()
  );
create policy shipments_seller_insert on public.shipments for insert
  with check (
    exists (
      select 1 from public.orders o
      where o.id = shipments.order_id and o.seller_id = auth.uid()
    )
  );

-- ========================================================================
-- payments / billing_keys — 본인 + admin (결제 정보는 더 엄격)
-- ========================================================================
alter table public.payments enable row level security;
create policy payments_party_select on public.payments for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = payments.order_id
        and (o.buyer_id = auth.uid() or o.seller_id = auth.uid())
    )
    or public.is_admin()
  );

alter table public.billing_keys enable row level security;
create policy billing_keys_self on public.billing_keys for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ========================================================================
-- settlements — 본인(판매자) + admin
-- ========================================================================
alter table public.settlements enable row level security;
create policy settlements_self_select on public.settlements for select
  using (seller_id = auth.uid() or public.is_admin());
create policy settlements_admin_write on public.settlements for all
  using (public.is_admin()) with check (public.is_admin());

-- ========================================================================
-- price_history — 누구나 읽기 (시세 차트), 시스템만 쓰기
-- ========================================================================
alter table public.price_history enable row level security;
create policy price_history_public_read on public.price_history for select using (true);
create policy price_history_admin_write on public.price_history for all
  using (public.is_admin()) with check (public.is_admin());

-- ========================================================================
-- notifications — 본인 + admin
-- ========================================================================
alter table public.notifications enable row level security;
create policy notifications_self_select on public.notifications for select
  using (user_id = auth.uid() or public.is_admin());
create policy notifications_admin_write on public.notifications for all
  using (public.is_admin()) with check (public.is_admin());

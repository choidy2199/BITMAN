-- 1) auth.users INSERT 시 public.users 자동 생성
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, oauth_provider)
  values (new.id, new.email, new.raw_app_meta_data->>'provider')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2) 구매자 노출용 마스킹 view (판매자 ID, cost_price 숨김)
-- 노션 "구매자 Page": "최저가순 최대 5개 노출, 판매자명 비공개", "재고 수량은 구매 확정 시에만 표시"
create or replace view public.bids_public as
select
  b.id,
  b.product_id,
  b.sale_price,
  b.stock,
  b.courier,
  b.status,
  b.created_at,
  -- seller_id 노출 X. cost_price 노출 X. shipping_cost 노출 X.
  -- 판매자 식별을 합배송 그룹핑에는 써야 하므로 buyer가 본인 장바구니 조회 시에만 join 하는 별도 RPC 사용.
  -- 여기 view는 product 페이지 노출 전용.
  null::uuid as seller_id_masked
from public.bids b
where b.status = 'active' and b.stock > 0;

grant select on public.bids_public to anon, authenticated;

-- 3) 체결 시 price_history 자동 INSERT (Phase 1에서 트리거 고도화 예정)
-- 일단 placeholder. order_items INSERT 시 product의 unit_price를 기록.
create or replace function public.record_price_history()
returns trigger language plpgsql security definer as $$
begin
  insert into public.price_history (product_id, price, qty, traded_at)
  values (new.product_id, new.unit_price, new.qty, now());
  return new;
end;
$$;

create trigger order_items_record_price after insert on public.order_items
  for each row execute function public.record_price_history();

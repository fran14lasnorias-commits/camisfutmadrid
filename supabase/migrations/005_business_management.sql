alter table orders
  add column if not exists stock_released_at timestamptz,
  add column if not exists discount_code text,
  add column if not exists discount_eur numeric(10,2) not null default 0,
  add column if not exists payment_fee_eur numeric(10,2) not null default 0,
  add column if not exists packaging_cost_eur numeric(10,2) not null default 0,
  add column if not exists customer_shipping_cost_eur numeric(10,2) not null default 0,
  add column if not exists exchange_rate_usd_eur numeric(12,6);

create table if not exists coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  type text not null check (type in ('percent','fixed')),
  value numeric(10,2) not null check (value > 0),
  minimum_order_eur numeric(10,2) not null default 0,
  active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  max_uses int,
  used_count int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists email_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  event_type text not null,
  recipient text not null,
  provider_message_id text,
  status text not null default 'pending',
  error_message text,
  created_at timestamptz not null default now()
);

alter table coupons enable row level security;
alter table email_events enable row level security;

create policy "admin coupons"
on coupons for all
using (public.is_admin())
with check (public.is_admin());

create policy "admin email events"
on email_events for select
using (public.is_admin());

create or replace function public.release_order_stock(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item record;
  v_released timestamptz;
begin
  select stock_released_at into v_released
  from orders
  where id = p_order_id
  for update;

  if v_released is not null then
    return;
  end if;

  for v_item in
    select variant_id, quantity
    from order_items
    where order_id = p_order_id
  loop
    if v_item.variant_id is not null then
      update product_variants
      set stock = stock + v_item.quantity
      where id = v_item.variant_id;
    end if;
  end loop;

  update orders
  set stock_released_at = now()
  where id = p_order_id;
end;
$$;

create or replace function public.apply_coupon(
  p_code text,
  p_subtotal numeric
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_coupon coupons%rowtype;
  v_discount numeric := 0;
begin
  select *
  into v_coupon
  from coupons
  where upper(code) = upper(trim(p_code))
    and active = true
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at >= now())
    and (max_uses is null or used_count < max_uses)
  limit 1;

  if not found then
    raise exception 'Cupón no válido';
  end if;

  if p_subtotal < v_coupon.minimum_order_eur then
    raise exception 'No se alcanza el pedido mínimo';
  end if;

  if v_coupon.type = 'percent' then
    v_discount := round(p_subtotal * v_coupon.value / 100, 2);
  else
    v_discount := least(v_coupon.value, p_subtotal);
  end if;

  return jsonb_build_object(
    'code', v_coupon.code,
    'discount_eur', v_discount,
    'coupon_id', v_coupon.id
  );
end;
$$;

create or replace function public.mark_coupon_used(p_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update coupons
  set used_count = used_count + 1
  where upper(code) = upper(trim(p_code));
end;
$$;

grant execute on function public.apply_coupon to authenticated, anon, service_role;
grant execute on function public.mark_coupon_used to service_role;

create extension if not exists "pgcrypto";

create type product_type as enum ('fan','player','retro','kids','adult_kit','polo','shorts','socks','training','nba');
create type order_status as enum ('pending','paid','preparing','packed','shipped','delivered','cancelled');
create type app_role as enum ('customer','admin');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role app_role not null default 'customer',
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create table products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  team text not null,
  season text,
  type product_type not null,
  price_eur numeric(10,2) not null,
  supplier_cost_usd numeric(10,2) not null default 0,
  description text,
  published boolean not null default false,
  supplier_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  url text not null,
  position int not null default 0
);

create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  size text not null,
  stock int not null default 0,
  unique(product_id,size)
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  number text unique not null,
  user_id uuid references auth.users(id),
  status order_status not null default 'pending',
  total_eur numeric(10,2) not null,
  supplier_cost_usd numeric(10,2) not null default 0,
  estimated_profit_eur numeric(10,2),
  payment_method text,
  shipping_method text,
  shipping_address jsonb,
  created_at timestamptz not null default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id),
  variant_id uuid references product_variants(id),
  quantity int not null default 1,
  unit_price_eur numeric(10,2) not null,
  personalization_name text,
  personalization_number text,
  patch text,
  supplier_unit_cost_usd numeric(10,2) not null default 0
);

create table favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id,product_id)
);

alter table profiles enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table product_variants enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table favorites enable row level security;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$
  select exists(select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

create policy "public products" on products for select using (published = true or public.is_admin());
create policy "admin products" on products for all using (public.is_admin()) with check (public.is_admin());
create policy "public images" on product_images for select using (true);
create policy "admin images" on product_images for all using (public.is_admin()) with check (public.is_admin());
create policy "public variants" on product_variants for select using (true);
create policy "admin variants" on product_variants for all using (public.is_admin()) with check (public.is_admin());

create policy "own profile" on profiles for select using (auth.uid() = id or public.is_admin());
create policy "update own profile" on profiles for update using (auth.uid() = id);

create policy "own orders" on orders for select using (auth.uid() = user_id or public.is_admin());
create policy "admin orders" on orders for all using (public.is_admin()) with check (public.is_admin());
create policy "create own order" on orders for insert with check (auth.uid() = user_id);

create policy "own order items" on order_items for select using (
  public.is_admin() or exists(select 1 from orders where orders.id = order_items.order_id and orders.user_id = auth.uid())
);
create policy "admin order items" on order_items for all using (public.is_admin()) with check (public.is_admin());

create policy "own favorites" on favorites for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

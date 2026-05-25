-- =====================================================================
-- Albanian Gold E-Shop — Admin Panel Database Schema
-- Run this entire script in Supabase SQL Editor (Dashboard → SQL Editor)
-- =====================================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- =====================================================================
-- 2. TABLES
-- =====================================================================

-- PRODUCTS
create table public.products (
  id            uuid        default uuid_generate_v4() primary key,
  name          text        not null,
  subtitle      text        not null default '',
  meta          text        not null default '',
  short_desc    text        not null default '',
  description   text        not null default '',   -- Përshkrimi
  origin        text        not null default '',   -- Origjina & Burimet
  nutrition     jsonb       not null default '[]', -- [{label,value}] — Vlerat Ushqyese
  category      text        not null default 'honey'
                              check (category in ('honey','nuts')),
  stock_status  text        not null default 'in_stock'
                              check (stock_status in ('in_stock','low_stock','out_of_stock')),
  variants      jsonb       not null default '[{"weight":"250g","price":0},{"weight":"500g","price":0},{"weight":"1kg","price":0}]',
  images        text[]      not null default array[]::text[],
  alt           text        not null default '',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ORDERS
create table public.orders (
  id               uuid        default uuid_generate_v4() primary key,
  customer_name    text        not null,
  customer_phone   text        not null,
  customer_address text        not null,
  customer_city    text        not null default '',
  notes            text        not null default '',
  status           text        not null default 'pending'
                                 check (status in ('pending','confirmed','shipped','delivered','rejected')),
  -- items: [{product_id, product_name, product_category, variant_weight, quantity, unit_price}]
  items            jsonb       not null default '[]',
  total_amount     integer     not null default 0, -- Albanian Lek (ALL)
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ADMIN USERS (email whitelist — add your email below)
create table public.admin_users (
  id         uuid        default uuid_generate_v4() primary key,
  email      text        not null unique,
  created_at timestamptz not null default now()
);

-- *** INSERT YOUR ADMIN EMAIL HERE ***
insert into public.admin_users (email) values ('YOUR_EMAIL@example.com');

-- =====================================================================
-- 3. TRIGGERS — auto-update updated_at
-- =====================================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

create trigger orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- =====================================================================
-- 4. ROW LEVEL SECURITY
-- =====================================================================

-- helper: is the caller an admin?
create or replace function public.is_admin()
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.admin_users where email = auth.email()
  );
$$;

-- PRODUCTS — public read, admin write
alter table public.products enable row level security;

create policy "products_select_public"
  on public.products for select using (true);

create policy "products_insert_admin"
  on public.products for insert
  with check (public.is_admin());

create policy "products_update_admin"
  on public.products for update
  using (public.is_admin());

create policy "products_delete_admin"
  on public.products for delete
  using (public.is_admin());

-- ORDERS — anyone inserts (checkout), only admins read/update
alter table public.orders enable row level security;

create policy "orders_insert_public"
  on public.orders for insert with check (true);

create policy "orders_select_admin"
  on public.orders for select
  using (public.is_admin());

create policy "orders_update_admin"
  on public.orders for update
  using (public.is_admin());

-- ADMIN USERS — only self-read (no exposure to other admins)
alter table public.admin_users enable row level security;

create policy "admin_users_select_self"
  on public.admin_users for select
  using (auth.email() = email);

-- =====================================================================
-- 5. STORAGE — product images bucket
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,  -- 5 MB per image
  array['image/jpeg','image/jpg','image/png','image/webp']
)
on conflict (id) do nothing;

create policy "product_images_public_read"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "product_images_admin_upload"
  on storage.objects for insert
  with check (bucket_id = 'product-images' and public.is_admin());

create policy "product_images_admin_delete"
  on storage.objects for delete
  using (bucket_id = 'product-images' and public.is_admin());

-- =====================================================================
-- 6. ANALYTICS VIEW
-- =====================================================================

create or replace view public.daily_revenue as
select
  date_trunc('day', created_at)::date as day,
  count(*)                             as order_count,
  sum(total_amount)                    as revenue
from public.orders
where status <> 'rejected'
group by 1
order by 1 desc;

-- =====================================================================
-- 7. SAMPLE SEED DATA (optional — remove for production)
-- =====================================================================

-- Uncomment to insert test orders for dashboard charts:
/*
insert into public.orders (customer_name, customer_phone, customer_address, customer_city, status, items, total_amount, created_at)
values
  ('Andi Kelmendi','0691234567','Rr. Myslym Shyri 5','Tiranë','confirmed','[{"product_name":"Mjaltë Gështenje","product_category":"honey","variant_weight":"500g","quantity":2,"unit_price":1200}]',2400, now() - interval '1 day'),
  ('Besa Hoxha',   '0672345678','Rr. e Kavajës 12',  'Durrës','pending',  '[{"product_name":"Arra të Qëruara","product_category":"nuts","variant_weight":"1kg","quantity":1,"unit_price":1800}]', 1800, now() - interval '2 days'),
  ('Gent Berisha',  '0683456789','Sheshi Skënderbej', 'Shkodër','shipped', '[{"product_name":"Bajame Sulltane","product_category":"nuts","variant_weight":"250g","quantity":3,"unit_price":900}]',  2700, now() - interval '3 days'),
  ('Mirela Duka',   '0694567890','Rr. Panorama 8',    'Tiranë','delivered','[{"product_name":"Mjaltë Gështenje","product_category":"honey","variant_weight":"1kg","quantity":1,"unit_price":2200}]', 2200, now() - interval '4 days'),
  ('Artan Leka',    '0675678901','Rr. Barrikadave 3', 'Vlorë','confirmed', '[{"product_name":"Arra të Qëruara","product_category":"nuts","variant_weight":"500g","quantity":2,"unit_price":1100}]', 2200, now() - interval '5 days'),
  ('Drita Pjetri',  '0686789012','Lagjja Vasil Shanto','Elbasan','pending','[{"product_name":"Mjaltë Gështenje","product_category":"honey","variant_weight":"250g","quantity":4,"unit_price":700}]', 2800, now() - interval '6 days'),
  ('Sokol Marku',   '0697890123','Rr. Ismail Qemali', 'Tiranë','confirmed','[{"product_name":"Bajame Sulltane","product_category":"nuts","variant_weight":"1kg","quantity":1,"unit_price":1600}]', 1600, now() - interval '7 days');
*/

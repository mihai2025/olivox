-- Olivox.ro — Supabase schema
-- Apply in Supabase SQL editor on project fiadfjeqarozzlovbcca

-- =========================================================================
-- CATEGORIES
-- =========================================================================
create table if not exists public.product_categories (
  id              bigserial primary key,
  source_id       text unique,
  parent_id       bigint references public.product_categories(id) on delete set null,
  name            text not null,
  slug            text not null unique,
  description     text,
  image_url       text,
  r2_image_url    text,
  product_count   integer default 0,
  sort_order      integer default 0,
  meta_title      text,
  meta_description text,
  source_url      text,
  imported_at     timestamptz default now(),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index if not exists idx_categories_parent on public.product_categories(parent_id);
create index if not exists idx_categories_slug on public.product_categories(slug);

-- =========================================================================
-- PRODUCTS
-- =========================================================================
create table if not exists public.products (
  id               bigserial primary key,
  source_id        text unique,
  name             text not null,
  slug             text not null unique,
  sku              text,
  quantity         text,
  points           numeric(6,2),
  short_description text,
  description      text,
  price            numeric(10,2),
  old_price        numeric(10,2),
  currency         text default 'RON',
  stock_status     text default 'in_stock',
  image_url        text,
  r2_image_url     text,
  gallery          jsonb default '[]'::jsonb,
  category_slugs   text[] default array[]::text[],
  source_url       text,
  meta_title       text,
  meta_description text,
  keywords         text,
  sort_order       integer default 0,
  imported_at      timestamptz default now(),
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

create index if not exists idx_products_slug on public.products(slug);
create index if not exists idx_products_cat on public.products using gin(category_slugs);
create index if not exists idx_products_source on public.products(source_url);

-- =========================================================================
-- ARTICLES (blog)
-- =========================================================================
create table if not exists public.articles (
  id               bigserial primary key,
  source_id        text unique,
  slug             text not null unique,
  title            text not null,
  excerpt          text,
  body             text,
  image_url        text,
  r2_image_url     text,
  author           text,
  published_at     timestamptz default now(),
  source_url       text,
  meta_title       text,
  meta_description text,
  tags             text[] default array[]::text[],
  is_published     boolean default true,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

create index if not exists idx_articles_slug on public.articles(slug);
create index if not exists idx_articles_published on public.articles(published_at desc);

-- =========================================================================
-- ORDERS
-- =========================================================================
create table if not exists public.orders (
  id                bigserial primary key,
  product_id        bigint references public.products(id) on delete set null,
  product_name      text,
  product_slug      text,
  quantity          integer default 1,
  customer_name     text,
  customer_phone    text,
  customer_email    text,
  address           text,
  observations      text,
  status            text default 'in procesare',
  order_value       numeric(10,2),
  shipping_method   text,
  locker_id         text,
  order_source      text,
  fgo_serie         text,
  fgo_numar         text,
  sameday_awb       text,
  custom_field_values jsonb default '{}'::jsonb,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_created on public.orders(created_at desc);

-- =========================================================================
-- SETTINGS (key/value)
-- =========================================================================
create table if not exists public.settings (
  key        text primary key,
  value      jsonb,
  updated_at timestamptz default now()
);

-- =========================================================================
-- HOMEPAGE ITEMS
-- =========================================================================
create table if not exists public.homepage_items (
  id          bigserial primary key,
  position    integer default 0,
  active      boolean default true,
  type        text,
  title       text,
  content_url text,
  image_url   text,
  created_at  timestamptz default now()
);

create index if not exists idx_homepage_pos on public.homepage_items(position);

-- =========================================================================
-- TRIGGERS — updated_at
-- =========================================================================
create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_categories_updated on public.product_categories;
create trigger trg_categories_updated before update on public.product_categories
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_products_updated on public.products;
create trigger trg_products_updated before update on public.products
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_articles_updated on public.articles;
create trigger trg_articles_updated before update on public.articles
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_orders_updated on public.orders;
create trigger trg_orders_updated before update on public.orders
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_settings_updated on public.settings;
create trigger trg_settings_updated before update on public.settings
  for each row execute function public.touch_updated_at();

-- =========================================================================
-- RLS — enable but allow anon read of public content; writes via service key
-- =========================================================================
alter table public.product_categories enable row level security;
alter table public.products enable row level security;
alter table public.articles enable row level security;
alter table public.orders enable row level security;
alter table public.settings enable row level security;
alter table public.homepage_items enable row level security;

drop policy if exists "public read categories" on public.product_categories;
create policy "public read categories" on public.product_categories for select using (true);

drop policy if exists "public read products" on public.products;
create policy "public read products" on public.products for select using (true);

drop policy if exists "public read articles" on public.articles;
create policy "public read articles" on public.articles for select using (is_published = true);

drop policy if exists "public read settings" on public.settings;
create policy "public read settings" on public.settings for select using (true);

drop policy if exists "public read homepage" on public.homepage_items;
create policy "public read homepage" on public.homepage_items for select using (active = true);

-- orders: public INSERT allowed (customer places order from site); reads only via service key
drop policy if exists "public insert orders" on public.orders;
create policy "public insert orders" on public.orders for insert with check (true);

-- =========================================================================
-- DEFAULT SETTINGS
-- =========================================================================
insert into public.settings (key, value) values
  ('site_config', '{"siteName":"olivox.ro","domain":"https://olivox.ro"}'::jsonb)
  on conflict (key) do nothing;

insert into public.settings (key, value) values
  ('homepage_active', 'false'::jsonb)
  on conflict (key) do nothing;

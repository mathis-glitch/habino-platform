-- ─────────────────────────────────────────────────────────────
-- Habino Platform — Initial Schema (idempotent — safe to re-run)
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ─────────────────────────────────────────────────────────────

create extension if not exists "pgcrypto";

-- ── TENANTS ──────────────────────────────────────────────────
create table if not exists tenants (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  slug             text not null unique,
  logo_url         text,
  primary_color    text not null default '#00A884',
  secondary_color  text not null default '#0F1F3D',
  tagline          text,
  contact_email    text,
  whatsapp         text,
  custom_domain    text unique,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now()
);

create index if not exists tenants_slug_idx   on tenants(slug);
create index if not exists tenants_domain_idx on tenants(custom_domain);

-- ── USERS ────────────────────────────────────────────────────
create table if not exists users (
  id          uuid primary key references auth.users(id) on delete cascade,
  tenant_id   uuid not null references tenants(id) on delete cascade,
  email       text not null unique,
  full_name   text,
  role        text not null default 'buyer' check (role in ('operator_admin', 'buyer')),
  created_at  timestamptz not null default now()
);

create index if not exists users_tenant_idx on users(tenant_id);

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  v_tenant_id uuid;
begin
  v_tenant_id := (new.raw_user_meta_data->>'tenant_id')::uuid;
  insert into public.users (id, tenant_id, email, full_name, role)
  values (
    new.id,
    v_tenant_id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'role', 'buyer')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── PROPERTIES ───────────────────────────────────────────────
create table if not exists properties (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references tenants(id) on delete cascade,
  title          text not null,
  description    text,
  listing_type   text not null check (listing_type in ('buy', 'rent')),
  property_type  text not null check (property_type in ('apartment', 'house', 'commercial', 'land')),
  price          numeric not null,
  currency       text not null default 'KES',
  bedrooms       integer not null default 0,
  bathrooms      integer not null default 0,
  area_sqm       numeric,
  city           text not null,
  neighbourhood  text,
  address        text,
  agent_name     text,
  agent_phone    text,
  agent_email    text,
  status         text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists properties_tenant_idx on properties(tenant_id);
create index if not exists properties_status_idx on properties(status);
create index if not exists properties_type_idx   on properties(listing_type);
create index if not exists properties_city_idx   on properties(city);

create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists properties_updated_at on properties;
create trigger properties_updated_at
  before update on properties
  for each row execute function update_updated_at();

-- ── PROPERTY IMAGES ──────────────────────────────────────────
create table if not exists property_images (
  id           uuid primary key default gen_random_uuid(),
  property_id  uuid not null references properties(id) on delete cascade,
  url          text not null,
  sort_order   integer not null default 0
);

create index if not exists property_images_property_idx on property_images(property_id);

-- ── SAVED PROPERTIES ─────────────────────────────────────────
create table if not exists saved_properties (
  user_id      uuid not null references users(id) on delete cascade,
  property_id  uuid not null references properties(id) on delete cascade,
  saved_at     timestamptz not null default now(),
  primary key (user_id, property_id)
);

-- ── MARKET QUERIES ───────────────────────────────────────────
create table if not exists market_queries (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references tenants(id) on delete cascade,
  user_id        uuid references users(id) on delete set null,
  location       text not null,
  property_type  text not null,
  result_json    jsonb not null,
  created_at     timestamptz not null default now()
);

create index if not exists market_queries_lookup_idx
  on market_queries(tenant_id, location, property_type, created_at desc);

-- ── AI RATE LIMITS ───────────────────────────────────────────
create table if not exists ai_rate_limits (
  ip_address  text not null,
  date        date not null,
  count       integer not null default 0,
  primary key (ip_address, date)
);

-- ─────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────
alter table tenants          enable row level security;
alter table users            enable row level security;
alter table properties       enable row level security;
alter table property_images  enable row level security;
alter table saved_properties enable row level security;
alter table market_queries   enable row level security;
alter table ai_rate_limits   enable row level security;

-- Drop existing policies before recreating (safe re-run)
drop policy if exists "Public can read active tenants"              on tenants;
drop policy if exists "Users can read own profile"                  on users;
drop policy if exists "Users can update own profile"                on users;
drop policy if exists "Public can read active properties"           on properties;
drop policy if exists "Operators can manage own tenant properties"  on properties;
drop policy if exists "Public can read property images"             on property_images;
drop policy if exists "Operators can manage property images"        on property_images;
drop policy if exists "Users manage own saved properties"           on saved_properties;
drop policy if exists "Anyone can create market query"              on market_queries;
drop policy if exists "Anyone can read market query cache"          on market_queries;
drop policy if exists "Service role manages rate limits"            on ai_rate_limits;

create policy "Public can read active tenants"
  on tenants for select using (is_active = true);

create policy "Users can read own profile"
  on users for select using (auth.uid() = id);

create policy "Users can update own profile"
  on users for update using (auth.uid() = id);

create policy "Public can read active properties"
  on properties for select using (status = 'active');

create policy "Operators can manage own tenant properties"
  on properties for all
  using (
    tenant_id in (
      select tenant_id from users
      where id = auth.uid() and role = 'operator_admin'
    )
  );

create policy "Public can read property images"
  on property_images for select using (
    property_id in (select id from properties where status = 'active')
  );

create policy "Operators can manage property images"
  on property_images for all
  using (
    property_id in (
      select id from properties
      where tenant_id in (
        select tenant_id from users
        where id = auth.uid() and role = 'operator_admin'
      )
    )
  );

create policy "Users manage own saved properties"
  on saved_properties for all using (auth.uid() = user_id);

create policy "Anyone can create market query"
  on market_queries for insert with check (true);

create policy "Anyone can read market query cache"
  on market_queries for select using (true);

create policy "Service role manages rate limits"
  on ai_rate_limits for all using (false);

-- ─────────────────────────────────────────────────────────────
-- SEED: Demo tenant (skip if already exists)
-- ─────────────────────────────────────────────────────────────
insert into tenants (name, slug, primary_color, secondary_color, tagline, contact_email)
values (
  'Habino Demo',
  'demo',
  '#00A884',
  '#0F1F3D',
  'AI-powered property search',
  'hello@habino.app'
)
on conflict (slug) do nothing;

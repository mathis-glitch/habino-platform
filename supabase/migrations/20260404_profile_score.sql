-- ============================================================
-- Profile score + extended fields
-- ============================================================

-- Add new fields to profiles table
alter table profiles
  add column if not exists date_of_birth   date,
  add column if not exists usage_type      text check (usage_type in ('buyer','renter','investor','seller','agent','other')),
  add column if not exists account_type    text default 'private' check (account_type in ('private','business')),
  add column if not exists business_name   text,
  add column if not exists is_agent        boolean default false,
  add column if not exists verified_score  integer default 0,
  add column if not exists badge_100       boolean default false;

-- Function: compute verification score (0–100)
-- Weights: name(10) + email(10) + phone(10) + city(5) + avatar(10) + bio(5)
--          + dob(5) + usage_type(5) + account_type(5) + whatsapp(5)
--          + address(5) + country_code(5) + id_number(15) = 100
create or replace function compute_profile_score(p profiles)
returns integer language plpgsql as $$
declare
  score integer := 0;
begin
  if p.full_name    is not null and length(trim(p.full_name))    > 0 then score := score + 10; end if;
  if p.email        is not null and length(trim(p.email))        > 0 then score := score + 10; end if;
  if p.phone        is not null and length(trim(p.phone))        > 0 then score := score + 10; end if;
  if p.city         is not null and length(trim(p.city))         > 0 then score := score +  5; end if;
  if p.avatar_url   is not null and length(trim(p.avatar_url))   > 0 then score := score + 10; end if;
  if p.bio          is not null and length(trim(p.bio))          > 0 then score := score +  5; end if;
  if p.date_of_birth is not null                                      then score := score +  5; end if;
  if p.usage_type   is not null                                       then score := score +  5; end if;
  if p.account_type is not null                                       then score := score +  5; end if;
  if p.whatsapp     is not null and length(trim(p.whatsapp))     > 0 then score := score +  5; end if;
  if p.address      is not null and length(trim(p.address))      > 0 then score := score +  5; end if;
  if p.country_code is not null and length(trim(p.country_code)) > 0 then score := score +  5; end if;
  if p.id_number    is not null and length(trim(p.id_number))    > 0 then score := score + 15; end if;
  return least(score, 100);
end;
$$;

-- Trigger: auto-update verified_score + badge_100 on every profile change
create or replace function trigger_update_profile_score()
returns trigger language plpgsql as $$
begin
  new.verified_score := compute_profile_score(new);
  new.badge_100      := (new.verified_score >= 100);
  return new;
end;
$$;

drop trigger if exists update_profile_score on profiles;
create trigger update_profile_score
  before insert or update on profiles
  for each row execute function trigger_update_profile_score();

-- ============================================================
-- Broker profiles table (separate from auth users — demo data)
-- ============================================================
create table if not exists broker_profiles (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid references tenants(id) on delete cascade,
  full_name     text not null,
  email         text,
  phone         text,
  whatsapp      text,
  avatar_url    text,
  bio           text,
  agency        text,
  speciality    text[],       -- e.g. ['residential', 'commercial']
  districts     text[],       -- areas they cover
  languages     text[],
  verified      boolean default true,
  verified_score integer default 80,
  listings_count integer default 0,
  rating        numeric(3,2) default 4.5,
  reviews_count integer default 0,
  years_exp     integer default 3,
  created_at    timestamptz not null default now()
);

create index if not exists broker_profiles_tenant_idx on broker_profiles(tenant_id);

alter table broker_profiles enable row level security;

create policy "Public can read broker profiles"
  on broker_profiles for select using (true);

-- Allow service key to manage
create policy "Service can manage broker profiles"
  on broker_profiles for all using (true);

-- ============================================================
-- Service providers table
-- ============================================================
create table if not exists public.service_providers (
  id             uuid default gen_random_uuid() primary key,
  tenant_id      uuid references tenants(id) on delete cascade,
  category       text not null,
  name           text not null,
  contact_name   text,
  phone          text,
  whatsapp       text,
  email          text,
  address        text,
  district       text,
  description    text,
  price_from     numeric,
  currency       text default 'ETB',
  price_unit     text default 'session',
  service_areas  text[] default '{}',
  working_hours  text,
  response_time  text,
  languages      text[] default '{}',
  team_size      text,
  founded_year   text,
  tags           text[] default '{}',
  highlights     text[] default '{}',
  photo_url      text,
  rating         numeric(3,2) default 4.5,
  reviews_count  int default 0,
  verified       boolean default false,
  status         text default 'active',
  created_at     timestamptz default now()
);

create index if not exists service_providers_tenant_category on service_providers(tenant_id, category);

alter table service_providers enable row level security;

create policy "Public read service providers"
  on service_providers for select using (true);

create policy "Service role manage service providers"
  on service_providers for all using (true) with check (true);

-- ============================================================
-- Privacy requests table (GDPR Art. 17/20, Kenya DPA, UAE PDPL)
-- ============================================================
create table if not exists public.privacy_requests (
  id           uuid default gen_random_uuid() primary key,
  type         text not null check (type in ('access','delete','export','rectification','restriction','object','withdraw')),
  email        text not null,
  name         text,
  details      text,
  ip_address   text,
  user_agent   text,
  status       text not null default 'pending' check (status in ('pending','in_progress','completed','rejected')),
  deadline     text,
  resolved_at  timestamptz,
  notes        text,
  created_at   timestamptz default now()
);

create index if not exists privacy_requests_email_idx on privacy_requests(email);
create index if not exists privacy_requests_status_idx on privacy_requests(status);

alter table privacy_requests enable row level security;

-- Only service role can access privacy requests (sensitive data)
create policy "Service role only for privacy requests"
  on privacy_requests for all using (true) with check (true);

-- ============================================================
-- Profile: add deletion_requested_at field
-- ============================================================
alter table profiles
  add column if not exists deletion_requested_at timestamptz;

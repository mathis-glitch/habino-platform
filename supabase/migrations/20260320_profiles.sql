-- ============================================================
-- User profiles: extended contact info
-- ============================================================

create table if not exists profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  tenant_id     uuid references tenants(id) on delete cascade,
  full_name     text,
  email         text,
  phone         text,
  whatsapp      text,
  address       text,
  city          text,
  country_code  char(2) default 'US',
  id_number     text,              -- passport / national ID
  avatar_url    text,
  bio           text,
  preferred_lang char(5) default 'en-US',
  role          text default 'buyer',  -- buyer | operator_admin
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists profiles_tenant_idx on profiles(tenant_id);

-- Auto-update updated_at
create or replace function update_profiles_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists profiles_updated_at on profiles;
create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_profiles_updated_at();

-- RLS
alter table profiles enable row level security;

drop policy if exists "Users read own profile" on profiles;
create policy "Users read own profile"
  on profiles for select
  using (id = auth.uid());

drop policy if exists "Users update own profile" on profiles;
create policy "Users update own profile"
  on profiles for update
  using (id = auth.uid());

drop policy if exists "Users insert own profile" on profiles;
create policy "Users insert own profile"
  on profiles for insert
  with check (id = auth.uid());

-- Operators can read profiles of users in their tenant
drop policy if exists "Operators read tenant profiles" on profiles;
create policy "Operators read tenant profiles"
  on profiles for select
  using (
    tenant_id in (
      select tenant_id from users where id = auth.uid() and role = 'operator_admin'
    )
  );

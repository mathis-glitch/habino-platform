-- ============================================================
-- Sales Agent & Referral Tracking System
-- ============================================================

-- Sales agents table
create table if not exists public.sales_agents (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade unique not null,
  full_name    text not null,
  phone        text,
  email        text,
  agent_code   text unique not null,
  status       text not null default 'pending'
               check (status in ('pending','active','suspended')),
  notes        text,   -- admin notes
  approved_at  timestamptz,
  approved_by  uuid,
  created_at   timestamptz not null default now()
);

create index if not exists sales_agents_status_idx on sales_agents(status);
create index if not exists sales_agents_user_idx on sales_agents(user_id);

-- Referrals table (one row per referred user)
create table if not exists public.referrals (
  id               uuid primary key default gen_random_uuid(),
  agent_id         uuid references public.sales_agents(id) on delete cascade not null,
  referred_user_id uuid references auth.users(id) on delete cascade not null,
  agent_code       text not null,
  registered_at    timestamptz not null default now(),
  qualified_at     timestamptz,
  points           integer not null default 0,
  type             text not null default 'standard'
                   check (type in ('standard','broker','servicer')),
  status           text not null default 'pending'
                   check (status in ('pending','qualified')),
  unique(referred_user_id)  -- each user can only be referred once
);

create index if not exists referrals_agent_idx  on referrals(agent_id);
create index if not exists referrals_status_idx on referrals(status);
create index if not exists referrals_date_idx   on referrals(registered_at);

-- ── Agent code generator ──────────────────────────────────────────────────────
create or replace function generate_agent_code(p_name text)
returns text language plpgsql as $$
declare
  prefix text;
  code   text;
  i      int := 0;
begin
  prefix := upper(left(regexp_replace(coalesce(p_name,'SA'), '[^a-zA-Z]', '', 'g'), 3));
  if length(prefix) < 2 then prefix := 'SA'; end if;
  loop
    code := prefix || '-' || upper(substring(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when not exists (select 1 from public.sales_agents where agent_code = code);
    i := i + 1;
    if i > 20 then code := 'SA-' || upper(substring(md5(random()::text), 1, 8)); exit; end if;
  end loop;
  return code;
end;
$$;

-- ── Auto-qualify referral when profile score reaches 75 ──────────────────────
create or replace function check_referral_qualification()
returns trigger language plpgsql security definer as $$
begin
  if new.verified_score >= 75 and coalesce(old.verified_score, 0) < 75 then
    update public.referrals
    set
      status       = 'qualified',
      qualified_at = now(),
      points       = case type when 'broker' then 2 when 'servicer' then 2 else 1 end
    where referred_user_id = new.id
    and   status = 'pending';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_referral_qualification on public.profiles;
create trigger trg_referral_qualification
  after update of verified_score on public.profiles
  for each row execute function check_referral_qualification();

-- ── Upgrade referral to 2x when user becomes broker/servicer ─────────────────
create or replace function upgrade_referral_on_module()
returns trigger language plpgsql security definer as $$
declare
  v_module text;
begin
  v_module := TG_ARGV[0];  -- 'broker' or 'servicer'
  update public.referrals
  set type = v_module, points = 2
  where referred_user_id = new.user_id
  and   status = 'qualified';
  return new;
end;
$$;

-- Trigger on broker_profiles insert
drop trigger if exists trg_broker_referral_upgrade on public.broker_profiles;
-- (Only if broker_profiles has user_id column — added by mobile listing flow)
do $$ begin
  if exists (
    select 1 from information_schema.columns
    where table_name='broker_profiles' and column_name='user_id'
  ) then
    execute $t$
      create trigger trg_broker_referral_upgrade
        after insert on public.broker_profiles
        for each row execute function upgrade_referral_on_module('broker')
    $t$;
  end if;
end $$;

-- Trigger on service_providers insert
drop trigger if exists trg_servicer_referral_upgrade on public.service_providers;
do $$ begin
  if exists (
    select 1 from information_schema.columns
    where table_name='service_providers' and column_name='user_id'
  ) then
    execute $t$
      create trigger trg_servicer_referral_upgrade
        after insert on public.service_providers
        for each row execute function upgrade_referral_on_module('servicer')
    $t$;
  end if;
end $$;

-- ── Add user_id column to broker_profiles & service_providers if missing ──────
alter table public.broker_profiles
  add column if not exists user_id uuid references auth.users(id);

alter table public.service_providers
  add column if not exists user_id uuid references auth.users(id);

-- ── RLS ───────────────────────────────────────────────────────────────────────
alter table public.sales_agents enable row level security;
alter table public.referrals    enable row level security;

-- Agent can read/insert their own record
create policy "Agent read own" on public.sales_agents
  for select using (auth.uid() = user_id);

create policy "Agent insert own" on public.sales_agents
  for insert with check (auth.uid() = user_id);

-- Service role full access (for admin dashboard)
create policy "Service full sales_agents" on public.sales_agents
  for all using (true) with check (true);

create policy "Service full referrals" on public.referrals
  for all using (true) with check (true);

-- Referred users can see their own referral (to know they came via a code)
create policy "User read own referral" on public.referrals
  for select using (auth.uid() = referred_user_id);

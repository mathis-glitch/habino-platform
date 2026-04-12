-- Push notification tokens
-- One token per user (upserted by the mobile app on login)

create table if not exists push_tokens (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  tenant_id   uuid not null,
  token       text not null,
  platform    text not null default 'ios',   -- 'ios' | 'android'
  updated_at  timestamptz not null default now(),
  unique (user_id)
);

create index if not exists push_tokens_tenant_idx on push_tokens(tenant_id);

-- RLS: users can only read/write their own token
alter table push_tokens enable row level security;

create policy "push_tokens_own" on push_tokens
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Service role can read all (needed by edge function)
create policy "push_tokens_service" on push_tokens
  as permissive for select
  to service_role
  using (true);

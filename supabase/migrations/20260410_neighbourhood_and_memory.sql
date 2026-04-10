-- ============================================================
-- Neighbourhood intelligence cache
-- ============================================================
create table if not exists neighbourhood_insights (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid references tenants(id) on delete cascade,
  name         text not null,                 -- normalised neighbourhood name
  summary      text,                          -- AI-generated plain-text description
  highlights   text[] default '{}',           -- 4-5 bullet highlights
  poi_counts   jsonb  default '{}',           -- { school: 3, hospital: 1, ... }
  created_at   timestamptz default now(),
  unique(tenant_id, name)
);

alter table neighbourhood_insights enable row level security;
create policy "Public read neighbourhood insights"
  on neighbourhood_insights for select using (true);
create policy "Service role manage neighbourhood insights"
  on neighbourhood_insights for all using (true);

-- ============================================================
-- Conversational memory: user search preferences
-- ============================================================
create table if not exists user_search_sessions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null,
  tenant_id    uuid references tenants(id) on delete cascade,
  -- Extracted from last AI chat session
  preferences  jsonb default '{}',
  -- e.g. { listing_type: "rent", neighbourhood: "Bole", property_type: "apartment",
  --         bedrooms: 3, max_price: 25000, last_query: "3BR in Bole" }
  updated_at   timestamptz default now(),
  unique(user_id, tenant_id)
);

create index if not exists user_search_sessions_user_idx
  on user_search_sessions(user_id, tenant_id);

alter table user_search_sessions enable row level security;
create policy "Users manage own search session"
  on user_search_sessions for all
  using (auth.uid() = user_id);
create policy "Service role manage search sessions"
  on user_search_sessions for all using (true);

-- analytics_events: lightweight event log for district demand heatmap + funnel
create table if not exists analytics_events (
  id          uuid        primary key default gen_random_uuid(),
  event_type  text        not null,                          -- property_viewed, search_performed, …
  user_id     uuid        references profiles(id) on delete set null,
  district    text,                                          -- resolved Addis Abeba district
  lat         double precision,
  lng         double precision,
  metadata    jsonb,
  created_at  timestamptz not null default now()
);

-- Index for dashboard queries
create index if not exists analytics_events_type_created  on analytics_events (event_type, created_at desc);
create index if not exists analytics_events_district       on analytics_events (district, created_at desc);
create index if not exists analytics_events_user           on analytics_events (user_id, created_at desc);

-- RLS: anyone (incl. anon) can insert; only service role can select (dashboard uses service client)
alter table analytics_events enable row level security;

create policy "insert_analytics" on analytics_events
  for insert with check (true);

-- No select policy for regular users — service client bypasses RLS

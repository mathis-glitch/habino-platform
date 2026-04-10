-- ============================================================
-- Broker profile: AI-relevant field enhancements
-- ============================================================

alter table broker_profiles
  -- Types of properties the broker handles
  add column if not exists property_types     text[]  default '{}',
  -- Professional certifications (e.g. "Licensed Realtor", "Certified Negotiator")
  add column if not exists certifications     text[]  default '{}',
  -- Typical number of completed transactions (signals experience depth)
  add column if not exists transaction_count  integer default 0,
  -- Price range the broker typically works in (ETB)
  add column if not exists price_range_min    numeric,
  add column if not exists price_range_max    numeric,
  -- Typical response time in hours (for lead scoring and matching)
  add column if not exists response_time_hrs  integer,
  -- Social/contact links (whatsapp_link, linkedin, etc.)
  add column if not exists social_links       jsonb   default '{}',
  -- AI-generated summary for display and embedding (auto-refresh on profile update)
  add column if not exists ai_summary         text;

-- Index on property_types array for filter queries
create index if not exists broker_property_types_idx
  on broker_profiles using gin (property_types);

-- ── Populate ai_summary function ────────────────────────────────
-- Called manually or via trigger after profile update.
-- The actual LLM call happens in the API layer; this stores the result.
comment on column broker_profiles.ai_summary is
  'AI-generated plain-text summary used for embedding and display. Refresh via /api/brokers/[id] PATCH with { refresh_ai_summary: true }.';

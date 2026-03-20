-- ============================================================
-- Contracts: storage bucket + table + RLS
-- ============================================================

-- ── 1. Storage bucket for contract PDFs (private) ──────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'contracts',
  'contracts',
  false,                        -- private: only via signed URL
  52428800,                     -- 50 MB
  array['application/pdf']
)
on conflict (id) do nothing;

drop policy if exists "contracts bucket: owner read"   on storage.objects;
drop policy if exists "contracts bucket: owner insert" on storage.objects;
drop policy if exists "contracts bucket: owner delete" on storage.objects;

-- Only authenticated users can access their own contract files
create policy "contracts bucket: owner read"
  on storage.objects for select to authenticated
  using (bucket_id = 'contracts' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "contracts bucket: owner insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'contracts' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "contracts bucket: owner delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'contracts' and auth.uid()::text = (storage.foldername(name))[1]);

-- ── 2. Contracts table ──────────────────────────────────────
do $$ begin
  create type contract_status as enum (
    'draft', 'pending_review', 'pending_signature',
    'signed', 'active', 'expired', 'terminated'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type contract_type as enum (
    'residential_rental', 'commercial_rental', 'purchase',
    'option_to_purchase', 'short_term_rental'
  );
exception when duplicate_object then null;
end $$;

create table if not exists contracts (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid not null references tenants(id) on delete cascade,
  property_id       uuid not null references properties(id) on delete restrict,

  -- Parties
  landlord_user_id  uuid references auth.users(id) on delete set null,
  landlord_name     text not null,
  landlord_email    text not null,
  landlord_address  text,

  tenant_user_id    uuid references auth.users(id) on delete set null,
  tenant_name       text not null,
  tenant_email      text not null,
  tenant_address    text,
  tenant_id_number  text,             -- passport / national ID

  -- Contract details
  contract_type     contract_type not null default 'residential_rental',
  status            contract_status not null default 'draft',

  -- Dates
  start_date        date not null,
  end_date          date,             -- null = indefinite/rolling
  notice_period_days int not null default 30,

  -- Financials
  monthly_rent      numeric(14,2),
  purchase_price    numeric(14,2),
  deposit_amount    numeric(14,2),
  currency          text not null default 'USD',
  payment_day       smallint default 1,  -- day of month rent is due

  -- Jurisdiction & language (international standards)
  country_code      char(2) not null default 'KE',  -- ISO 3166-1 alpha-2
  governing_law     text,             -- e.g. "Laws of Kenya", "German Civil Code (BGB)"
  jurisdiction_city text,             -- dispute resolution venue
  language          char(2) not null default 'en',   -- ISO 639-1

  -- AI-generated structured content
  contract_data     jsonb not null default '{}',
  -- Structure:
  -- {
  --   "clauses": [{ "title": string, "body": string, "type": string }],
  --   "special_conditions": string[],
  --   "utilities_included": string[],
  --   "furnished": boolean,
  --   "pets_allowed": boolean,
  --   "subletting_allowed": boolean,
  --   "jurisdiction_notes": string,
  --   "generated_at": ISO timestamp,
  --   "model": string
  -- }

  -- Signatures (stored as JSON for flexibility)
  signatures        jsonb not null default '{}',
  -- {
  --   "landlord": { "signed_at": ISO, "ip": string, "method": "electronic" },
  --   "tenant":   { "signed_at": ISO, "ip": string, "method": "electronic" }
  -- }

  -- PDF
  pdf_url           text,             -- signed storage URL or public path
  pdf_storage_path  text,             -- path inside contracts bucket

  -- Meta
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  signed_at         timestamptz,
  activated_at      timestamptz
);

-- Indices
create index if not exists contracts_tenant_idx      on contracts(tenant_id);
create index if not exists contracts_property_idx    on contracts(property_id);
create index if not exists contracts_landlord_idx    on contracts(landlord_user_id);
create index if not exists contracts_tenant_user_idx on contracts(tenant_user_id);
create index if not exists contracts_status_idx      on contracts(status);

-- Auto-update updated_at
create or replace function update_contracts_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists contracts_updated_at on contracts;
create trigger contracts_updated_at
  before update on contracts
  for each row execute function update_contracts_updated_at();

-- ── 3. RLS ──────────────────────────────────────────────────
alter table contracts enable row level security;

-- Operators can see all contracts for their tenant
drop policy if exists "Operators see all tenant contracts" on contracts;
create policy "Operators see all tenant contracts"
  on contracts for all
  using (
    tenant_id in (
      select tenant_id from users where id = auth.uid() and role = 'operator_admin'
    )
  );

-- Tenants (buyers) can see only contracts where they are a party
drop policy if exists "Users see own contracts" on contracts;
create policy "Users see own contracts"
  on contracts for select
  using (
    landlord_user_id = auth.uid() or tenant_user_id = auth.uid()
  );

-- Anyone can create a contract (validation happens in API layer)
drop policy if exists "Authenticated can create contracts" on contracts;
create policy "Authenticated can create contracts"
  on contracts for insert
  to authenticated
  with check (true);

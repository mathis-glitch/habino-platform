-- ============================================================
-- pgvector: semantic search for properties and broker profiles
-- ============================================================

-- Enable pgvector extension (must be done by a superuser in Supabase dashboard
-- under Database → Extensions → vector, or via SQL editor)
create extension if not exists vector;

-- ── Properties: embedding column ────────────────────────────────
alter table properties
  add column if not exists embedding vector(1536);

-- IVFFlat index for fast approximate nearest-neighbour search.
-- lists = 100 is appropriate for ~10k rows (rule: sqrt(row_count)).
-- Build after backfill; during backfill the index is not yet useful.
create index if not exists properties_embedding_idx
  on properties using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- ── Broker profiles: embedding column ───────────────────────────
alter table broker_profiles
  add column if not exists embedding vector(1536);

create index if not exists broker_profiles_embedding_idx
  on broker_profiles using ivfflat (embedding vector_cosine_ops)
  with (lists = 10);

-- ── Semantic property search RPC ────────────────────────────────
-- Returns property IDs ordered by cosine similarity to a query embedding.
-- Called by /api/properties when ?q= is provided.
create or replace function search_properties_semantic(
  query_embedding  vector(1536),
  tenant_id_filter uuid,
  match_count      int     default 30,
  threshold        float   default 0.35
)
returns table(id uuid, similarity float)
language sql stable
as $$
  select
    p.id,
    1 - (p.embedding <=> query_embedding) as similarity
  from properties p
  where
    p.tenant_id = tenant_id_filter
    and p.status  = 'active'
    and p.embedding is not null
    and 1 - (p.embedding <=> query_embedding) > threshold
  order by p.embedding <=> query_embedding
  limit match_count;
$$;

-- ── Semantic broker search RPC ───────────────────────────────────
-- Returns broker IDs ordered by cosine similarity to a query embedding.
-- Called by /api/brokers/match.
create or replace function search_brokers_semantic(
  query_embedding  vector(1536),
  tenant_id_filter uuid,
  match_count      int   default 5,
  threshold        float default 0.30
)
returns table(id uuid, similarity float)
language sql stable
as $$
  select
    b.id,
    1 - (b.embedding <=> query_embedding) as similarity
  from broker_profiles b
  where
    b.tenant_id = tenant_id_filter
    and b.embedding is not null
    and 1 - (b.embedding <=> query_embedding) > threshold
  order by b.embedding <=> query_embedding
  limit match_count;
$$;

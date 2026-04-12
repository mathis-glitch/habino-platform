-- Add nearby_text field to properties for richer AI search embeddings.
-- Brokers fill this in: "5 min to Edna Mall, near British School, close to Bole Airport"
-- This text is included in the OpenAI embedding → significantly improves semantic search.

alter table properties
  add column if not exists nearby_text text default null;

comment on column properties.nearby_text is
  'Freetext description of nearby landmarks, schools, roads, and points of interest. Included in the search embedding.';

-- Re-null all embeddings so the backfill script re-embeds with the richer text.
-- Run AFTER applying this migration AND after running the backfill script.
-- Uncomment only when ready to trigger full re-embed:
-- update properties set embedding = null where status = 'active';

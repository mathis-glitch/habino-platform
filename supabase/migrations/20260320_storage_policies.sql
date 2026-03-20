-- ============================================================
-- Storage: property-images bucket + RLS policies
-- ============================================================

-- Create the storage bucket (idempotent)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'property-images',
  'property-images',
  true,                          -- publicly readable via CDN URL
  10485760,                      -- 10 MB per file
  array['image/jpeg','image/png','image/webp','image/gif']
)
on conflict (id) do nothing;

-- Drop existing policies to make migration re-runnable
drop policy if exists "allow uploads 107eh68_0"          on storage.objects;
drop policy if exists "allow public reads property-images" on storage.objects;
drop policy if exists "allow deletes property-images"     on storage.objects;

-- INSERT: anon + authenticated users may upload to property-images
create policy "allow uploads 107eh68_0"
  on storage.objects
  for insert
  to anon, authenticated
  with check (bucket_id = 'property-images');

-- SELECT: anyone may read files from property-images (public bucket)
create policy "allow public reads property-images"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'property-images');

-- DELETE: only authenticated users may delete their own uploads
create policy "allow deletes property-images"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'property-images' and auth.uid() = owner);

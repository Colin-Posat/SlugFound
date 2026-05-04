-- ============================================================================
-- SlugFound — Sprint 2 Migration 0003
-- Storage bucket for item images (US 2.4)
--
-- Creates a public bucket so anyone can view item images, but only authenticated
-- users can upload, and only owners can delete their own files.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Bucket
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'item-images',
  'item-images',
  true,                                 -- publicly readable URLs
  5242880,                              -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ----------------------------------------------------------------------------
-- Storage RLS policies
--
-- Files are stored at: item-images/<user_id>/<filename>
-- The first folder name MUST match the uploader's user_id, which is enforced
-- in the policy below via storage.foldername().
-- ----------------------------------------------------------------------------

-- Anyone (even anonymous) can read item images so cards on listings show.
create policy "item images are publicly readable"
  on storage.objects
  for select
  using (bucket_id = 'item-images');

-- Only authenticated users can upload, and only into a folder matching their user id.
create policy "users can upload their own item images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'item-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Only owners can update or delete their own files.
create policy "users can update their own item images"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'item-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users can delete their own item images"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'item-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

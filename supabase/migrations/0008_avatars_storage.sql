-- ============================================================================
-- SlugFound — Migration 0008
-- Storage bucket for user avatars (US 4.5)
--
-- Public bucket so avatars render across the app. Authenticated users may
-- upload / replace / delete only files inside their own <user_id>/ folder,
-- enforced via storage.foldername() — same pattern as item-images (0003).
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,                                 -- publicly readable URLs
  2097152,                              -- 2 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Anyone can read avatars so they show on cards, sidebar, and message lists.
create policy "avatars are publicly readable"
  on storage.objects
  for select
  using (bucket_id = 'avatars');

create policy "users can upload their own avatar"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users can update their own avatar"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users can delete their own avatar"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

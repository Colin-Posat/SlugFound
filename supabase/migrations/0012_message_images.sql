-- ============================================================================
-- SlugFound — Migration 0012
-- Photo messages: message-images storage bucket + schema changes on messages.
--
-- Allows users to attach images to messages. The `body` column becomes
-- nullable so image-only messages can be sent; a CHECK constraint ensures
-- at least one of body or image_url is always present.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Storage bucket for message images
-- Public read (URLs contain UUIDs — effectively unguessable), authenticated
-- upload only into the sender's own <user_id>/ folder.
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'message-images',
  'message-images',
  true,
  10485760,   -- 10 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "message images are publicly readable"
  on storage.objects
  for select
  using (bucket_id = 'message-images');

create policy "users can upload their own message images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'message-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users can delete their own message images"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'message-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ----------------------------------------------------------------------------
-- Schema changes on the messages table
-- ----------------------------------------------------------------------------

-- 1. Make body nullable (image-only messages have no text).
alter table public.messages
  alter column body drop not null;

-- 2. Add the image URL column.
alter table public.messages
  add column if not exists image_url text;

-- 3. Drop the old inline check (auto-named "messages_body_check") that required
--    body to be 1-2000 chars — it no longer applies when body is NULL.
alter table public.messages
  drop constraint if exists messages_body_check;

-- 4. Restore body length validation only when body is present.
alter table public.messages
  add constraint messages_body_length
  check (body is null or char_length(body) between 1 and 2000);

-- 5. Ensure at least one of body or image_url is present.
alter table public.messages
  add constraint messages_has_content
  check (body is not null or image_url is not null);

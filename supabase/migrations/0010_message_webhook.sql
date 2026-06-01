-- ============================================================================
-- SlugFound — Migration 0010
-- Database webhook: POST to the new-message notification route on message insert
-- (US 4.4)
--
-- NOT YET APPLIED. This needs two things that only exist at deploy time:
--   1. A publicly reachable app URL (Supabase Cloud cannot call localhost).
--   2. The NOTIFY_WEBHOOK_SECRET value configured on the Next.js app.
--
-- Before applying, replace the two placeholders below, then run via the Supabase
-- MCP/CLI/dashboard. (Alternatively, configure this through the Supabase
-- Dashboard → Database → Webhooks UI, which builds the same trigger.)
-- ============================================================================

create extension if not exists pg_net with schema extensions;

create or replace function public.notify_new_message()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform net.http_post(
    url := 'https://REPLACE_WITH_APP_URL/api/notifications/new-message',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', 'REPLACE_WITH_NOTIFY_WEBHOOK_SECRET'
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'messages',
      'record', to_jsonb(new)
    )
  );
  return new;
end;
$$;

-- Trigger functions shouldn't be callable as PostgREST RPCs.
revoke execute on function public.notify_new_message() from public, anon, authenticated;

drop trigger if exists messages_notify_new on public.messages;

create trigger messages_notify_new
  after insert on public.messages
  for each row
  execute function public.notify_new_message();

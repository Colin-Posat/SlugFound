-- ============================================================================
-- SlugFound — Migration 0007
-- Email notification support for new messages (US 4.4)
--
-- Adds an opt-out flag + a stable unsubscribe token to profiles, and a
-- notification_log used for per-conversation, per-recipient rate limiting.
-- ============================================================================

alter table public.profiles
  add column if not exists email_notifications boolean not null default true,
  add column if not exists unsubscribe_token   uuid    not null default gen_random_uuid();

-- ----------------------------------------------------------------------------
-- notification_log — one row per (conversation, recipient). last_notified_at
-- powers the "one email per conversation per 10-minute window" rate limit.
-- Written only by the notification API route via the service role, so RLS is
-- enabled with no policies (service role bypasses RLS; clients get no access).
-- ----------------------------------------------------------------------------
create table if not exists public.notification_log (
  conversation_id  uuid not null references public.conversations(id) on delete cascade,
  recipient_id     uuid not null references public.profiles(id) on delete cascade,
  last_notified_at timestamptz not null default now(),
  primary key (conversation_id, recipient_id)
);

alter table public.notification_log enable row level security;

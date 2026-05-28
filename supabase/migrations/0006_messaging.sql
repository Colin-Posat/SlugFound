-- ============================================================================
-- SlugFound — Migration 0006
-- Conversations + messages tables for real-time messaging between users.
--
-- Each conversation links two users and one item. Messages are stored per
-- conversation. Unread tracking uses a last_read_at timestamp per user side.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- conversations table
-- One row per (user_a, user_b, item) triple. user_a < user_b enforced by
-- CHECK constraint to prevent duplicate conversations for the same pair.
-- ----------------------------------------------------------------------------
create table if not exists public.conversations (
  id                   uuid primary key default gen_random_uuid(),
  item_id              uuid not null references public.items(id) on delete cascade,
  user_a               uuid not null references public.profiles(id) on delete cascade,
  user_b               uuid not null references public.profiles(id) on delete cascade,
  user_a_last_read_at  timestamptz not null default now(),
  user_b_last_read_at  timestamptz not null default now(),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),

  constraint conversations_user_order   check (user_a < user_b),
  constraint conversations_no_self_chat check (user_a != user_b),
  constraint conversations_unique_pair  unique (user_a, user_b, item_id)
);

-- ----------------------------------------------------------------------------
-- Indexes — look up conversations for a given user
-- ----------------------------------------------------------------------------
create index if not exists conversations_user_a_idx on public.conversations (user_a);
create index if not exists conversations_user_b_idx on public.conversations (user_b);
create index if not exists conversations_item_idx   on public.conversations (item_id);

-- ----------------------------------------------------------------------------
-- Row-level security — participants only
-- ----------------------------------------------------------------------------
alter table public.conversations enable row level security;

create policy "users can view their own conversations"
  on public.conversations
  for select
  to authenticated
  using (auth.uid() = user_a or auth.uid() = user_b);

create policy "users can insert conversations they belong to"
  on public.conversations
  for insert
  to authenticated
  with check (auth.uid() = user_a or auth.uid() = user_b);

create policy "users can update their own conversations"
  on public.conversations
  for update
  to authenticated
  using (auth.uid() = user_a or auth.uid() = user_b)
  with check (auth.uid() = user_a or auth.uid() = user_b);

-- ----------------------------------------------------------------------------
-- updated_at trigger (reuses function from migration 0001)
-- ----------------------------------------------------------------------------
drop trigger if exists set_conversations_updated_at on public.conversations;

create trigger set_conversations_updated_at
  before update on public.conversations
  for each row
  execute function public.set_updated_at();

-- ============================================================================
-- messages table
-- ============================================================================
create table if not exists public.messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.conversations(id) on delete cascade,
  sender_id        uuid not null references public.profiles(id) on delete cascade,
  body             text not null check (char_length(body) between 1 and 2000),
  created_at       timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Indexes
-- ----------------------------------------------------------------------------
create index if not exists messages_conversation_created_idx
  on public.messages (conversation_id, created_at);

create index if not exists messages_sender_idx
  on public.messages (sender_id);

-- ----------------------------------------------------------------------------
-- Row-level security — only conversation participants can read/write
-- ----------------------------------------------------------------------------
alter table public.messages enable row level security;

create policy "users can view messages in their conversations"
  on public.messages
  for select
  to authenticated
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.user_a = auth.uid() or c.user_b = auth.uid())
    )
  );

create policy "users can send messages in their conversations"
  on public.messages
  for insert
  to authenticated
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.user_a = auth.uid() or c.user_b = auth.uid())
    )
  );

-- ----------------------------------------------------------------------------
-- Enable Supabase Realtime for the messages table so clients receive INSERT
-- events via postgres_changes subscriptions.
-- ----------------------------------------------------------------------------
alter publication supabase_realtime add table public.messages;

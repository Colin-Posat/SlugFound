-- ============================================================================
-- SlugFound — Sprint 2 Migration 0002
-- Items table for lost/found posts, with RLS, indexes, and constraints.
--
-- User Story 2.3: Lost/found items need a structured table with proper
-- ownership, RLS, and indexes to support filtering on listings pages.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
do $$ begin
  create type public.item_type as enum ('lost', 'found');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.item_status as enum ('active', 'claimed', 'resolved');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- items table
-- ----------------------------------------------------------------------------
create table if not exists public.items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  type        public.item_type not null,
  title       text not null check (char_length(title) between 1 and 120),
  description text not null check (char_length(description) between 1 and 1000),
  category    text not null check (category in (
                'Electronics', 'Clothing', 'Accessories', 'Books',
                'Keys', 'ID/Cards', 'Water Bottle', 'Personal Items', 'Other'
              )),
  location    text not null,
  status      public.item_status not null default 'active',
  image_url   text,
  emoji       text,  -- optional emoji for visual flair on listing cards
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Indexes — chosen to match the most common queries on /lost and /found:
--   (1) WHERE type = 'lost' ORDER BY created_at DESC
--   (2) WHERE category = 'Electronics'
--   (3) WHERE status = 'active'
-- ----------------------------------------------------------------------------
create index if not exists items_type_created_idx on public.items (type, created_at desc);
create index if not exists items_category_idx     on public.items (category);
create index if not exists items_status_idx       on public.items (status);
create index if not exists items_user_id_idx      on public.items (user_id);

-- ----------------------------------------------------------------------------
-- Row-level security
--
-- Read: any authenticated user can see all items (listings are shared).
-- Write: only the owning user can insert/update/delete their own rows.
-- ----------------------------------------------------------------------------
alter table public.items enable row level security;

create policy "items are viewable by everyone authenticated"
  on public.items
  for select
  to authenticated
  using (true);

create policy "users can insert their own items"
  on public.items
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "users can update their own items"
  on public.items
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can delete their own items"
  on public.items
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- updated_at auto-bump trigger (reuses the function from migration 0001)
-- ----------------------------------------------------------------------------
drop trigger if exists set_items_updated_at on public.items;

create trigger set_items_updated_at
  before update on public.items
  for each row
  execute function public.set_updated_at();

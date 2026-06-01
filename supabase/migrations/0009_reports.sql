-- ============================================================================
-- SlugFound — Migration 0009
-- Reports table for flagging inappropriate item listings (US 4.6)
--
-- Reports are write-only for users: an authenticated user can INSERT a report
-- as themselves, but no one can SELECT/UPDATE/DELETE via the anon/auth roles
-- (admin review happens later via the service role). A unique (item_id,
-- reporter_id) constraint enforces one report per user per item.
-- ============================================================================

do $$ begin
  create type public.report_reason as enum ('spam', 'offensive', 'duplicate', 'other');
exception when duplicate_object then null; end $$;

create table if not exists public.reports (
  id           uuid primary key default gen_random_uuid(),
  item_id      uuid not null references public.items(id) on delete cascade,
  reporter_id  uuid not null references public.profiles(id) on delete cascade,
  reason       public.report_reason not null,
  notes        text check (notes is null or char_length(notes) <= 300),
  created_at   timestamptz not null default now(),
  constraint reports_unique_reporter_item unique (item_id, reporter_id)
);

create index if not exists reports_item_idx on public.reports (item_id);

alter table public.reports enable row level security;

-- Only INSERT is allowed for authenticated users, and only as themselves.
create policy "users can file their own reports"
  on public.reports
  for insert
  to authenticated
  with check (auth.uid() = reporter_id);

-- ----------------------------------------------------------------------------
-- Stretch: auto-flag an item once it accumulates 3+ reports. Flagged items are
-- hidden from listings (see app/lib/items.ts) but remain reachable by direct
-- URL with a warning banner.
-- ----------------------------------------------------------------------------
alter table public.items
  add column if not exists reported_flag boolean not null default false;

create or replace function public.flag_item_if_reported()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.reports where item_id = new.item_id) >= 3 then
    update public.items set reported_flag = true where id = new.item_id;
  end if;
  return new;
end;
$$;

drop trigger if exists reports_flag_item on public.reports;

create trigger reports_flag_item
  after insert on public.reports
  for each row
  execute function public.flag_item_if_reported();

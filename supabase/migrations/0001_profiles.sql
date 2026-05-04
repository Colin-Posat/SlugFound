-- ============================================================================
-- SlugFound — Sprint 2 Migration 0001
-- Profiles table + auto-create trigger on auth.users insert
--
-- User Story 2.1: New users registering with @ucsc.edu email need a profiles
-- row created automatically so we can store display_name and link items to a
-- human-readable identity.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- profiles table
-- One row per registered user. Linked to auth.users via id (FK).
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  email        text not null unique,
  avatar_url   text,
  college      text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Enforce that the email column never contains anything but UCSC addresses.
-- This is a safety net; the client also validates this before signup.
alter table public.profiles
  add constraint profiles_email_ucsc_check
  check (email ~* '^[^@\s]+@ucsc\.edu$');

-- ----------------------------------------------------------------------------
-- Row-level security
-- Anyone authenticated can read all profiles (so we can show poster names on
-- listings). Users can only insert/update their own row.
-- ----------------------------------------------------------------------------
alter table public.profiles enable row level security;

create policy "profiles are viewable by everyone authenticated"
  on public.profiles
  for select
  to authenticated
  using (true);

create policy "users can insert their own profile"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

create policy "users can update their own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- Auto-create a profile row whenever a new user signs up via Supabase Auth.
--
-- Supabase Auth writes to auth.users on signup; this trigger inserts a
-- corresponding row into public.profiles using the metadata the client
-- passed (display_name from sign-up form).
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer  -- runs with elevated privileges so it can insert into a RLS-protected table
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- updated_at auto-bump trigger
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

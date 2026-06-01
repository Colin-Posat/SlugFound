-- ============================================================================
-- SlugFound — Migration 0011
-- Security hardening from the Supabase advisor (function hygiene)
--
-- - Pin search_path on set_updated_at (was role-mutable).
-- - Revoke direct EXECUTE on SECURITY DEFINER trigger functions so they cannot
--   be invoked as PostgREST RPCs by anon/authenticated. Trigger firing is
--   unaffected (triggers run as the function owner regardless of EXECUTE grants).
-- ============================================================================

alter function public.set_updated_at() set search_path = public;

-- Revoke from PUBLIC too — Postgres grants EXECUTE to PUBLIC by default, which
-- otherwise still exposes these as RPCs to anon/authenticated.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.flag_item_if_reported() from public, anon, authenticated;

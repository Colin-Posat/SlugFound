-- ============================================================================
-- SlugFound — Migration 0004
-- Adds image_embedding column for in-process cosine similarity search.
-- Stored as jsonb (number array) — no pgvector extension required.
-- ============================================================================

alter table public.items
  add column if not exists image_embedding jsonb;

-- Add optional lat/lng coordinates to items for the map location picker.
-- Both columns are nullable for backward compatibility with existing rows.

ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;

-- Partial index covers future radius-based filtering without bloating non-spatial rows.
CREATE INDEX IF NOT EXISTS items_coords_idx
  ON public.items (lat, lng)
  WHERE lat IS NOT NULL AND lng IS NOT NULL;

/**
 * Supabase Storage URL helpers.
 *
 * Pure functions with no server/client dependencies, so they're safe to import
 * anywhere (server actions, client components, unit tests).
 */

/**
 * Extract the in-bucket object path from a Supabase public URL.
 *
 * Public URLs look like:
 *   https://<ref>.supabase.co/storage/v1/object/public/item-images/<uid>/<file>
 *
 * Returns "<uid>/<file>" (URL-decoded), or null if the URL doesn't point at the
 * given bucket. Used to delete the old image when swapping or removing a listing.
 */
export function storagePathFromPublicUrl(
  url: string | null | undefined,
  bucket = 'item-images',
): string | null {
  if (!url) return null
  const marker = `/storage/v1/object/public/${bucket}/`
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  const path = url.slice(idx + marker.length)
  return path ? decodeURIComponent(path) : null
}

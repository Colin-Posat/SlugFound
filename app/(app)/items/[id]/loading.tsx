/**
 * Skeleton shown while the item detail Supabase fetch is in progress (US 4.1).
 * Mirrors the ItemDetail layout so the page doesn't visibly jump on load.
 */
export default function ItemDetailLoading() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      {/* Back link */}
      <div className="mb-6 h-4 w-32 animate-pulse rounded bg-surface-2" />

      {/* Image block */}
      <div className="mb-6 h-72 animate-pulse rounded-2xl border border-line bg-surface-2" />

      {/* Badges */}
      <div className="mb-4 flex gap-3">
        <div className="h-6 w-16 animate-pulse rounded bg-surface-2" />
        <div className="h-6 w-16 animate-pulse rounded bg-surface-2" />
        <div className="h-6 w-20 animate-pulse rounded bg-surface-2" />
      </div>

      {/* Title */}
      <div className="mb-2 h-8 w-2/3 animate-pulse rounded bg-surface-2" />
      <div className="mb-6 h-4 w-1/3 animate-pulse rounded bg-surface-2" />

      {/* Description card */}
      <div className="mb-8 h-32 animate-pulse rounded-2xl border border-line bg-surface-2" />

      {/* Poster card */}
      <div className="mb-8 h-20 animate-pulse rounded-2xl border border-line bg-surface-2" />

      {/* Action bar */}
      <div className="h-11 w-full animate-pulse rounded-full bg-surface-2" />
    </div>
  )
}

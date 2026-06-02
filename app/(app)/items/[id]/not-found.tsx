import Link from 'next/link'

/**
 * Rendered when getItemById returns null and the page calls notFound() (US 4.1).
 * Friendly message + links back to the listings instead of a crash.
 */
export default function ItemNotFound() {
  return (
    <div className="reveal mx-auto flex w-full max-w-3xl flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <span className="text-6xl">🔍</span>
      <h1 className="font-display text-3xl font-bold text-ink">Item not found</h1>
      <p className="max-w-sm text-sm text-muted">
        This listing may have been removed by its owner, or the link is incorrect.
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <Link
          href="/lost"
          className="rounded-full bg-gold px-5 py-2.5 text-sm font-bold text-on-gold transition hover:bg-gold-bright"
        >
          Browse lost items
        </Link>
        <Link
          href="/found"
          className="rounded-full border border-line-strong px-5 py-2.5 text-sm font-medium text-ink-soft transition hover:border-gold hover:text-ink"
        >
          Browse found items
        </Link>
      </div>
    </div>
  )
}

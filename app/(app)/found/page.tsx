import Link from 'next/link'
import ItemsFilter from '@/app/components/items-filter'
import { listItems } from '@/app/lib/items'

/**
 * Found items page (US 2.5).
 *
 * Mirror of LostPage — same fetch pattern, different `type` filter.
 */
type PageProps = {
  searchParams: Promise<{ q?: string; category?: string; location?: string; all?: string }>
}

export default async function FoundPage({ searchParams }: PageProps) {
  const { q = '', category = '', location = '', all } = await searchParams
  // "Active only" is the default; ?all=1 shows claimed/resolved too (US 4.3).
  const showAll = all === '1'

  const items = await listItems({
    type: 'found',
    search: q,
    category: category || undefined,
    location: location || undefined,
    activeOnly: !showAll,
  })

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="reveal mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold-ink">
            UCSC · Lost &amp; Found Board
          </p>
          <h1 className="mt-1 font-display text-4xl font-bold text-ink">Found Items</h1>
          <p className="mt-1 font-mono text-xs uppercase tracking-wider text-muted">
            {items.length} {items.length === 1 ? 'listing' : 'listings'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/found/photo-search"
            className="inline-flex h-10 items-center rounded-full border border-line-strong px-5 text-sm font-semibold text-ink-soft transition hover:border-gold hover:text-ink"
          >
            📷 Find by Photo
          </Link>
          <Link
            href="/create?type=found"
            className="inline-flex h-10 items-center rounded-full bg-gold px-5 text-sm font-semibold text-on-gold transition hover:bg-gold-bright"
          >
            + Report Found Item
          </Link>
        </div>
      </div>

      <ItemsFilter
        items={items}
        type="found"
        reportHref="/create?type=found"
        initialSearch={q}
        initialCategory={category}
        initialLocation={location}
        initialShowAll={showAll}
      />
    </div>
  )
}

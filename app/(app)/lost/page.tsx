import Link from 'next/link'
import ItemsFilter from '@/app/components/items-filter'
import { listItems } from '@/app/lib/items'

/**
 * Lost items page (US 2.5).
 *
 * Async server component — reads searchParams to allow URL-driven search/filter,
 * then fetches matching items from Supabase. The result is passed to ItemsFilter
 * which renders the UI and updates the URL on filter changes (re-running this
 * server component to refetch).
 */
type PageProps = {
  // Next.js 16: searchParams is a Promise — must await.
  searchParams: Promise<{ q?: string; category?: string; location?: string; all?: string }>
}

export default async function LostPage({ searchParams }: PageProps) {
  const { q = '', category = '', location = '', all } = await searchParams
  // "Active only" is the default; ?all=1 shows claimed/resolved too (US 4.3).
  const showAll = all === '1'

  const items = await listItems({
    type: 'lost',
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
          <h1 className="mt-1 font-display text-4xl font-bold text-ink">Lost Items</h1>
          <p className="mt-1 font-mono text-xs uppercase tracking-wider text-muted">
            {items.length} {items.length === 1 ? 'listing' : 'listings'}
          </p>
        </div>
        <Link
          href="/create?type=lost"
          className="inline-flex h-10 items-center rounded-full bg-gold px-5 text-sm font-semibold text-on-gold transition hover:bg-gold-bright"
        >
          + Report Lost Item
        </Link>
      </div>

      <ItemsFilter
        items={items}
        type="lost"
        reportHref="/create?type=lost"
        initialSearch={q}
        initialCategory={category}
        initialLocation={location}
        initialShowAll={showAll}
      />
    </div>
  )
}

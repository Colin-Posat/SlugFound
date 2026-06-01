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
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Lost Items</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {items.length} {items.length === 1 ? 'listing' : 'listings'}
          </p>
        </div>
        <Link
          href="/create?type=lost"
          className="inline-flex h-10 items-center rounded-full bg-yellow-400 px-5 text-sm font-semibold text-zinc-950 transition hover:bg-yellow-300"
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

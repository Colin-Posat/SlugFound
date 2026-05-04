import Link from 'next/link'
import ItemsFilter from '@/app/components/items-filter'
import { listItems } from '@/app/lib/items'

/**
 * Found items page (US 2.5).
 *
 * Mirror of LostPage — same fetch pattern, different `type` filter.
 */
type PageProps = {
  searchParams: Promise<{ q?: string; category?: string; location?: string }>
}

export default async function FoundPage({ searchParams }: PageProps) {
  const { q = '', category = '', location = '' } = await searchParams

  const items = await listItems({
    type: 'found',
    search: q,
    category: category || undefined,
    location: location || undefined,
  })

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Found Items</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {items.length} {items.length === 1 ? 'listing' : 'listings'}
          </p>
        </div>
        <Link
          href="/create?type=found"
          className="inline-flex h-10 items-center rounded-full bg-yellow-400 px-5 text-sm font-semibold text-zinc-950 transition hover:bg-yellow-300"
        >
          + Report Found Item
        </Link>
      </div>

      <ItemsFilter
        items={items}
        type="found"
        reportHref="/create?type=found"
        initialSearch={q}
        initialCategory={category}
        initialLocation={location}
      />
    </div>
  )
}

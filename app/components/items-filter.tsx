'use client'

/**
 * URL-driven filter UI for /lost and /found pages (US 2.5).
 *
 * Server flow:
 *   1. User types / clicks → we call router.replace() with new searchParams
 *   2. Next.js re-renders the server page, which re-runs listItems() against
 *      Supabase with the new ?q=, ?category=, ?location= values
 *   3. Filtered results stream back into ItemCard grid
 *
 * Search input is debounced 300ms so we don't hammer Supabase on every keystroke.
 * Category and location update immediately (single-click events).
 */

import { useEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import ItemCard from '@/app/components/item-card'
import type { Item } from '@/app/lib/definitions'

const CATEGORIES = [
  'All',
  'Electronics',
  'Clothing',
  'ID/Cards',
  'Personal Items',
  'Books',
  'Keys',
  'Water Bottle',
  'Accessories',
  'Other',
]

const LOCATIONS = [
  'McHenry Library',
  'Science & Engineering Library',
  'Baskin Engineering',
  'Cowell College',
  'Stevenson College',
  'Crown College',
  'Merrill College',
  'Kresge College',
  'Porter College',
  'Oakes College',
  'Quarry Plaza',
  'Dining Hall',
  'Bus Stop',
]

interface ItemsFilterProps {
  items: Item[]                    // pre-filtered server-side
  type: 'lost' | 'found'
  reportHref: string
  initialSearch: string
  initialCategory: string
  initialLocation: string
  initialShowAll: boolean          // false → "Active only" (default)
}

export default function ItemsFilter({
  items,
  type,
  reportHref,
  initialSearch,
  initialCategory,
  initialLocation,
  initialShowAll,
}: ItemsFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  // useTransition lets us mark the URL update as low-priority and gives us
  // an `isPending` flag we can use to dim the grid while results refresh.
  const [isPending, startTransition] = useTransition()

  // Local mirror of the search input — needed because we debounce the URL
  // update, so the visible value stays responsive while the URL lags.
  const [search, setSearch] = useState(initialSearch)
  const [activeCategory, setActiveCategory] = useState(initialCategory || 'All')
  const [activeLocation, setActiveLocation] = useState(initialLocation)
  const [showAll, setShowAll] = useState(initialShowAll)

  /**
   * Push new searchParams to the URL. Only includes keys with truthy values
   * so the URL stays clean (e.g. /lost instead of /lost?q=&category=All).
   */
  const updateUrl = (next: {
    q?: string
    category?: string
    location?: string
    all?: boolean
  }) => {
    const params = new URLSearchParams()
    if (next.q && next.q.trim()) params.set('q', next.q.trim())
    if (next.category && next.category !== 'All') params.set('category', next.category)
    if (next.location) params.set('location', next.location)
    if (next.all) params.set('all', '1')

    const qs = params.toString()
    const url = qs ? `${pathname}?${qs}` : pathname
    startTransition(() => router.replace(url, { scroll: false }))
  }

  // Debounced search — wait 300ms after the last keystroke before hitting Supabase.
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      // Only fire if the search value actually differs from the URL — avoids
      // an extra round-trip on initial mount.
      if (search !== initialSearch) {
        updateUrl({ q: search, category: activeCategory, location: activeLocation, all: showAll })
      }
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  function handleCategoryClick(cat: string) {
    setActiveCategory(cat)
    updateUrl({ q: search, category: cat, location: activeLocation, all: showAll })
  }

  function handleLocationChange(loc: string) {
    setActiveLocation(loc)
    updateUrl({ q: search, category: activeCategory, location: loc, all: showAll })
  }

  function handleToggleActiveOnly() {
    // Checkbox is "Active only", so toggling it flips showAll.
    const nextShowAll = !showAll
    setShowAll(nextShowAll)
    updateUrl({ q: search, category: activeCategory, location: activeLocation, all: nextShowAll })
  }

  function clearFilters() {
    setSearch('')
    setActiveCategory('All')
    setActiveLocation('')
    setShowAll(false)
    startTransition(() => router.replace(pathname, { scroll: false }))
  }

  const hasActiveFilters =
    search !== '' || activeCategory !== 'All' || activeLocation !== '' || showAll

  return (
    <>
      {/* Search + Location */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${type} items…`}
          className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
        />
        <select
          value={activeLocation}
          onChange={(e) => handleLocationChange(e.target.value)}
          className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-300 outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
        >
          <option value="">All locations</option>
          {LOCATIONS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        {/* Active-only toggle (default on) — hides claimed/resolved items (US 4.3) */}
        <label className="flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-300 transition-colors hover:border-zinc-500">
          <input
            type="checkbox"
            checked={!showAll}
            onChange={handleToggleActiveOnly}
            className="accent-yellow-400"
          />
          Active only
        </label>
      </div>

      {/* Category pills */}
      <div className="mb-6 flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => handleCategoryClick(cat)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
              activeCategory === cat
                ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400'
                : 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Active filter status bar */}
      {hasActiveFilters && (
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-zinc-500">
            {items.length} result{items.length !== 1 ? 's' : ''}
            {isPending && <span className="ml-2 text-zinc-600">· refreshing…</span>}
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs text-zinc-500 transition-colors hover:text-yellow-400"
          >
            Clear filters ×
          </button>
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-800 py-20 text-center">
          <span className="text-5xl">🔍</span>
          <p className="text-base font-semibold text-white">
            {hasActiveFilters ? 'No items match your filters' : `No ${type} items yet`}
          </p>
          <p className="text-sm text-zinc-500">
            {hasActiveFilters
              ? 'Try a different keyword, category, or location'
              : 'Be the first to post a listing'}
          </p>
          <div className="mt-2 flex gap-3">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-400 transition hover:border-zinc-500 hover:text-white"
              >
                Clear filters
              </button>
            )}
            <Link
              href={reportHref}
              className="rounded-full bg-yellow-400 px-4 py-2 text-sm font-bold text-zinc-950 transition hover:bg-yellow-300"
            >
              {type === 'lost' ? 'Report a lost item' : 'Report a found item'}
            </Link>
          </div>
        </div>
      ) : (
        <div
          className={`grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 transition-opacity ${
            isPending ? 'opacity-60' : ''
          }`}
        >
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </>
  )
}

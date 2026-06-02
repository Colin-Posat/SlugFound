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
import ItemsMapDynamic from '@/app/components/items-map-dynamic'
import { geotaggedItems } from '@/app/lib/geo'
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

const INPUT_CLS =
  'rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-ink placeholder-muted outline-none focus:border-gold focus:ring-1 focus:ring-gold'

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
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')

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
          className={`flex-1 ${INPUT_CLS}`}
        />
        <select
          value={activeLocation}
          onChange={(e) => handleLocationChange(e.target.value)}
          className={`${INPUT_CLS} text-ink-soft`}
        >
          <option value="">All locations</option>
          {LOCATIONS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        {/* Active-only toggle (default on) — hides claimed/resolved items (US 4.3) */}
        <label className="flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-ink-soft transition-colors hover:border-line-strong">
          <input
            type="checkbox"
            checked={!showAll}
            onChange={handleToggleActiveOnly}
            className="accent-gold"
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
                ? 'border-gold bg-gold-soft text-gold-ink'
                : 'border-line text-ink-soft hover:border-line-strong hover:text-ink'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Active filter status bar */}
      {hasActiveFilters && (
        <div className="mb-4 flex items-center justify-between">
          <p className="font-mono text-xs text-muted">
            {items.length} result{items.length !== 1 ? 's' : ''}
            {isPending && <span className="ml-2">· refreshing…</span>}
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs text-muted transition-colors hover:text-gold-ink"
          >
            Clear filters ×
          </button>
        </div>
      )}

      {/* View toggle + (map) geotag info bar */}
      <div className="mb-4 flex items-center justify-between gap-3">
        {viewMode === 'map' ? (
          <p className="font-mono text-xs text-muted">
            Showing {geotaggedItems(items).length} of {items.length}{' '}
            {items.length === 1 ? 'item' : 'items'} on the map
          </p>
        ) : (
          <span />
        )}
        <div className="flex shrink-0 rounded-xl border border-line bg-surface p-1">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-gold-soft text-ink'
                : 'text-muted hover:text-ink'
            }`}
          >
            List
          </button>
          <button
            type="button"
            onClick={() => setViewMode('map')}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
              viewMode === 'map'
                ? 'bg-gold-soft text-ink'
                : 'text-muted hover:text-ink'
            }`}
          >
            Map
          </button>
        </div>
      </div>

      {/* Content: map, empty state, or grid */}
      {viewMode === 'map' ? (
        <ItemsMapDynamic items={items} />
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line-strong py-20 text-center">
          <span className="text-5xl">🔍</span>
          <p className="font-display text-lg font-semibold text-ink">
            {hasActiveFilters ? 'No items match your filters' : `No ${type} items yet`}
          </p>
          <p className="text-sm text-muted">
            {hasActiveFilters
              ? 'Try a different keyword, category, or location'
              : 'Be the first to post a listing'}
          </p>
          <div className="mt-2 flex gap-3">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-full border border-line-strong px-4 py-2 text-sm text-ink-soft transition hover:border-gold hover:text-ink"
              >
                Clear filters
              </button>
            )}
            <Link
              href={reportHref}
              className="rounded-full bg-gold px-4 py-2 text-sm font-bold text-on-gold transition hover:bg-gold-bright"
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
          {items.map((item, i) => (
            <ItemCard key={item.id} item={item} className={`reveal reveal-${(i % 6) + 1}`} />
          ))}
        </div>
      )}
    </>
  )
}

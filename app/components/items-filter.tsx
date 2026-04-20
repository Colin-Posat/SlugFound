'use client'

import { useState } from 'react'
import Link from 'next/link'
import ItemCard from '@/app/components/item-card'
import type { Item } from '@/app/lib/definitions'

const CATEGORIES = ['All', 'Electronics', 'Clothing', 'ID / Cards', 'Personal Items', 'Books', 'Keys']

const LOCATIONS = [
  'McHenry Library',
  'Science & Engineering Library',
  'Baskin Engineering',
  'Cowell College',
  'Stevenson College',
  'Crown College',
  'Merrill College',
  'Kresge',
  'Porter College',
  'Oakes',
  'Quarry Plaza',
  'Dining Hall',
  'Bus Stop',
]

interface ItemsFilterProps {
  items: readonly Item[]
  type: 'lost' | 'found'
  reportHref: string
}

export default function ItemsFilter({ items, type, reportHref }: ItemsFilterProps) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [activeLocation, setActiveLocation] = useState('')

  const filtered = items.filter((item) => {
    const query = search.toLowerCase()
    const matchesSearch =
      !query ||
      item.title.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query)
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory
    const matchesLocation =
      !activeLocation || item.location.toLowerCase().includes(activeLocation.toLowerCase())
    return matchesSearch && matchesCategory && matchesLocation
  })

  const hasActiveFilters = search !== '' || activeCategory !== 'All' || activeLocation !== ''

  function clearFilters() {
    setSearch('')
    setActiveCategory('All')
    setActiveLocation('')
  }

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
          onChange={(e) => setActiveLocation(e.target.value)}
          className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-300 outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
        >
          <option value="">All locations</option>
          {LOCATIONS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>

      {/* Category pills */}
      <div className="mb-6 flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
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
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
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
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-800 py-20 text-center">
          <span className="text-5xl">🔍</span>
          <p className="text-base font-semibold text-white">No items match your filters</p>
          <p className="text-sm text-zinc-500">
            Try a different keyword, category, or location
          </p>
          <div className="mt-2 flex gap-3">
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-400 transition hover:border-zinc-500 hover:text-white"
            >
              Clear filters
            </button>
            <Link
              href={reportHref}
              className="rounded-full bg-yellow-400 px-4 py-2 text-sm font-bold text-zinc-950 transition hover:bg-yellow-300"
            >
              Report this item
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </>
  )
}

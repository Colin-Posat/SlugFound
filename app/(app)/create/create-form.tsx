'use client'

import { useState } from 'react'
import Link from 'next/link'

const CATEGORIES = [
  'Electronics', 'Clothing', 'ID / Cards', 'Keys', 'Books',
  'Personal Items', 'Jewelry', 'Sports / Recreation', 'Other',
]

const LOCATIONS = [
  'McHenry Library', 'Science & Engineering Library', 'Baskin Engineering',
  'Cowell College', 'Stevenson College', 'Crown College', 'Merrill College',
  'Kresge College', 'Porter College', 'Oakes College', 'Rachel Carson College',
  'Quarry Plaza', 'Dining Hall (Unspecified)', 'Bus Stop', 'Other',
]

const INPUT_CLS =
  'rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400'

const SELECT_CLS =
  'rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-300 outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400'

interface CreateFormProps {
  initialType: 'lost' | 'found'
}

export default function CreateForm({ initialType }: CreateFormProps) {
  const [type, setType] = useState<'lost' | 'found'>(initialType)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const backHref = type === 'found' ? '/found' : '/lost'

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      {/* Page header */}
      <div className="mb-8">
        <Link
          href={backHref}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-600 transition-colors hover:text-zinc-300"
        >
          ← Back
        </Link>
        <h1 className="text-3xl font-bold text-white">Create a listing</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Help the UCSC community recover lost items.
        </p>
      </div>

      {/* ⚠️ TODO: Wire a `createListing` server action to this form.
           The submit button currently does nothing — the form has no action prop.
           Steps: create app/actions/listings.ts → validate with Zod → insert into DB
                  → redirect to the new listing page */}
      <form className="flex flex-col gap-5">
        {/* ── Section 1: What happened ── */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-1 text-sm font-semibold text-white">What happened?</h2>
          <p className="mb-4 text-xs text-zinc-500">
            Tell us whether you lost or found an item.
          </p>
          <div className="flex rounded-xl border border-zinc-700 bg-zinc-950 p-1">
            <button
              type="button"
              onClick={() => setType('lost')}
              className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors ${
                type === 'lost'
                  ? 'bg-red-500/20 text-red-400'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              I lost something
            </button>
            <button
              type="button"
              onClick={() => setType('found')}
              className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors ${
                type === 'found'
                  ? 'bg-green-500/20 text-green-400'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              I found something
            </button>
          </div>

          {type === 'found' && (
            <p className="mt-3 rounded-xl border border-yellow-400/20 bg-yellow-400/5 px-4 py-3 text-sm text-yellow-300">
              <span className="font-semibold">Tip:</span> The owner will contact you through
              SlugFound — you don&apos;t need to share personal contact info.
            </p>
          )}
        </div>

        {/* ── Section 2: About the item ── */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-1 text-sm font-semibold text-white">About the item</h2>
          <p className="mb-5 text-xs text-zinc-500">
            Describe it clearly so the right person can identify it.
          </p>

          <div className="flex flex-col gap-5">
            {/* Item name */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="title" className="text-sm font-medium text-zinc-300">
                Item name
              </label>
              <input
                id="title"
                name="title"
                type="text"
                placeholder={
                  type === 'lost' ? 'e.g. AirPods Pro, Blue Jacket…' : 'e.g. iPhone 14, Brown Wallet…'
                }
                className={INPUT_CLS}
              />
            </div>

            {/* Category + Location */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="category" className="text-sm font-medium text-zinc-300">
                  Category
                </label>
                <select id="category" name="category" className={SELECT_CLS}>
                  <option value="">Select a category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="location" className="text-sm font-medium text-zinc-300">
                  Location on campus
                </label>
                <select id="location" name="location" className={SELECT_CLS}>
                  <option value="">Select a location</option>
                  {LOCATIONS.map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="date" className="text-sm font-medium text-zinc-300">
                {type === 'lost' ? 'Date lost' : 'Date found'}
              </label>
              <input
                id="date"
                name="date"
                type="date"
                className={SELECT_CLS}
              />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="description" className="text-sm font-medium text-zinc-300">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                placeholder="Describe the item — color, brand, identifying marks, exact location…"
                className={`resize-none ${INPUT_CLS}`}
              />
            </div>
          </div>
        </div>

        {/* ── Section 3: Photo ── */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-1 text-sm font-semibold text-white">
            Photo{' '}
            <span className="font-normal text-zinc-600">(optional)</span>
          </h2>
          <p className="mb-4 text-xs text-zinc-500">
            A clear photo helps the owner identify their item instantly.
          </p>

          {selectedFile ? (
            <div className="flex items-center justify-between rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🖼️</span>
                <div>
                  <p className="text-sm font-medium text-white">{selectedFile.name}</p>
                  <p className="text-xs text-zinc-500">
                    {(selectedFile.size / 1024).toFixed(0)} KB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="text-sm text-zinc-600 transition-colors hover:text-red-400"
              >
                Remove
              </button>
            </div>
          ) : (
            <label
              htmlFor="photo"
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 bg-zinc-950 py-10 text-center transition hover:border-yellow-400/50 hover:bg-zinc-900"
            >
              <span className="text-3xl">📷</span>
              <span className="text-sm text-zinc-400">Click to upload a photo</span>
              <span className="text-xs text-zinc-600">PNG, JPG up to 10 MB</span>
              <input
                id="photo"
                name="photo"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              />
            </label>
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            className="flex-1 rounded-full bg-yellow-400 py-2.5 text-sm font-bold text-zinc-950 transition hover:bg-yellow-300"
          >
            {type === 'lost' ? 'Post Lost Item' : 'Post Found Item'}
          </button>
          <Link
            href={backHref}
            className="flex items-center justify-center rounded-full border border-zinc-700 px-5 text-sm font-medium text-zinc-400 transition hover:border-zinc-500 hover:text-white"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}

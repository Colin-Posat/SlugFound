'use client'

import { useState } from 'react'
import Link from 'next/link'

const categories = ['Electronics', 'Clothing', 'ID / Cards', 'Keys', 'Books', 'Personal Items', 'Jewelry', 'Sports / Recreation', 'Other']

const locations = ['McHenry Library', 'Science & Engineering Library', 'Baskin Engineering', 'Cowell College', 'Stevenson College', 'Crown College', 'Merrill College', 'Kresge College', 'Porter College', 'Oakes College', 'Rachel Carson College', 'Quarry Plaza', 'Dining Hall (Unspecified)', 'Bus Stop', 'Other']

export default function CreatePage() {
  const [type, setType] = useState<'lost' | 'found'>('lost')

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <div className="mb-8">
        <Link href="/lost" className="mb-4 inline-block text-sm text-zinc-600 hover:text-zinc-300 transition-colors">
          ← Back
        </Link>
        <h1 className="text-3xl font-bold text-white">Create a listing</h1>
        <p className="mt-1 text-sm text-zinc-400">Help the UCSC community recover lost items.</p>
      </div>

      <form className="flex flex-col gap-6">
        {/* Type toggle */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-zinc-300">Listing type</label>
          <div className="flex rounded-xl border border-zinc-700 bg-zinc-900 p-1">
            <button type="button" onClick={() => setType('lost')} className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors ${type === 'lost' ? 'bg-red-500/20 text-red-400' : 'text-zinc-500 hover:text-zinc-300'}`}>
              I lost something
            </button>
            <button type="button" onClick={() => setType('found')} className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors ${type === 'found' ? 'bg-green-500/20 text-green-400' : 'text-zinc-500 hover:text-zinc-300'}`}>
              I found something
            </button>
          </div>
        </div>

        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="title" className="text-sm font-medium text-zinc-300">Item name</label>
          <input id="title" name="title" type="text" placeholder={type === 'lost' ? 'e.g. AirPods Pro, Blue Jacket…' : 'e.g. iPhone 14, Brown Wallet…'} className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400" />
        </div>

        {/* Category + Location */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="category" className="text-sm font-medium text-zinc-300">Category</label>
            <select id="category" name="category" className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-300 outline-none focus:border-yellow-400">
              <option value="">Select a category</option>
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="location" className="text-sm font-medium text-zinc-300">Location on campus</label>
            <select id="location" name="location" className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-300 outline-none focus:border-yellow-400">
              <option value="">Select a location</option>
              {locations.map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>
        </div>

        {/* Date */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="date" className="text-sm font-medium text-zinc-300">{type === 'lost' ? 'Date lost' : 'Date found'}</label>
          <input id="date" name="date" type="date" className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-300 outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400" />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="description" className="text-sm font-medium text-zinc-300">Description</label>
          <textarea id="description" name="description" rows={4} placeholder="Describe the item — color, brand, identifying marks, exact location…" className="resize-none rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400" />
        </div>

        {/* Photo upload */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-300">
            Photo <span className="text-zinc-600">(optional)</span>
          </label>
          <label htmlFor="photo" className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 bg-zinc-900 py-10 text-center transition hover:border-yellow-400/50 hover:bg-zinc-800">
            <span className="text-3xl">📷</span>
            <span className="text-sm text-zinc-400">Click to upload a photo</span>
            <span className="text-xs text-zinc-600">PNG, JPG up to 10MB</span>
            <input id="photo" name="photo" type="file" accept="image/*" className="sr-only" />
          </label>
        </div>

        {type === 'found' && (
          <div className="rounded-xl border border-yellow-400/20 bg-yellow-400/5 px-4 py-3 text-sm text-yellow-300">
            <span className="font-semibold">Tip:</span> The item owner will contact you through SlugFound. You don&apos;t need to share personal contact info.
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="submit" className="flex-1 rounded-full bg-yellow-400 py-2.5 text-sm font-bold text-zinc-950 transition hover:bg-yellow-300">
            {type === 'lost' ? 'Post Lost Item' : 'Post Found Item'}
          </button>
          <Link href="/lost" className="flex items-center justify-center rounded-full border border-zinc-700 px-5 text-sm font-medium text-zinc-400 transition hover:border-zinc-500 hover:text-white">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}

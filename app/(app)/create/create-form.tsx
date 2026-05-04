'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { createItem } from '@/app/actions/items'
import type { CreateItemFormState } from '@/app/lib/item-schemas'
import { ITEM_CATEGORIES, UCSC_LOCATIONS } from '@/app/lib/definitions'

const INPUT_CLS =
  'rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400'

const SELECT_CLS =
  'rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-300 outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400'

interface CreateFormProps {
  initialType: 'lost' | 'found'
}

export default function CreateForm({ initialType }: CreateFormProps) {
  // useActionState wires the form to the createItem server action; on success
  // it redirects, so we only get a return value when there's an error.
  const [state, action, pending] = useActionState<CreateItemFormState, FormData>(
    createItem,
    undefined,
  )

  const [type, setType] = useState<'lost' | 'found'>(initialType)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  // We track the file as both a controlled state (for preview) and a hidden
  // input ref so the FormData submitted to the server still includes it.

  const backHref = type === 'found' ? '/found' : '/lost'

  // Surface server-level errors as toasts (per-field errors render inline below)
  if (state?.message) {
    toast.error(state.message)
  }

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

      <form action={action} className="flex flex-col gap-5">
        {/* Hidden type field driven by the toggle below */}
        <input type="hidden" name="type" value={type} />

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
                required
                placeholder={
                  type === 'lost'
                    ? 'e.g. AirPods Pro, Blue Jacket…'
                    : 'e.g. iPhone 14, Brown Wallet…'
                }
                className={INPUT_CLS}
              />
              {state?.errors?.title && (
                <p className="text-xs text-red-400">{state.errors.title[0]}</p>
              )}
            </div>

            {/* Category + Location */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="category" className="text-sm font-medium text-zinc-300">
                  Category
                </label>
                <select id="category" name="category" required defaultValue="" className={SELECT_CLS}>
                  <option value="" disabled>Select a category</option>
                  {ITEM_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {state?.errors?.category && (
                  <p className="text-xs text-red-400">{state.errors.category[0]}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="location" className="text-sm font-medium text-zinc-300">
                  Location on campus
                </label>
                <select id="location" name="location" required defaultValue="" className={SELECT_CLS}>
                  <option value="" disabled>Select a location</option>
                  {UCSC_LOCATIONS.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
                {state?.errors?.location && (
                  <p className="text-xs text-red-400">{state.errors.location[0]}</p>
                )}
              </div>
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
                required
                placeholder="Describe the item — color, brand, identifying marks, exact location…"
                className={`resize-none ${INPUT_CLS}`}
              />
              {state?.errors?.description && (
                <p className="text-xs text-red-400">{state.errors.description[0]}</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Section 3: Photo ── */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-1 text-sm font-semibold text-white">
            Photo <span className="font-normal text-zinc-600">(optional)</span>
          </h2>
          <p className="mb-4 text-xs text-zinc-500">
            A clear photo helps the owner identify their item instantly. Max 5 MB · JPG, PNG, WebP.
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
              <span className="text-xs text-zinc-600">PNG, JPG, WebP up to 5 MB</span>
            </label>
          )}

          {/* The actual file input — always rendered so its value is included in
              the FormData submission. We hide it when the preview card is shown. */}
          <input
            id="photo"
            name="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
          />

          {state?.errors?.photo && (
            <p className="mt-2 text-xs text-red-400">{state.errors.photo[0]}</p>
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={pending}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-yellow-400 py-2.5 text-sm font-bold text-zinc-950 transition hover:bg-yellow-300 disabled:opacity-50"
          >
            {pending ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
                Posting…
              </>
            ) : (
              type === 'lost' ? 'Post Lost Item' : 'Post Found Item'
            )}
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

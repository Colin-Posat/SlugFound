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

// Applied on top of INPUT_CLS / SELECT_CLS for any field that was filled in
// by the AI scan. The blue border lets the user spot which values they may
// want to double-check before posting.
const AI_HIGHLIGHT_CLS = 'border-blue-400 border-2'

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

  // Controlled state for the AI-fillable fields. We keep the `name` attribute
  // on each input so FormData still picks them up on submit.
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')

  // Tracks which fields were populated by the most recent AI scan so we can
  // highlight them. A field is removed from the set the moment the user
  // edits it manually.
  const [aiFilledFields, setAiFilledFields] = useState<Set<string>>(new Set())
  const [isScanning, setIsScanning] = useState(false)

  const backHref = type === 'found' ? '/found' : '/lost'

  // Surface server-level errors as toasts (per-field errors render inline below)
  if (state?.message) {
    toast.error(state.message)
  }

  /**
   * Remove a field from the AI-filled highlight set. Called whenever the
   * user manually edits the field — at that point the value is theirs, not
   * the model's, and the blue border should go away.
   */
  function clearAiFilled(field: string) {
    setAiFilledFields((prev) => {
      if (!prev.has(field)) return prev
      const next = new Set(prev)
      next.delete(field)
      return next
    })
  }

  /**
   * Read a File as a base64 string (no `data:` prefix). FileReader returns a
   * data URL, so we strip the prefix before sending the payload to the API.
   */
  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result
        if (typeof result !== 'string') {
          reject(new Error('Unexpected FileReader result'))
          return
        }
        // result looks like: data:image/png;base64,iVBORw0KG...
        const comma = result.indexOf(',')
        resolve(comma >= 0 ? result.slice(comma + 1) : result)
      }
      reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'))
      reader.readAsDataURL(file)
    })
  }

  async function handleAiScan() {
    if (!selectedFile || isScanning) return
    setIsScanning(true)
    try {
      const base64 = await fileToBase64(selectedFile)
      const res = await fetch('/api/ai/scan-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mimeType: selectedFile.type }),
      })

      if (!res.ok) {
        throw new Error(`Scan failed (${res.status})`)
      }

      const data: {
        title?: string
        category?: string
        description?: string
      } = await res.json()

      const filled = new Set<string>()
      if (typeof data.title === 'string' && data.title.length > 0) {
        setTitle(data.title)
        filled.add('title')
      }
      if (typeof data.category === 'string' && data.category.length > 0) {
        setCategory(data.category)
        filled.add('category')
      }
      if (typeof data.description === 'string' && data.description.length > 0) {
        setDescription(data.description)
        filled.add('description')
      }
      setAiFilledFields(filled)
    } catch {
      toast.error('AI scan failed — please fill in the fields manually')
    } finally {
      setIsScanning(false)
    }
  }

  const titleCls = `${INPUT_CLS}${aiFilledFields.has('title') ? ` ${AI_HIGHLIGHT_CLS}` : ''}`
  const categoryCls = `${SELECT_CLS}${aiFilledFields.has('category') ? ` ${AI_HIGHLIGHT_CLS}` : ''}`
  const descriptionCls = `resize-none ${INPUT_CLS}${
    aiFilledFields.has('description') ? ` ${AI_HIGHLIGHT_CLS}` : ''
  }`

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

      <form action={action} className="relative flex flex-col gap-5">
        {/* Disable all inputs while the AI scan is in flight. <fieldset disabled>
            does this in one line and is more bulletproof than wiring `disabled`
            into every input. */}
        <fieldset
          disabled={isScanning}
          className="contents"
        >
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
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value)
                    clearAiFilled('title')
                  }}
                  placeholder={
                    type === 'lost'
                      ? 'e.g. AirPods Pro, Blue Jacket…'
                      : 'e.g. iPhone 14, Brown Wallet…'
                  }
                  className={titleCls}
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
                  <select
                    id="category"
                    name="category"
                    required
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value)
                      clearAiFilled('category')
                    }}
                    className={categoryCls}
                  >
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
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value)
                    clearAiFilled('description')
                  }}
                  placeholder="Describe the item — color, brand, identifying marks, exact location…"
                  className={descriptionCls}
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

            {/* AI scan trigger — sits right under the drop zone and is disabled
                until a photo is selected. type="button" so it never submits. */}
            <button
              type="button"
              onClick={handleAiScan}
              disabled={!selectedFile || isScanning}
              className="mt-3 inline-flex items-center justify-center gap-2 rounded-full border border-blue-400/40 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-300 transition hover:border-blue-400 hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span aria-hidden="true">✨</span>
              {isScanning ? 'Scanning…' : 'Scan with AI'}
            </button>

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
        </fieldset>

        {/* Scanning overlay — absolutely positioned over the form. We only
            mount it while scanning so it doesn't intercept clicks otherwise. */}
        {isScanning && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-zinc-950/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/90 px-8 py-6 shadow-2xl">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
              <p className="text-sm font-medium text-zinc-200">Analyzing your photo…</p>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}

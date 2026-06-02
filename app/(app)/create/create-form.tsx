'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { createItem } from '@/app/actions/items'
import type { CreateItemFormState } from '@/app/lib/item-schemas'
import { ITEM_CATEGORIES } from '@/app/lib/definitions'
import LocationMapPicker, {
  type MapLocation,
} from '@/app/components/location-map-picker-dynamic'

const INPUT_CLS =
  'rounded-xl border border-line-strong bg-surface-2 px-4 py-2.5 text-sm text-ink placeholder-muted outline-none transition focus:border-gold focus:ring-1 focus:ring-gold'

const SELECT_CLS =
  'rounded-xl border border-line-strong bg-surface-2 px-4 py-2.5 text-sm text-ink-soft outline-none focus:border-gold focus:ring-1 focus:ring-gold'

// Applied on top of INPUT_CLS / SELECT_CLS for any field that was filled in
// by the AI scan. The blue border lets the user spot which values they may
// want to double-check before posting.
const AI_HIGHLIGHT_CLS = 'border-claimed border-2'

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
  const [mapLocation, setMapLocation] = useState<MapLocation | null>(null)
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
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
        >
          ← Back
        </Link>
        <h1 className="text-3xl font-bold text-ink">Create a listing</h1>
        <p className="mt-1 text-sm text-muted">
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
          <div className="rounded-2xl border border-line bg-surface p-6">
            <h2 className="mb-1 text-sm font-semibold text-ink">What happened?</h2>
            <p className="mb-4 text-xs text-muted">
              Tell us whether you lost or found an item.
            </p>
            <div className="flex rounded-xl border border-line-strong bg-paper p-1">
              <button
                type="button"
                onClick={() => setType('lost')}
                className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors ${
                  type === 'lost'
                    ? 'bg-lost-soft text-lost'
                    : 'text-muted hover:text-ink'
                }`}
              >
                I lost something
              </button>
              <button
                type="button"
                onClick={() => setType('found')}
                className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors ${
                  type === 'found'
                    ? 'bg-found-soft text-found'
                    : 'text-muted hover:text-ink'
                }`}
              >
                I found something
              </button>
            </div>

            {type === 'found' && (
              <p className="mt-3 rounded-xl border border-gold/40 bg-gold-soft px-4 py-3 text-sm text-gold-ink">
                <span className="font-semibold">Tip:</span> The owner will contact you through
                SlugFound — you don&apos;t need to share personal contact info.
              </p>
            )}
          </div>

          {/* ── Section 2: About the item ── */}
          <div className="rounded-2xl border border-line bg-surface p-6">
            <h2 className="mb-1 text-sm font-semibold text-ink">About the item</h2>
            <p className="mb-5 text-xs text-muted">
              Describe it clearly so the right person can identify it.
            </p>

            <div className="flex flex-col gap-5">
              {/* Item name */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="title" className="text-sm font-medium text-ink-soft">
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
                  <p className="text-xs text-lost">{state.errors.title[0]}</p>
                )}
              </div>

              {/* Category */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="category" className="text-sm font-medium text-ink-soft">
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
                  <p className="text-xs text-lost">{state.errors.category[0]}</p>
                )}
              </div>

              {/* Location map picker */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-ink-soft">
                  Location on campus
                </label>
                <p className="text-xs text-muted">
                  Click a preset marker or tap anywhere on the map to pin the exact spot.
                </p>

                {/* Hidden inputs carry map state into FormData for the server action */}
                <input type="hidden" name="location" value={mapLocation?.label ?? ''} />
                <input type="hidden" name="lat"      value={mapLocation?.lat  ?? ''} />
                <input type="hidden" name="lng"      value={mapLocation?.lng  ?? ''} />

                <LocationMapPicker value={mapLocation} onChange={setMapLocation} />

                {mapLocation && (
                  <p className="text-xs text-gold-ink">
                    📍 {mapLocation.label}
                    {mapLocation.label === 'Other' &&
                      ` (${mapLocation.lat.toFixed(5)}, ${mapLocation.lng.toFixed(5)})`}
                  </p>
                )}
                {state?.errors?.location && (
                  <p className="text-xs text-lost">{state.errors.location[0]}</p>
                )}
                {state?.errors?.lat && (
                  <p className="text-xs text-lost">{state.errors.lat[0]}</p>
                )}
                {state?.errors?.lng && (
                  <p className="text-xs text-lost">{state.errors.lng[0]}</p>
                )}
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="description" className="text-sm font-medium text-ink-soft">
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
                  <p className="text-xs text-lost">{state.errors.description[0]}</p>
                )}
              </div>
            </div>
          </div>

          {/* ── Section 3: Photo ── */}
          <div className="rounded-2xl border border-line bg-surface p-6">
            <h2 className="mb-1 text-sm font-semibold text-ink">
              Photo <span className="font-normal text-muted">(optional)</span>
            </h2>
            <p className="mb-4 text-xs text-muted">
              A clear photo helps the owner identify their item instantly. Max 5 MB · JPG, PNG, WebP.
            </p>

            {selectedFile ? (
              <div className="flex items-center justify-between rounded-xl border border-line-strong bg-surface-2 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🖼️</span>
                  <div>
                    <p className="text-sm font-medium text-ink">{selectedFile.name}</p>
                    <p className="text-xs text-muted">
                      {(selectedFile.size / 1024).toFixed(0)} KB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="text-sm text-muted transition-colors hover:text-lost"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label
                htmlFor="photo"
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line-strong bg-paper py-10 text-center transition hover:border-gold hover:bg-surface-2"
              >
                <span className="text-3xl">📷</span>
                <span className="text-sm text-muted">Click to upload a photo</span>
                <span className="text-xs text-muted">PNG, JPG, WebP up to 5 MB</span>
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
              className="mt-3 inline-flex items-center justify-center gap-2 rounded-full border border-claimed/40 bg-claimed-soft px-4 py-2 text-sm font-semibold text-claimed transition hover:border-claimed hover:bg-claimed-soft disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span aria-hidden="true">✨</span>
              {isScanning ? 'Scanning…' : 'Scan with AI'}
            </button>

            {state?.errors?.photo && (
              <p className="mt-2 text-xs text-lost">{state.errors.photo[0]}</p>
            )}
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={pending}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-gold py-2.5 text-sm font-bold text-on-gold transition hover:bg-gold-bright disabled:opacity-50"
            >
              {pending ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink border-t-transparent" />
                  Posting…
                </>
              ) : (
                type === 'lost' ? 'Post Lost Item' : 'Post Found Item'
              )}
            </button>
            <Link
              href={backHref}
              className="flex items-center justify-center rounded-full border border-line-strong px-5 text-sm font-medium text-muted transition hover:border-gold hover:text-ink"
            >
              Cancel
            </Link>
          </div>
        </fieldset>

        {/* Scanning overlay — absolutely positioned over the form. We only
            mount it while scanning so it doesn't intercept clicks otherwise. */}
        {isScanning && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-paper/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-surface px-8 py-6 shadow-2xl">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-claimed border-t-transparent" />
              <p className="text-sm font-medium text-ink">Analyzing your photo…</p>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}

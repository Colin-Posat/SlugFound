'use client'

/**
 * Edit listing form (US 4.2).
 *
 * Pre-populated from the existing item. Mirrors the create form's fields and
 * styling (minus the AI scan). Submitting calls the `updateItem` server action
 * bound to this item's id; the Delete button opens a confirmation modal wired
 * to `deleteItem`.
 */

import { useActionState, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { updateItem, deleteItem } from '@/app/actions/items'
import type { UpdateItemFormState } from '@/app/lib/item-schemas'
import { ITEM_CATEGORIES } from '@/app/lib/definitions'
import type { Item } from '@/app/lib/definitions'
import LocationMapPicker, {
  type MapLocation,
} from '@/app/components/location-map-picker-dynamic'

const INPUT_CLS =
  'rounded-xl border border-line-strong bg-surface-2 px-4 py-2.5 text-sm text-ink placeholder-muted outline-none transition focus:border-gold focus:ring-1 focus:ring-gold'

const SELECT_CLS =
  'rounded-xl border border-line-strong bg-surface-2 px-4 py-2.5 text-sm text-ink-soft outline-none focus:border-gold focus:ring-1 focus:ring-gold'

interface EditFormProps {
  item: Item
}

export default function EditForm({ item }: EditFormProps) {
  const router = useRouter()

  const updateWithId = updateItem.bind(null, item.id)
  const [state, action, pending] = useActionState<UpdateItemFormState, FormData>(
    updateWithId,
    undefined,
  )

  const [type, setType] = useState<'lost' | 'found'>(item.type)
  const [title, setTitle] = useState(item.title)
  const [category, setCategory] = useState(item.category)
  const [description, setDescription] = useState(item.description)

  // Seed the map pin from existing coordinates when present.
  const [mapLocation, setMapLocation] = useState<MapLocation | null>(
    item.lat !== null && item.lng !== null
      ? { lat: item.lat, lng: item.lng, label: item.location }
      : null,
  )

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, startDelete] = useTransition()

  const backHref = `/items/${item.id}`

  // Server-level errors surface as toasts; field errors render inline.
  if (state?.message) {
    toast.error(state.message)
  }

  function handleDelete() {
    startDelete(async () => {
      const result = await deleteItem(item.id)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success('Listing deleted')
      router.push(item.type === 'lost' ? '/lost' : '/found')
    })
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <div className="mb-8">
        <Link
          href={backHref}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
        >
          ← Back to listing
        </Link>
        <h1 className="text-3xl font-bold text-ink">Edit listing</h1>
        <p className="mt-1 text-sm text-muted">Update your post or remove it entirely.</p>
      </div>

      <form action={action} className="flex flex-col gap-5">
        {/* Lost / found toggle */}
        <div className="rounded-2xl border border-line bg-surface p-6">
          <h2 className="mb-4 text-sm font-semibold text-ink">Listing type</h2>
          <input type="hidden" name="type" value={type} />
          <div className="flex rounded-xl border border-line-strong bg-paper p-1">
            <button
              type="button"
              onClick={() => setType('lost')}
              className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors ${
                type === 'lost' ? 'bg-lost-soft text-lost' : 'text-muted hover:text-ink'
              }`}
            >
              Lost
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
              Found
            </button>
          </div>
        </div>

        {/* About the item */}
        <div className="rounded-2xl border border-line bg-surface p-6">
          <h2 className="mb-5 text-sm font-semibold text-ink">About the item</h2>

          <div className="flex flex-col gap-5">
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
                onChange={(e) => setTitle(e.target.value)}
                className={INPUT_CLS}
              />
              {state?.errors?.title && (
                <p className="text-xs text-lost">{state.errors.title[0]}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="category" className="text-sm font-medium text-ink-soft">
                Category
              </label>
              <select
                id="category"
                name="category"
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={SELECT_CLS}
              >
                <option value="" disabled>
                  Select a category
                </option>
                {ITEM_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {state?.errors?.category && (
                <p className="text-xs text-lost">{state.errors.category[0]}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink-soft">Location on campus</label>
              <p className="text-xs text-muted">
                Click a preset marker or tap the map to move the pin.
              </p>

              {/* Hidden inputs carry map state; fall back to the original values
                  when the map isn't touched so existing data is preserved. */}
              <input
                type="hidden"
                name="location"
                value={mapLocation?.label ?? item.location}
              />
              <input type="hidden" name="lat" value={mapLocation?.lat ?? item.lat ?? ''} />
              <input type="hidden" name="lng" value={mapLocation?.lng ?? item.lng ?? ''} />

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
            </div>

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
                onChange={(e) => setDescription(e.target.value)}
                className={`resize-none ${INPUT_CLS}`}
              />
              {state?.errors?.description && (
                <p className="text-xs text-lost">{state.errors.description[0]}</p>
              )}
            </div>
          </div>
        </div>

        {/* Photo */}
        <div className="rounded-2xl border border-line bg-surface p-6">
          <h2 className="mb-1 text-sm font-semibold text-ink">
            Photo <span className="font-normal text-muted">(optional)</span>
          </h2>
          <p className="mb-4 text-xs text-muted">
            Upload a new photo to replace the current one. Max 5 MB · JPG, PNG, WebP.
          </p>

          {selectedFile ? (
            <div className="flex items-center justify-between rounded-xl border border-line-strong bg-surface-2 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🖼️</span>
                <div>
                  <p className="text-sm font-medium text-ink">{selectedFile.name}</p>
                  <p className="text-xs text-muted">
                    {(selectedFile.size / 1024).toFixed(0)} KB · new
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
          ) : item.image_url ? (
            <div className="flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.image_url}
                alt={item.title}
                className="h-16 w-16 rounded-xl border border-line-strong object-cover"
              />
              <label
                htmlFor="photo"
                className="cursor-pointer rounded-full border border-line-strong px-4 py-2 text-sm text-ink-soft transition hover:border-gold hover:text-ink"
              >
                Replace photo
              </label>
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

          <input
            id="photo"
            name="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
          />

          {state?.errors?.photo && (
            <p className="mt-2 text-xs text-lost">{state.errors.photo[0]}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 pt-1">
          <button
            type="submit"
            disabled={pending}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-gold py-2.5 text-sm font-bold text-on-gold transition hover:bg-gold-bright disabled:opacity-50"
          >
            {pending ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink border-t-transparent" />
                Saving…
              </>
            ) : (
              'Save changes'
            )}
          </button>
          <Link
            href={backHref}
            className="flex items-center justify-center rounded-full border border-line-strong px-5 text-sm font-medium text-muted transition hover:border-gold hover:text-ink"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center justify-center rounded-full border border-lost/30 px-5 py-2.5 text-sm font-medium text-lost transition hover:border-lost/60 hover:text-lost"
          >
            Delete
          </button>
        </div>
      </form>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-ink">Delete this listing?</h3>
            <p className="mt-2 text-sm text-muted">
              Are you sure? This cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-lost py-2.5 text-sm font-bold text-white transition hover:bg-lost/90 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting…' : 'Delete'}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 rounded-full border border-line-strong py-2.5 text-sm font-medium text-ink-soft transition hover:border-gold hover:text-ink disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

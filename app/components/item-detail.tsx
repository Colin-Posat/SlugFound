'use client'

/**
 * Item detail view — shared by /lost/[id] and /found/[id].
 *
 * Renders all metadata, the uploaded image (or emoji placeholder), and
 * action buttons. Owners see "Mark as resolved" / "Mark as claimed";
 * non-owners see a "Message poster" button (still placeholder — messaging
 * isn't wired to Supabase yet).
 */

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Badge, { type BadgeVariant } from '@/app/components/ui/badge'
import { initialFromName, timeAgo } from '@/app/lib/format'
import { updateItemStatus } from '@/app/actions/items'
import { findOrCreateConversation } from '@/app/actions/messages'
import { nextStatuses } from '@/app/lib/item-status'
import type { Item, ItemStatus } from '@/app/lib/definitions'
import LocationMapPicker from '@/app/components/location-map-picker-dynamic'

interface ItemDetailProps {
  item: Item
  isOwner: boolean
}

export default function ItemDetail({ item, isOwner }: ItemDetailProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Local mirror of status so the badge updates instantly when the user
  // marks resolved/claimed without waiting for a full page revalidation.
  const [status, setStatus] = useState<ItemStatus>(item.status)

  // Owner-only transitions allowed from the current status (US 4.3).
  const allowedStatuses = nextStatuses(status)

  const posterName = item.profile?.display_name ?? 'Anonymous'
  const posterInitial = initialFromName(posterName)
  const backHref = item.type === 'lost' ? '/lost' : '/found'

  function handleMarkStatus(nextStatus: ItemStatus) {
    startTransition(async () => {
      const result = await updateItemStatus(item.id, nextStatus)
      if (result.error) {
        toast.error(result.error)
        return
      }
      setStatus(nextStatus)
      toast.success(
        nextStatus === 'resolved' ? 'Marked as resolved 🎉' : 'Marked as claimed',
      )
      router.refresh()
    })
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      {/* Back */}
      <Link
        href={backHref}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-300"
      >
        ← All {item.type} items
      </Link>

      {/* Image / emoji */}
      <div className="mb-6 flex h-72 items-center justify-center overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
        {item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image_url}
            alt={item.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-9xl">{item.emoji ?? '📦'}</span>
        )}
      </div>

      {/* Title + badges */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Badge variant={item.type as BadgeVariant}>{item.type}</Badge>
        <Badge variant={status as BadgeVariant}>{status}</Badge>
        <span className="rounded-full border border-zinc-700 px-2.5 py-0.5 text-xs text-zinc-400">
          {item.category}
        </span>
      </div>

      <h1 className="mb-2 text-3xl font-bold text-white">{item.title}</h1>

      <div className="mb-6 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-500">
        <span>📍 {item.location}</span>
        <span>·</span>
        <span>{timeAgo(item.created_at)}</span>
      </div>

      {/* Description */}
      <div className="mb-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Description
        </h2>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
          {item.description}
        </p>
      </div>

      {/* Map — only shown when precise coordinates were saved with the item */}
      {item.lat !== null && item.lng !== null && (
        <div className="mb-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Location
          </h2>
          <LocationMapPicker
            value={{ lat: item.lat, lng: item.lng, label: item.location }}
            onChange={() => undefined}
            readOnly
          />
        </div>
      )}

      {/* Poster card */}
      <div className="mb-8 flex items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-yellow-400 text-lg font-bold text-zinc-950">
          {posterInitial}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wide text-zinc-600">
            {item.type === 'lost' ? 'Lost by' : 'Found by'}
          </p>
          <p className="truncate text-base font-semibold text-white">{posterName}</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        {isOwner ? (
          // Owner controls — transitions follow nextStatuses() (US 4.3).
          // Once resolved, no transition buttons render (terminal state).
          <>
            <Link
              href={`/items/${item.id}/edit`}
              className="rounded-full border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-zinc-500 hover:text-white"
            >
              Edit post
            </Link>
            {allowedStatuses.includes('claimed') && (
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleMarkStatus('claimed')}
                className="rounded-full border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-zinc-500 hover:text-white disabled:opacity-50"
              >
                {isPending ? 'Updating…' : 'Mark as claimed'}
              </button>
            )}
            {allowedStatuses.includes('resolved') && (
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleMarkStatus('resolved')}
                className="flex-1 rounded-full bg-yellow-400 py-2.5 text-sm font-bold text-zinc-950 transition hover:bg-yellow-300 disabled:opacity-50"
              >
                {isPending ? 'Updating…' : 'Mark as resolved'}
              </button>
            )}
            {status === 'resolved' && (
              <span className="flex-1 rounded-full border border-yellow-400/20 bg-yellow-400/5 py-2.5 text-center text-sm font-semibold text-yellow-400">
                ✅ Resolved
              </span>
            )}
          </>
        ) : (
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                const result = await findOrCreateConversation(item.id)
                if ('error' in result) {
                  toast.error(result.error)
                  return
                }
                router.push(`/messages?c=${result.conversationId}`)
              })
            }}
            className="flex-1 rounded-full bg-yellow-400 py-2.5 text-sm font-bold text-zinc-950 transition hover:bg-yellow-300 disabled:opacity-50"
          >
            {isPending ? 'Opening chat…' : `💬 Message ${posterName.split(' ')[0]}`}
          </button>
        )}
      </div>
    </div>
  )
}

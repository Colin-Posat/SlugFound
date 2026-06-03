'use client'

/**
 * Item detail view — rendered at the canonical /items/[id] route.
 *
 * Renders all metadata, the uploaded image (or emoji placeholder), and
 * action buttons. Owners see status controls + Edit; non-owners see a
 * "Message poster" button and a Report menu.
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
import ReportMenu from '@/app/components/report-menu'
import ImageOverlay from '@/app/components/ui/image-overlay'

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
    <div className="reveal mx-auto w-full max-w-3xl px-4 py-10">
      {/* Back + report menu */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
        >
          ← All {item.type} items
        </Link>
        {!isOwner && <ReportMenu itemId={item.id} />}
      </div>

      {/* Flagged banner — shown when the item has accumulated 3+ reports */}
      {item.reported_flag && (
        <div className="mb-6 rounded-xl border border-lost/30 bg-lost-soft px-4 py-3 text-sm text-lost">
          ⚠️ This listing has been flagged by multiple users and is under review.
        </div>
      )}

      {/* Image / emoji — click image to expand fullscreen */}
      <div className="mb-6 flex h-72 items-center justify-center overflow-hidden rounded-2xl border border-line bg-surface-2">
        {item.image_url ? (
          <ImageOverlay
            src={item.image_url}
            alt={item.title}
            trigger={
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.image_url}
                alt={item.title}
                className="h-full w-full cursor-pointer object-cover"
              />
            }
          />
        ) : (
          <span className="text-9xl">{item.emoji ?? '📦'}</span>
        )}
      </div>

      {/* Case eyebrow */}
      <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-gold-ink">
        Case · {item.id.slice(0, 8)}
      </p>

      {/* Title + badges */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Badge variant={item.type as BadgeVariant}>{item.type}</Badge>
        <Badge variant={status as BadgeVariant}>{status}</Badge>
        <span className="rounded-[4px] border border-line-strong px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
          {item.category}
        </span>
      </div>

      <h1 className="mb-2 font-display text-4xl font-bold text-ink">{item.title}</h1>

      <div className="mb-6 flex flex-wrap gap-x-4 gap-y-1 font-mono text-sm text-muted">
        <span>📍 {item.location}</span>
        <span>·</span>
        <span>{timeAgo(item.created_at)}</span>
      </div>

      {/* Description */}
      <div className="mb-8 rounded-2xl border border-line bg-surface p-6">
        <h2 className="mb-3 font-mono text-xs font-semibold uppercase tracking-[0.15em] text-muted">
          Description
        </h2>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">
          {item.description}
        </p>
      </div>

      {/* Map — only shown when precise coordinates were saved with the item */}
      {item.lat !== null && item.lng !== null && (
        <div className="mb-8 rounded-2xl border border-line bg-surface p-6">
          <h2 className="mb-3 font-mono text-xs font-semibold uppercase tracking-[0.15em] text-muted">
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
      <div className="mb-8 flex items-center gap-4 rounded-2xl border border-line bg-surface p-5">
        {item.profile?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.profile.avatar_url}
            alt={posterName}
            className="h-12 w-12 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gold text-lg font-bold text-on-gold">
            {posterInitial}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted">
            {item.type === 'lost' ? 'Lost by' : 'Found by'}
          </p>
          <p className="truncate text-base font-semibold text-ink">{posterName}</p>
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
              className="rounded-full border border-line-strong px-5 py-2.5 text-sm font-medium text-ink-soft transition hover:border-gold hover:text-ink"
            >
              Edit post
            </Link>
            {allowedStatuses.includes('claimed') && (
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleMarkStatus('claimed')}
                className="rounded-full border border-line-strong px-5 py-2.5 text-sm font-medium text-ink-soft transition hover:border-gold hover:text-ink disabled:opacity-50"
              >
                {isPending ? 'Updating…' : 'Mark as claimed'}
              </button>
            )}
            {allowedStatuses.includes('resolved') && (
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleMarkStatus('resolved')}
                className="flex-1 rounded-full bg-gold py-2.5 text-sm font-bold text-on-gold transition hover:bg-gold-bright disabled:opacity-50"
              >
                {isPending ? 'Updating…' : 'Mark as resolved'}
              </button>
            )}
            {status === 'resolved' && (
              <span className="flex-1 rounded-full border border-gold/40 bg-gold-soft py-2.5 text-center text-sm font-semibold text-resolved">
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
            className="flex-1 rounded-full bg-gold py-2.5 text-sm font-bold text-on-gold transition hover:bg-gold-bright disabled:opacity-50"
          >
            {isPending ? 'Opening chat…' : `💬 Message ${posterName.split(' ')[0]}`}
          </button>
        )}
      </div>
    </div>
  )
}

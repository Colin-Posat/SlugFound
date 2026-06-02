import Link from 'next/link'
import type { Item } from '@/app/lib/definitions'
import Badge from '@/app/components/ui/badge'
import { timeAgo, initialFromName } from '@/app/lib/format'
import { isReunited } from '@/app/lib/item-status'

/**
 * Listing card — styled as a lost-and-found index card (gold folder tab, ruled
 * title, monospace filing meta). Renders the uploaded image or an emoji
 * placeholder; the poster's display name shows when joined.
 *
 * Claimed/resolved items are visually muted and carry a rubber-stamp overlay
 * plus a status badge (US 4.3).
 */
export default function ItemCard({ item, className = '' }: { item: Item; className?: string }) {
  const posterName = item.profile?.display_name ?? 'Anonymous'
  const reunited = isReunited(item.status)

  return (
    <Link
      href={`/items/${item.id}`}
      className={`card-tab group relative flex flex-col rounded-xl border border-line bg-surface p-5 shadow-[0_1px_0_rgba(27,36,53,0.04)] transition-all duration-200 hover:-translate-y-1 hover:border-line-strong hover:shadow-[0_14px_30px_-12px_rgba(27,36,53,0.25)] ${
        reunited ? 'opacity-70' : ''
      } ${className}`}
    >
      {/* Image or emoji placeholder */}
      <div className="relative mb-4 flex h-36 items-center justify-center overflow-hidden rounded-lg border border-line bg-surface-2">
        {item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image_url}
            alt={item.title}
            className={`h-full w-full object-cover ${reunited ? 'grayscale' : ''}`}
          />
        ) : (
          <span className={`text-5xl ${reunited ? 'grayscale' : ''}`}>{item.emoji ?? '📦'}</span>
        )}

        {/* Rubber stamp for reunited items */}
        {reunited && (
          <span
            className={`stamp absolute px-3 py-1 text-sm font-bold ${
              item.status === 'resolved' ? 'text-resolved' : 'text-claimed'
            }`}
          >
            {item.status}
          </span>
        )}
      </div>

      {/* Badges */}
      <div className="flex items-center gap-2">
        <Badge variant={item.type}>{item.type}</Badge>
        {reunited && <Badge variant={item.status}>{item.status}</Badge>}
        <span className="rounded-[4px] border border-line-strong px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
          {item.category}
        </span>
      </div>

      <h3 className="mt-2 font-display text-lg font-semibold leading-snug text-ink transition-colors group-hover:text-gold-ink">
        {item.title}
      </h3>
      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">
        {item.description}
      </p>

      <div className="ruled mt-3 pb-3" />

      <div className="flex items-center justify-between font-mono text-[11px] text-muted">
        <span className="truncate">📍 {item.location}</span>
        <span className="shrink-0">{timeAgo(item.created_at)}</span>
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted">
        {item.profile?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.profile.avatar_url}
            alt={posterName}
            className="h-5 w-5 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold text-[9px] font-bold text-on-gold">
            {initialFromName(posterName)}
          </span>
        )}
        <span>
          Posted by <span className="text-ink-soft">{posterName}</span>
        </span>
      </div>
    </Link>
  )
}

import Link from 'next/link'
import type { Item } from '@/app/lib/definitions'
import Badge from '@/app/components/ui/badge'
import { timeAgo } from '@/app/lib/format'

/**
 * Listing card. Renders either the uploaded image (if image_url is set) or
 * a large emoji placeholder. Shows the poster's display name when joined.
 */
export default function ItemCard({ item }: { item: Item }) {
  const posterName = item.profile?.display_name ?? 'Anonymous'

  return (
    <Link
      href={`/${item.type}/${item.id}`}
      className="group flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-600 hover:shadow-lg hover:shadow-black/30"
    >
      {/* Image or emoji placeholder */}
      <div className="mb-4 flex h-36 items-center justify-center overflow-hidden rounded-xl bg-zinc-800">
        {item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image_url}
            alt={item.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-5xl">{item.emoji ?? '📦'}</span>
        )}
      </div>

      {/* Badges */}
      <div className="flex items-center gap-2">
        <Badge variant={item.type}>{item.type}</Badge>
        <span className="rounded-full border border-zinc-700 px-2.5 py-0.5 text-xs text-zinc-400">
          {item.category}
        </span>
      </div>

      <h3 className="mt-2 font-semibold text-white transition-colors group-hover:text-yellow-400">
        {item.title}
      </h3>
      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500">
        {item.description}
      </p>

      <div className="mt-3 flex items-center justify-between text-xs text-zinc-600">
        <span className="truncate">📍 {item.location}</span>
        <span className="shrink-0">{timeAgo(item.created_at)}</span>
      </div>

      <div className="mt-2 text-[11px] text-zinc-600">
        Posted by <span className="text-zinc-500">{posterName}</span>
      </div>
    </Link>
  )
}

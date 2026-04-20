import Link from 'next/link'
import type { Item } from '@/app/lib/definitions'
import Badge from '@/app/components/ui/badge'

export default function ItemCard({ item }: { item: Item }) {
  return (
    <Link
      href={`/${item.type}/${item.id}`}
      className="group flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-600 hover:shadow-lg hover:shadow-black/30"
    >
      {/* Image placeholder */}
      <div className="mb-4 flex h-36 items-center justify-center rounded-xl bg-zinc-800 text-5xl">
        {item.emoji}
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
        <span>📍 {item.location}</span>
        <span>{item.time}</span>
      </div>
    </Link>
  )
}

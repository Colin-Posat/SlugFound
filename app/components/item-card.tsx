import Link from 'next/link'

type Item = {
  id: string
  type: 'lost' | 'found'
  title: string
  category: string
  location: string
  time: string
  description: string
  emoji: string
}

export default function ItemCard({ item }: { item: Item }) {
  const isLost = item.type === 'lost'
  return (
    <Link
      href={`/${item.type}/${item.id}`}
      className="group flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900 p-5 transition-colors hover:border-zinc-600"
    >
      {/* Image placeholder */}
      <div className="mb-4 flex h-36 items-center justify-center rounded-xl bg-zinc-800 text-5xl">
        {item.emoji}
      </div>

      {/* Badges */}
      <div className="flex items-center gap-2">
        <span
          className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${
            isLost
              ? 'border-red-500/20 bg-red-500/10 text-red-400'
              : 'border-green-500/20 bg-green-500/10 text-green-400'
          }`}
        >
          {item.type}
        </span>
        <span className="rounded-full border border-zinc-700 px-2.5 py-0.5 text-xs text-zinc-400">
          {item.category}
        </span>
      </div>

      <h3 className="mt-2 font-semibold text-white group-hover:text-yellow-400 transition-colors">
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

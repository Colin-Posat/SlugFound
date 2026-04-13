import ItemCard from '@/app/components/item-card'
import Link from 'next/link'

const lostItems = [
  { id: '1', type: 'lost' as const, title: 'AirPods Pro (2nd Gen)', category: 'Electronics', location: 'McHenry Library', time: '2h ago', description: 'Left my AirPods Pro on a desk in the quiet section on the 3rd floor. White case, small scratch on the lid.', emoji: '🎧' },
  { id: '2', type: 'lost' as const, title: 'Blue North Face Jacket', category: 'Clothing', location: 'Stevenson Dining Hall', time: '1d ago', description: 'Navy blue North Face fleece, size medium. Left it on a chair during dinner. Has initials on the inside tag.', emoji: '🧥' },
  { id: '3', type: 'lost' as const, title: 'Student ID Card', category: 'ID / Cards', location: 'Cowell / Stevenson Bus Stop', time: '3d ago', description: 'Lost my UCSC student ID near the bus stop. Name: Jordan Kim, Class of 2026.', emoji: '🪪' },
  { id: '4', type: 'lost' as const, title: 'MacBook 65W Charger', category: 'Electronics', location: 'Baskin Engineering, Rm 155', time: '5h ago', description: 'USB-C 65W charger with a teal cable clip. Left it plugged into the wall by the window seats.', emoji: '🔌' },
  { id: '5', type: 'lost' as const, title: 'Hydro Flask (32oz)', category: 'Personal Items', location: 'Kresge Academic', time: '1w ago', description: 'Black 32oz Hydro Flask with a golden gate bridge and a banana slug sticker.', emoji: '🫙' },
  { id: '6', type: 'lost' as const, title: 'Prescription Glasses', category: 'Personal Items', location: 'Oakes Learning Center', time: '4d ago', description: 'Round black-frame glasses in a brown faux-leather case. Desperately need them back.', emoji: '👓' },
  { id: '7', type: 'lost' as const, title: 'Calculus Textbook', category: 'Books', location: 'Science & Engineering Library', time: '2d ago', description: '"Calculus: Early Transcendentals" 8th edition. My name is in the front cover. Many sticky notes inside.', emoji: '📚' },
  { id: '8', type: 'lost' as const, title: 'Honda Car Keys', category: 'Keys', location: 'Quarry Plaza', time: '6h ago', description: 'Honda key fob with a red lanyard and a mini rubber duck keychain. Two keys on the ring.', emoji: '🔑' },
]

const categories = ['All', 'Electronics', 'Clothing', 'ID / Cards', 'Personal Items', 'Books', 'Keys']

export default function LostPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Lost Items</h1>
          <p className="mt-1 text-sm text-zinc-400">{lostItems.length} active listings · Updated just now</p>
        </div>
        <Link href="/create?type=lost" className="inline-flex h-10 items-center rounded-full bg-yellow-400 px-5 text-sm font-semibold text-zinc-950 transition hover:bg-yellow-300">
          + Report Lost Item
        </Link>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input type="text" placeholder="Search lost items…" className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400" />
        <select className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-300 outline-none focus:border-yellow-400">
          <option value="">All locations</option>
          <option>McHenry Library</option>
          <option>Baskin Engineering</option>
          <option>Cowell College</option>
          <option>Kresge</option>
          <option>Oakes</option>
          <option>Quarry Plaza</option>
        </select>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        {categories.map((cat, i) => (
          <button key={cat} className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${i === 0 ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400' : 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white'}`}>
            {cat}
          </button>
        ))}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {lostItems.map((item) => <ItemCard key={item.id} item={item} />)}
      </div>
    </div>
  )
}

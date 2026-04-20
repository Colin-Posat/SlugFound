import Link from 'next/link'
import ItemsFilter from '@/app/components/items-filter'
import type { Item } from '@/app/lib/definitions'

const lostItems: readonly Item[] = [
  { id: '1', type: 'lost', title: 'AirPods Pro (2nd Gen)', category: 'Electronics', location: 'McHenry Library', time: '2h ago', description: 'Left my AirPods Pro on a desk in the quiet section on the 3rd floor. White case, small scratch on the lid.', emoji: '🎧' },
  { id: '2', type: 'lost', title: 'Blue North Face Jacket', category: 'Clothing', location: 'Stevenson Dining Hall', time: '1d ago', description: 'Navy blue North Face fleece, size medium. Left it on a chair during dinner. Has initials on the inside tag.', emoji: '🧥' },
  { id: '3', type: 'lost', title: 'Student ID Card', category: 'ID / Cards', location: 'Cowell / Stevenson Bus Stop', time: '3d ago', description: 'Lost my UCSC student ID near the bus stop. Name: Jordan Kim, Class of 2026.', emoji: '🪪' },
  { id: '4', type: 'lost', title: 'MacBook 65W Charger', category: 'Electronics', location: 'Baskin Engineering', time: '5h ago', description: 'USB-C 65W charger with a teal cable clip. Left it plugged into the wall by the window seats in Rm 155.', emoji: '🔌' },
  { id: '5', type: 'lost', title: 'Hydro Flask (32oz)', category: 'Personal Items', location: 'Kresge', time: '1w ago', description: 'Black 32oz Hydro Flask with a golden gate bridge and a banana slug sticker.', emoji: '🫙' },
  { id: '6', type: 'lost', title: 'Prescription Glasses', category: 'Personal Items', location: 'Oakes', time: '4d ago', description: 'Round black-frame glasses in a brown faux-leather case. Desperately need them back.', emoji: '👓' },
  { id: '7', type: 'lost', title: 'Calculus Textbook', category: 'Books', location: 'Science & Engineering Library', time: '2d ago', description: '"Calculus: Early Transcendentals" 8th edition. My name is in the front cover. Many sticky notes inside.', emoji: '📚' },
  { id: '8', type: 'lost', title: 'Honda Car Keys', category: 'Keys', location: 'Quarry Plaza', time: '6h ago', description: 'Honda key fob with a red lanyard and a mini rubber duck keychain. Two keys on the ring.', emoji: '🔑' },
]

export default function LostPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Lost Items</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {lostItems.length} active listings
          </p>
        </div>
        <Link
          href="/create?type=lost"
          className="inline-flex h-10 items-center rounded-full bg-yellow-400 px-5 text-sm font-semibold text-zinc-950 transition hover:bg-yellow-300"
        >
          + Report Lost Item
        </Link>
      </div>

      <ItemsFilter items={lostItems} type="lost" reportHref="/create?type=lost" />
    </div>
  )
}

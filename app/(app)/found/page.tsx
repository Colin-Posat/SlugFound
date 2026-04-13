import ItemCard from '@/app/components/item-card'
import Link from 'next/link'

const foundItems = [
  { id: '1', type: 'found' as const, title: 'iPhone 14 (Black)', category: 'Electronics', location: 'Crown / Merrill Dining', time: '1d ago', description: 'Found an iPhone 14 in a black case on a table in the dining hall after dinner. Screen has a small crack on one corner.', emoji: '📱' },
  { id: '2', type: 'found' as const, title: 'UCSC Banana Slug Hoodie', category: 'Clothing', location: 'Cowell College Courtyard', time: '3d ago', description: 'Gray UCSC hoodie, size large, found on a bench. Has a small yellow banana slug graphic on the chest.', emoji: '🐌' },
  { id: '3', type: 'found' as const, title: 'Brown Leather Wallet', category: 'Personal Items', location: 'Baskin Engineering, 2nd Floor', time: '2d ago', description: 'Brown bifold wallet found near the vending machines. Cards inside — handing them over unopened.', emoji: '👛' },
  { id: '4', type: 'found' as const, title: 'Keychain with 3 Keys', category: 'Keys', location: 'Quarry Plaza (near entrance)', time: '6h ago', description: 'Keys with a green carabiner clip and a small photo keychain. Left at the Quarry info desk.', emoji: '🗝️' },
  { id: '5', type: 'found' as const, title: 'Biology 101 Textbook', category: 'Books', location: 'Science & Engineering Library', time: '1w ago', description: '"Campbell Biology" 12th edition found on a study table. Name "A. Patel" written inside front cover.', emoji: '📖' },
  { id: '6', type: 'found' as const, title: 'Black Umbrella', category: 'Personal Items', location: 'Merrill Bus Stop', time: '2d ago', description: 'Standard black collapsible umbrella leaning against the shelter at the bus stop. No identifying marks.', emoji: '☂️' },
  { id: '7', type: 'found' as const, title: 'AirPods Case (no buds)', category: 'Electronics', location: 'McHenry Library, 2nd Floor', time: '4d ago', description: 'Found a white AirPods Pro charging case — no earbuds inside. Turned into the library front desk.', emoji: '🎵' },
  { id: '8', type: 'found' as const, title: 'Purple Scrunchie + Hair Clips', category: 'Personal Items', location: 'Kresge Dining Hall', time: '5h ago', description: 'Found a purple velvet scrunchie and two gold hair clips on a dining table after the lunch crowd.', emoji: '🪮' },
]

const categories = ['All', 'Electronics', 'Clothing', 'Personal Items', 'Books', 'Keys']

export default function FoundPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Found Items</h1>
          <p className="mt-1 text-sm text-zinc-400">{foundItems.length} active listings · Updated just now</p>
        </div>
        <Link href="/create?type=found" className="inline-flex h-10 items-center rounded-full bg-yellow-400 px-5 text-sm font-semibold text-zinc-950 transition hover:bg-yellow-300">
          + Report Found Item
        </Link>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input type="text" placeholder="Search found items…" className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400" />
        <select className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-300 outline-none focus:border-yellow-400">
          <option value="">All locations</option>
          <option>McHenry Library</option>
          <option>Baskin Engineering</option>
          <option>Cowell / Merrill</option>
          <option>Kresge</option>
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
        {foundItems.map((item) => <ItemCard key={item.id} item={item} />)}
      </div>
    </div>
  )
}

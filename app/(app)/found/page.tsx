import Link from 'next/link'
import ItemsFilter from '@/app/components/items-filter'
import type { Item } from '@/app/lib/definitions'

const foundItems: readonly Item[] = [
  { id: '1', type: 'found', title: 'iPhone 14 (Black)', category: 'Electronics', location: 'Crown College', time: '1d ago', description: 'Found an iPhone 14 in a black case on a table in the dining hall after dinner. Screen has a small crack on one corner.', emoji: '📱' },
  { id: '2', type: 'found', title: 'UCSC Banana Slug Hoodie', category: 'Clothing', location: 'Cowell College', time: '3d ago', description: 'Gray UCSC hoodie, size large, found on a bench. Has a small yellow banana slug graphic on the chest.', emoji: '🐌' },
  { id: '3', type: 'found', title: 'Brown Leather Wallet', category: 'Personal Items', location: 'Baskin Engineering', time: '2d ago', description: 'Brown bifold wallet found near the vending machines. Cards inside — handing them over unopened.', emoji: '👛' },
  { id: '4', type: 'found', title: 'Keychain with 3 Keys', category: 'Keys', location: 'Quarry Plaza', time: '6h ago', description: 'Keys with a green carabiner clip and a small photo keychain. Left at the Quarry info desk.', emoji: '🗝️' },
  { id: '5', type: 'found', title: 'Biology 101 Textbook', category: 'Books', location: 'Science & Engineering Library', time: '1w ago', description: '"Campbell Biology" 12th edition found on a study table. Name "A. Patel" written inside front cover.', emoji: '📖' },
  { id: '6', type: 'found', title: 'Black Umbrella', category: 'Personal Items', location: 'Merrill College', time: '2d ago', description: 'Standard black collapsible umbrella leaning against the shelter at the bus stop. No identifying marks.', emoji: '☂️' },
  { id: '7', type: 'found', title: 'AirPods Case (no buds)', category: 'Electronics', location: 'McHenry Library', time: '4d ago', description: 'Found a white AirPods Pro charging case — no earbuds inside. Turned into the library front desk.', emoji: '🎵' },
  { id: '8', type: 'found', title: 'Purple Scrunchie + Hair Clips', category: 'Personal Items', location: 'Kresge', time: '5h ago', description: 'Found a purple velvet scrunchie and two gold hair clips on a dining table after the lunch crowd.', emoji: '🪮' },
]

export default function FoundPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Found Items</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {foundItems.length} active listings
          </p>
        </div>
        <Link
          href="/create?type=found"
          className="inline-flex h-10 items-center rounded-full bg-yellow-400 px-5 text-sm font-semibold text-zinc-950 transition hover:bg-yellow-300"
        >
          + Report Found Item
        </Link>
      </div>

      <ItemsFilter items={foundItems} type="found" reportHref="/create?type=found" />
    </div>
  )
}

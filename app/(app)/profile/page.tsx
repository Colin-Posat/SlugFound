import Link from 'next/link'

const userListings = [
  { id: '1', type: 'lost', title: 'AirPods Pro (2nd Gen)', status: 'active', time: '2h ago', emoji: '🎧' },
  { id: '2', type: 'found', title: 'UCSC Hoodie', status: 'resolved', time: '5d ago', emoji: '🐌' },
  { id: '3', type: 'lost', title: 'Student ID Card', status: 'active', time: '1w ago', emoji: '🪪' },
]

export default function ProfilePage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      {/* Profile header */}
      <div className="mb-10 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-yellow-400 text-3xl font-bold text-zinc-950">
          S
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Sam Slug</h1>
          <p className="text-sm text-zinc-400">slug@ucsc.edu</p>
          <p className="mt-1 text-xs text-zinc-600">Member since April 2025 · Cowell College</p>
        </div>
        <button className="rounded-full border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-zinc-500 hover:text-white">
          Edit profile
        </button>
      </div>

      {/* Stats */}
      <div className="mb-10 grid grid-cols-3 gap-4">
        {[{ label: 'Posts', value: '3' }, { label: 'Resolved', value: '1' }, { label: 'Active', value: '2' }].map((s) => (
          <div key={s.label} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 text-center">
            <p className="text-3xl font-bold text-yellow-400">{s.value}</p>
            <p className="mt-1 text-xs text-zinc-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-6 flex w-fit gap-1 rounded-xl border border-zinc-800 bg-zinc-900 p-1">
        {['My Listings', 'Saved', 'Settings'].map((tab, i) => (
          <button key={tab} className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${i === 0 ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Listings */}
      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
        <div className="border-b border-zinc-800 px-5 py-4">
          <h2 className="text-sm font-semibold text-white">My Listings</h2>
        </div>
        <ul className="divide-y divide-zinc-800">
          {userListings.map((item) => (
            <li key={item.id} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-zinc-800/50">
              <span className="text-2xl">{item.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-white">{item.title}</p>
                <p className="text-xs text-zinc-500">{item.time}</p>
              </div>
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium uppercase ${item.type === 'lost' ? 'border-red-500/20 bg-red-500/10 text-red-400' : 'border-green-500/20 bg-green-500/10 text-green-400'}`}>
                {item.type}
              </span>
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${item.status === 'resolved' ? 'border-yellow-400/20 bg-yellow-400/10 text-yellow-400' : 'border-zinc-700 text-zinc-400'}`}>
                {item.status}
              </span>
              <button className="text-xs text-zinc-600 transition-colors hover:text-zinc-400">···</button>
            </li>
          ))}
        </ul>
      </div>

      {/* Account section */}
      <div className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <h3 className="mb-1 text-sm font-semibold text-white">Account</h3>
        <p className="mb-4 text-xs text-zinc-500">Manage your account settings.</p>
        <div className="flex flex-wrap gap-3">
          <button className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-400 transition hover:text-white">
            Change password
          </button>
          <Link href="/login" className="rounded-full border border-red-500/30 px-4 py-2 text-sm text-red-400 transition hover:border-red-500/60">
            Sign out
          </Link>
        </div>
      </div>
    </div>
  )
}

import Link from 'next/link'

/**
 * Rendered when getItemById returns null and the page calls notFound() (US 4.1).
 * Friendly message + links back to the listings instead of a crash.
 */
export default function ItemNotFound() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <span className="text-6xl">🔍</span>
      <h1 className="text-2xl font-bold text-white">Item not found</h1>
      <p className="max-w-sm text-sm text-zinc-400">
        This listing may have been removed by its owner, or the link is incorrect.
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <Link
          href="/lost"
          className="rounded-full bg-yellow-400 px-5 py-2.5 text-sm font-bold text-zinc-950 transition hover:bg-yellow-300"
        >
          Browse lost items
        </Link>
        <Link
          href="/found"
          className="rounded-full border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-zinc-500 hover:text-white"
        >
          Browse found items
        </Link>
      </div>
    </div>
  )
}

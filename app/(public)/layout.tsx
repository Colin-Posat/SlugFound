import Link from 'next/link'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-white">
      {/* Minimal public nav */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight">
              <span className="text-yellow-400">Slug</span>
              <span className="text-white">Found</span>
            </span>
            <span className="hidden rounded bg-yellow-400/10 px-1.5 py-0.5 text-xs font-medium text-yellow-400 sm:inline">
              UCSC
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-full px-4 py-1.5 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-yellow-400 px-4 py-1.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-yellow-300"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      <main className="flex flex-col flex-1">{children}</main>
    </div>
  )
}

import Link from 'next/link'
import ThemeToggle from '@/app/components/theme-toggle'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      {/* Minimal public nav */}
      <header className="sticky top-0 z-50 border-b border-line bg-paper/85 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-display text-xl font-bold tracking-tight">
              <span className="text-gold-ink">Slug</span>
              <span className="text-ink">Found</span>
            </span>
            <span className="hidden rounded bg-gold-soft px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold-ink sm:inline">
              UCSC
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/login"
              className="rounded-full px-4 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-ink"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-gold px-4 py-1.5 text-sm font-semibold text-on-gold transition-colors hover:bg-gold-bright"
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

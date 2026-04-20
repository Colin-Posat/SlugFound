// ⚠️ DEAD CODE — This component is not imported anywhere in the app.
// The authenticated layout uses <Sidebar> instead, and the public layout has
// its own inline header in app/(public)/layout.tsx.
// Safe to delete unless you plan to use it for a different layout.

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

export default function AppNav() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  const navLinks = [
    { href: '/lost', label: 'Lost Items' },
    { href: '/found', label: 'Found Items' },
  ]

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/')

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/lost" className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight">
            <span className="text-yellow-400">Slug</span>
            <span className="text-white">Found</span>
          </span>
          <span className="hidden rounded bg-yellow-400/10 px-1.5 py-0.5 text-xs font-medium text-yellow-400 sm:inline">
            UCSC
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? 'text-yellow-400'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/create"
            className="rounded-full bg-yellow-400 px-4 py-1.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-yellow-300"
          >
            + Report Item
          </Link>
          <Link
            href="/profile"
            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors ${
              isActive('/profile')
                ? 'bg-yellow-400 text-zinc-950'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            S
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="flex flex-col gap-1.5 p-1 md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`block h-0.5 w-5 bg-white transition-all ${menuOpen ? 'translate-y-2 rotate-45' : ''}`} />
          <span className={`block h-0.5 w-5 bg-white transition-all ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`block h-0.5 w-5 bg-white transition-all ${menuOpen ? '-translate-y-2 -rotate-45' : ''}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-zinc-800 bg-zinc-950 px-4 pb-4 md:hidden">
          <nav className="flex flex-col gap-1 pt-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? 'bg-yellow-400/10 text-yellow-400'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/profile"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-900 hover:text-white"
            >
              Profile
            </Link>
            <div className="mt-2 border-t border-zinc-800 pt-3">
              <Link
                href="/create"
                onClick={() => setMenuOpen(false)}
                className="block rounded-full bg-yellow-400 px-4 py-2 text-center text-sm font-semibold text-zinc-950"
              >
                + Report Item
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}

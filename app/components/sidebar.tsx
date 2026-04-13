'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/actions/auth'

const navItems = [
  { href: '/lost', label: 'Lost Items', icon: '🔍' },
  { href: '/found', label: 'Found Items', icon: '📦' },
  { href: '/create', label: 'Report Item', icon: '+', highlight: true },
  { href: '/profile', label: 'Profile', icon: '👤' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950 min-h-screen sticky top-0 h-screen">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-zinc-800">
          <Link href="/lost" className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight">
              <span className="text-yellow-400">Slug</span>
              <span className="text-white">Found</span>
            </span>
            <span className="rounded bg-yellow-400/10 px-1.5 py-0.5 text-xs font-medium text-yellow-400">
              UCSC
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 p-3 flex-1">
          {navItems.map((item) => {
            if (item.highlight) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="mt-1 flex items-center gap-3 rounded-xl bg-yellow-400 px-3 py-2.5 text-sm font-bold text-zinc-950 transition hover:bg-yellow-300"
                >
                  <span className="text-base font-black leading-none">{item.icon}</span>
                  {item.label}
                </Link>
              )
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
                {isActive(item.href) && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-yellow-400" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Sign out */}
        <div className="border-t border-zinc-800 p-3">
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-zinc-300"
            >
              <span className="text-base">↩</span>
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* ── Mobile bottom tab bar ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-zinc-800 bg-zinc-950 md:hidden">
        {navItems.map((item) => {
          if (item.highlight) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-1 flex-col items-center justify-center gap-1 py-3"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-yellow-400 text-sm font-black text-zinc-950">
                  {item.icon}
                </span>
                <span className="text-[10px] font-semibold text-yellow-400">Report</span>
              </Link>
            )
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center justify-center gap-1 py-3 transition-colors ${
                isActive(item.href) ? 'text-yellow-400' : 'text-zinc-500'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-[10px] font-medium">{item.label.split(' ')[0]}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}

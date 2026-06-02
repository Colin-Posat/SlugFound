'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/actions/auth'
import { useUnread } from '@/app/lib/unread-context'
import { useAuth } from '@/app/lib/auth-context'
import ThemeToggle from '@/app/components/theme-toggle'

const navItems = [
  { href: '/lost', label: 'Lost Items', icon: '🔍' },
  { href: '/found', label: 'Found Items', icon: '📦' },
  { href: '/messages', label: 'Messages', icon: '💬' },
  { href: '/create', label: 'Report Item', icon: '+', highlight: true },
  { href: '/profile', label: 'Profile', icon: '👤' },
]

/**
 * Derive a display name + initial from the current auth state.
 * Falls back to the email prefix if the profile row hasn't loaded yet
 * (e.g. immediately after signup, before the trigger has run).
 */
function getDisplayInfo(
  profileName: string | undefined,
  email: string | undefined,
): { name: string; initial: string } {
  const name = profileName?.trim() || email?.split('@')[0] || 'Slug'
  const initial = name.charAt(0).toUpperCase()
  return { name, initial }
}

export default function Sidebar() {
  const pathname = usePathname()
  const { totalUnread } = useUnread()
  const { user, profile } = useAuth()

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/')

  const { name, initial } = getDisplayInfo(profile?.display_name, user?.email)

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-line bg-surface min-h-screen sticky top-0 h-screen">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-line">
          <Link href="/lost" className="flex items-center gap-2">
            <span className="font-display text-xl font-bold tracking-tight">
              <span className="text-gold-ink">Slug</span>
              <span className="text-ink">Found</span>
            </span>
            <span className="rounded bg-gold-soft px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold-ink">
              UCSC
            </span>
          </Link>
        </div>

        {/* User card — shows real signed-in user from AuthContext */}
        {user && (
          <div className="border-b border-line px-3 py-3">
            <Link
              href="/profile"
              className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-surface-2"
            >
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt={name}
                  className="h-9 w-9 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold text-sm font-bold text-on-gold">
                  {initial}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{name}</p>
                <p className="truncate font-mono text-[11px] text-muted">{user.email}</p>
              </div>
            </Link>
          </div>
        )}

        {/* Nav */}
        <nav className="flex flex-col gap-1 p-3 flex-1">
          {navItems.map((item) => {
            if (item.highlight) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="mt-4 flex items-center gap-3 rounded-xl bg-gold px-3 py-2.5 text-sm font-bold text-on-gold shadow-[0_8px_18px_-8px_rgba(234,179,8,0.7)] transition hover:bg-gold-bright"
                >
                  <span className="text-base font-black leading-none">{item.icon}</span>
                  {item.label}
                </Link>
              )
            }

            const active = isActive(item.href)
            const isMessages = item.href === '/messages'

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-gold-soft text-ink'
                    : 'text-ink-soft hover:bg-surface-2 hover:text-ink'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
                <span className="ml-auto flex items-center">
                  {isMessages && totalUnread > 0 ? (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-on-gold">
                      {totalUnread}
                    </span>
                  ) : active ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                  ) : null}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* Sign out + theme toggle */}
        <div className="flex items-center gap-2 border-t border-line p-3">
          <form action={logout} className="flex-1">
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-ink"
            >
              <span className="text-base">↩</span>
              Sign out
            </button>
          </form>
          <ThemeToggle />
        </div>
      </aside>

      {/* ── Mobile bottom tab bar ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-line bg-surface md:hidden">
        {navItems.map((item) => {
          if (item.highlight) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-1 flex-col items-center justify-center gap-1 py-3"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gold text-sm font-black text-on-gold">
                  {item.icon}
                </span>
                <span className="text-[10px] font-semibold text-gold-ink">Report</span>
              </Link>
            )
          }

          const active = isActive(item.href)
          const isMessages = item.href === '/messages'

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-1 flex-col items-center justify-center gap-1 py-3 transition-colors ${
                active ? 'text-gold-ink' : 'text-muted'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-[10px] font-medium">{item.label.split(' ')[0]}</span>
              {/* Unread dot on mobile */}
              {isMessages && totalUnread > 0 && (
                <span className="absolute right-[calc(50%-14px)] top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[9px] font-bold text-on-gold">
                  {totalUnread}
                </span>
              )}
            </Link>
          )
        })}
      </nav>
    </>
  )
}

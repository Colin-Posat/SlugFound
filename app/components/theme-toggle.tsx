'use client'

import { useTheme } from '@/app/lib/use-theme'

/**
 * Light/dark mode toggle button. Shows the icon for the mode you'd switch TO.
 */
export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line-strong text-base text-ink-soft transition hover:border-gold hover:text-ink ${className}`}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  )
}

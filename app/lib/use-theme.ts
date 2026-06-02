'use client'

/**
 * Light/dark theme hook.
 *
 * The actual theme lives as a `.dark` class on <html> (applied pre-hydration by
 * an inline script in app/layout.tsx, and toggled here). We read it via
 * useSyncExternalStore so it's SSR-safe and stays in sync across tabs without
 * any provider or set-state-in-effect.
 */

import { useSyncExternalStore, useCallback } from 'react'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'slugfound-theme'
const THEME_EVENT = 'slugfound-themechange'

function subscribe(callback: () => void): () => void {
  window.addEventListener('storage', callback)
  window.addEventListener(THEME_EVENT, callback)
  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener(THEME_EVENT, callback)
  }
}

function getSnapshot(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

function getServerSnapshot(): Theme {
  return 'light'
}

export function useTheme(): { theme: Theme; toggleTheme: () => void } {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const toggleTheme = useCallback(() => {
    const next: Theme = document.documentElement.classList.contains('dark') ? 'light' : 'dark'
    document.documentElement.classList.toggle('dark', next === 'dark')
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // localStorage unavailable (private mode) — the class still applies for this session.
    }
    window.dispatchEvent(new Event(THEME_EVENT))
  }, [])

  return { theme, toggleTheme }
}

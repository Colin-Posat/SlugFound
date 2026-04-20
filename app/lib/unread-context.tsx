'use client'

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'
import { MOCK_CONVERSATIONS } from './mock-messages'

// UnreadContext shares unread message counts between two separate parts of the
// component tree: Sidebar (reads totalUnread to show the nav badge) and
// MessagesView (calls clearUnread when a conversation is opened). Lifting this
// state into context means neither component needs to know about the other.
//
// The provider is mounted in (app)/layout.tsx so it wraps the entire
// authenticated section of the app.

interface UnreadContextValue {
  unreadCounts: Record<string, number>
  clearUnread: (conversationId: string) => void
  totalUnread: number
}

const UnreadContext = createContext<UnreadContextValue | null>(null)

export function UnreadProvider({ children }: { children: ReactNode }) {
  // Seed counts from mock data. Replace with a server-fetched unread count
  // once the database is wired up.
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>(
    () => Object.fromEntries(MOCK_CONVERSATIONS.map((c) => [c.id, c.unreadCount])),
  )

  // Derived — recomputed on every render but cheap (O(n) over 5 conversations)
  const totalUnread = Object.values(unreadCounts).reduce((sum, n) => sum + n, 0)

  // useCallback gives clearUnread a stable reference. Without it, a new function
  // object would be created on every render, which would cause the useEffect in
  // MessagesView (which depends on clearUnread) to re-run on every parent render.
  const clearUnread = useCallback((conversationId: string) => {
    // Immutable update — spread prev to avoid mutating the existing object
    setUnreadCounts((prev) => ({ ...prev, [conversationId]: 0 }))
  }, [])

  return (
    <UnreadContext.Provider value={{ unreadCounts, clearUnread, totalUnread }}>
      {children}
    </UnreadContext.Provider>
  )
}

export function useUnread(): UnreadContextValue {
  const ctx = useContext(UnreadContext)
  if (!ctx) throw new Error('useUnread must be used inside UnreadProvider')
  return ctx
}

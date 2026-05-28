'use client'

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'

interface UnreadContextValue {
  unreadCounts: Record<string, number>
  clearUnread: (conversationId: string) => void
  incrementUnread: (conversationId: string) => void
  totalUnread: number
}

const UnreadContext = createContext<UnreadContextValue | null>(null)

interface UnreadProviderProps {
  initialUnreadCounts: Record<string, number>
  children: ReactNode
}

export function UnreadProvider({ initialUnreadCounts, children }: UnreadProviderProps) {
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>(
    () => ({ ...initialUnreadCounts }),
  )

  const totalUnread = Object.values(unreadCounts).reduce((sum, n) => sum + n, 0)

  const clearUnread = useCallback((conversationId: string) => {
    setUnreadCounts((prev) => ({ ...prev, [conversationId]: 0 }))
  }, [])

  const incrementUnread = useCallback((conversationId: string) => {
    setUnreadCounts((prev) => ({
      ...prev,
      [conversationId]: (prev[conversationId] ?? 0) + 1,
    }))
  }, [])

  return (
    <UnreadContext.Provider value={{ unreadCounts, clearUnread, incrementUnread, totalUnread }}>
      {children}
    </UnreadContext.Provider>
  )
}

export function useUnread(): UnreadContextValue {
  const ctx = useContext(UnreadContext)
  if (!ctx) throw new Error('useUnread must be used inside UnreadProvider')
  return ctx
}

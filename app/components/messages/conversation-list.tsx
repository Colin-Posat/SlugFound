'use client'

import { useState } from 'react'
import type { Conversation } from '@/app/lib/definitions'
import ConversationListItem from './conversation-list-item'

interface ConversationListProps {
  conversations: readonly Conversation[]
  activeId: string | null
  unreadCounts: Record<string, number>
  onSelect: (conversationId: string) => void
}

export default function ConversationList({
  conversations,
  activeId,
  unreadCounts,
  onSelect,
}: ConversationListProps) {
  const [search, setSearch] = useState('')

  const filtered = conversations.filter(
    (c) =>
      c.otherUser.name.toLowerCase().includes(search.toLowerCase()) ||
      c.itemTitle.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="flex w-full shrink-0 flex-col overflow-hidden border-r border-line md:w-80">
      {/* Header */}
      <div className="shrink-0 border-b border-line px-4 py-3">
        <h2 className="font-display text-lg font-bold text-ink">Messages</h2>
      </div>

      {/* Search */}
      <div className="shrink-0 px-3 pb-2 pt-3">
        <input
          type="text"
          placeholder="Search conversations…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink placeholder-muted outline-none focus:border-gold focus:ring-1 focus:ring-gold"
        />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {filtered.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted">
            No conversations found
          </p>
        ) : (
          filtered.map((c) => (
            <ConversationListItem
              key={c.id}
              conversation={c}
              isActive={c.id === activeId}
              unreadCount={unreadCounts[c.id] ?? 0}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </div>
  )
}

'use client'

import type { Conversation } from '@/app/lib/definitions'
import { timeAgo } from '@/app/lib/format'

interface ConversationListItemProps {
  conversation: Conversation
  isActive: boolean
  unreadCount: number
  onSelect: (conversationId: string) => void
}

export default function ConversationListItem({
  conversation,
  isActive,
  unreadCount,
  onSelect,
}: ConversationListItemProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(conversation.id)}
      className={`flex w-full min-w-0 items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors ${
        isActive
          ? 'border-l-2 border-gold bg-gold-soft pl-2.5'
          : 'hover:bg-surface-2'
      }`}
    >
      {/* Avatar */}
      {conversation.otherUser.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={conversation.otherUser.avatarUrl}
          alt={conversation.otherUser.name}
          className={`h-10 w-10 shrink-0 rounded-full object-cover ${
            unreadCount > 0 ? 'ring-2 ring-gold' : ''
          }`}
        />
      ) : (
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-sm font-bold text-ink-soft ${
            unreadCount > 0 ? 'ring-2 ring-gold' : ''
          }`}
        >
          {conversation.otherUser.initial}
        </div>
      )}

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-semibold text-ink">
            {conversation.otherUser.name}
          </span>
          <span className="shrink-0 font-mono text-[10px] text-muted">
            {timeAgo(conversation.lastMessageAt)}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-1.5">
          <span className="text-xs">{conversation.itemEmoji}</span>
          <span className="line-clamp-1 text-xs text-muted">
            {conversation.lastMessagePreview}
          </span>
        </div>
      </div>

      {/* Unread badge */}
      {unreadCount > 0 && (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-on-gold">
          {unreadCount}
        </span>
      )}
    </button>
  )
}

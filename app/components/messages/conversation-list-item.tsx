import Link from 'next/link'
import type { Conversation } from '@/app/lib/definitions'
import { timeAgo } from '@/app/lib/format'

interface ConversationListItemProps {
  conversation: Conversation
  isActive: boolean
  unreadCount: number
}

export default function ConversationListItem({
  conversation,
  isActive,
  unreadCount,
}: ConversationListItemProps) {
  return (
    <Link
      href={`/messages?c=${conversation.id}`}
      className={`flex min-w-0 items-center gap-3 rounded-xl px-3 py-3 transition-colors ${
        isActive
          ? 'border-l-2 border-yellow-400 bg-zinc-800 pl-2.5'
          : 'hover:bg-zinc-800/50'
      }`}
    >
      {/* Avatar */}
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-sm font-bold text-white ${
          unreadCount > 0 ? 'ring-2 ring-yellow-400' : ''
        }`}
      >
        {conversation.otherUser.initial}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-semibold text-white">
            {conversation.otherUser.name}
          </span>
          <span className="shrink-0 text-[10px] text-zinc-500">
            {timeAgo(conversation.lastMessageAt)}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-1.5">
          <span className="text-xs">{conversation.itemEmoji}</span>
          <span className="line-clamp-1 text-xs text-zinc-500">
            {conversation.lastMessagePreview}
          </span>
        </div>
      </div>

      {/* Unread badge */}
      {unreadCount > 0 && (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-yellow-400 text-[10px] font-bold text-zinc-950">
          {unreadCount}
        </span>
      )}
    </Link>
  )
}

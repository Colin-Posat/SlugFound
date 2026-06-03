'use client'

import { useEffect, useRef } from 'react'
import type { Conversation, ChatMessage } from '@/app/lib/definitions'
import MessageBubble from './message-bubble'
import MessageComposer from './message-composer'

interface MessageThreadProps {
  conversation: Conversation
  messages: readonly ChatMessage[]
  currentUserId: string
  onSend: (message: ChatMessage) => void
  onBack: () => void
  isLoading?: boolean
}

export default function MessageThread({
  conversation,
  messages,
  currentUserId,
  onSend,
  onBack,
  isLoading = false,
}: MessageThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const isLost = conversation.itemType === 'lost'

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages])

  return (
    <div className="flex flex-1 flex-col overflow-hidden border-l border-line">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-line px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          className="text-muted transition-colors hover:text-ink md:hidden"
          aria-label="Back to conversations"
        >
          ←
        </button>

        {conversation.otherUser.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={conversation.otherUser.avatarUrl}
            alt={conversation.otherUser.name}
            className="h-9 w-9 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-sm font-bold text-ink-soft">
            {conversation.otherUser.initial}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">
            {conversation.otherUser.name}
          </p>
          <div className="flex items-center gap-1.5">
            <span className="truncate text-xs text-muted">
              {conversation.itemEmoji} {conversation.itemTitle}
            </span>
            <span
              className={`shrink-0 rounded-full border px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide ${
                isLost
                  ? 'border-lost/25 bg-lost-soft text-lost'
                  : 'border-found/25 bg-found-soft text-found'
              }`}
            >
              {conversation.itemType}
            </span>
          </div>
        </div>
      </div>

      {/* Messages scroll area */}
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
        {isLoading && messages.length === 0 && (
          <div className="flex flex-1 items-center justify-center py-12">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-gold border-t-transparent" />
          </div>
        )}
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isOwn={message.senderId === currentUserId}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <MessageComposer conversationId={conversation.id} currentUserId={currentUserId} onSend={onSend} />
    </div>
  )
}

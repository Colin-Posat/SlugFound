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
}

export default function MessageThread({
  conversation,
  messages,
  currentUserId,
  onSend,
  onBack,
}: MessageThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const isLost = conversation.itemType === 'lost'

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages])

  return (
    <div className="flex flex-1 flex-col overflow-hidden border-l border-zinc-800">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-zinc-800 px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          className="text-zinc-400 transition-colors hover:text-white md:hidden"
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
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-sm font-bold text-white">
            {conversation.otherUser.initial}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">
            {conversation.otherUser.name}
          </p>
          <div className="flex items-center gap-1.5">
            <span className="truncate text-xs text-zinc-500">
              {conversation.itemEmoji} {conversation.itemTitle}
            </span>
            <span
              className={`shrink-0 rounded-full border px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide ${
                isLost
                  ? 'border-red-500/20 bg-red-500/10 text-red-400'
                  : 'border-green-500/20 bg-green-500/10 text-green-400'
              }`}
            >
              {conversation.itemType}
            </span>
          </div>
        </div>
      </div>

      {/* Messages scroll area */}
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
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

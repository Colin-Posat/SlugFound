'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Conversation, ChatMessage } from '@/app/lib/definitions'
import { MOCK_MESSAGES } from '@/app/lib/mock-messages'
import { useUnread } from '@/app/lib/unread-context'
import ConversationList from './conversation-list'
import MessageThread from './message-thread'
import EmptyThread from './empty-thread'

interface MessagesViewProps {
  conversations: readonly Conversation[]
  activeId: string | null
}

export default function MessagesView({ conversations, activeId }: MessagesViewProps) {
  const router = useRouter()
  const { unreadCounts, clearUnread } = useUnread()

  // Messages are stored in client state, seeded from mock data on first render.
  // They are NOT persisted — refreshing the page resets to mock data.
  // When a database is added, this state should be replaced with a server fetch.
  const [messagesByConversation, setMessagesByConversation] = useState<
    Record<string, readonly ChatMessage[]>
  >(() => ({ ...MOCK_MESSAGES }))

  const activeConversation = activeId
    ? (conversations.find((c) => c.id === activeId) ?? null)
    : null

  // Clear the unread badge whenever a conversation is opened.
  // clearUnread has a stable reference (wrapped in useCallback in UnreadContext)
  // so this effect only re-runs when activeId actually changes.
  useEffect(() => {
    if (activeId) {
      clearUnread(activeId)
    }
  }, [activeId, clearUnread])

  function handleSend(newMessage: ChatMessage) {
    // Immutable append — spread prev state to avoid mutation.
    // The fallback `?? []` handles the edge case where the conversation
    // has no messages yet (e.g. a new conversation with no history).
    setMessagesByConversation((prev) => ({
      ...prev,
      [newMessage.conversationId]: [
        ...(prev[newMessage.conversationId] ?? []),
        newMessage,
      ],
    }))
  }

  // Pushes /messages (no ?c= param) to close the active thread on mobile.
  // On desktop the list stays visible regardless, so this is effectively a no-op.
  function handleBack() {
    router.push('/messages')
  }

  const messages = activeId ? (messagesByConversation[activeId] ?? []) : []

  return (
    // Height calculation:
    // - Mobile: subtract the fixed tab bar height (80px matches pb-20 in (app)/layout.tsx)
    // - Desktop: full viewport height (sidebar is sticky, no tab bar)
    <div className="flex h-[calc(100dvh-80px)] overflow-hidden md:h-screen">
      {/* Conversation list:
          - Mobile with active thread: hidden (thread takes full screen)
          - Mobile without active thread: full width
          - Desktop: always visible as a fixed-width sidebar */}
      <div className={`${activeId ? 'hidden md:flex' : 'flex'} w-full md:w-auto`}>
        <ConversationList
          conversations={conversations}
          activeId={activeId}
          unreadCounts={unreadCounts}
        />
      </div>

      {/* Thread or empty state:
          When activeConversation is null on desktop, EmptyThread shows a placeholder.
          EmptyThread is hidden on mobile (nothing to fill the space). */}
      {activeConversation ? (
        <div className={`${activeId ? 'flex' : 'hidden md:flex'} flex-1 flex-col overflow-hidden`}>
          <MessageThread
            conversation={activeConversation}
            messages={messages}
            onSend={handleSend}
            onBack={handleBack}
          />
        </div>
      ) : (
        <EmptyThread />
      )}
    </div>
  )
}

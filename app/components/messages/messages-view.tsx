'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import type { Conversation, ChatMessage, MessageRow } from '@/app/lib/definitions'
import { useUnread } from '@/app/lib/unread-context'
import { useRealtimeMessages } from '@/app/lib/use-realtime-messages'
import { markConversationRead, fetchConversationMessages, sendConversationMessage } from '@/app/actions/messages'
import ConversationList from './conversation-list'
import MessageThread from './message-thread'
import EmptyThread from './empty-thread'

interface MessagesViewProps {
  conversations: readonly Conversation[]
  activeId: string | null
  currentUserId: string
  initialMessages: Record<string, readonly ChatMessage[]>
}

/**
 * Move a conversation to position 0 and update its preview/timestamp.
 * Returns a new immutable array — never mutates the input.
 *
 * Called when a message is sent or received so the most recently active
 * conversation always sorts to the top. NOT called on markConversationRead
 * (reading/clicking a conversation must not change ordering).
 */
function bubbleConversation(
  list: Conversation[],
  conversationId: string,
  preview: string,
  sentAt: string,
): Conversation[] {
  const idx = list.findIndex((c) => c.id === conversationId)
  if (idx === -1) return list

  const updated: Conversation = {
    ...list[idx],
    lastMessagePreview: preview,
    lastMessageAt: sentAt,
  }

  return [updated, ...list.slice(0, idx), ...list.slice(idx + 1)]
}

/** Read the `?c=` search param from the current URL. */
function getActiveIdFromUrl(): string | null {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get('c') || null
}

export default function MessagesView({
  conversations,
  activeId: serverActiveId,
  currentUserId,
  initialMessages,
}: MessagesViewProps) {
  const { unreadCounts, clearUnread, incrementUnread } = useUnread()

  // ── Client-side active conversation ────────────────────────────────────────
  // Managed entirely in client state so switching is instant (no server round-trip).
  const [clientActiveId, setClientActiveId] = useState<string | null>(serverActiveId)

  // Client-side sorted list — initialised from the server prop sorted by last
  // message time. Re-sorts ONLY when a message is sent or received, never on
  // click/read (which was the previous bug: markConversationRead updated
  // conversations.updated_at → triggered a re-sort that displaced conversations).
  const [sortedConversations, setSortedConversations] = useState<Conversation[]>(() =>
    [...conversations].sort(
      (a, b) =>
        new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
    ),
  )

  const [messagesByConversation, setMessagesByConversation] = useState<
    Record<string, readonly ChatMessage[]>
  >(() => ({ ...initialMessages }))

  const [loadedConversations, setLoadedConversations] = useState<Set<string>>(
    () => new Set(Object.keys(initialMessages)),
  )

  const activeConversation = clientActiveId
    ? (sortedConversations.find((c) => c.id === clientActiveId) ?? null)
    : null

  // ── Select a conversation (client-side only) ──────────────────────────────
  const handleSelectConversation = useCallback((conversationId: string) => {
    setClientActiveId(conversationId)
    // Update the URL for bookmarking / sharing without triggering a server navigation.
    window.history.pushState(null, '', `/messages?c=${conversationId}`)
  }, [])

  // ── Go back to conversation list (client-side only) ───────────────────────
  const handleBack = useCallback(() => {
    setClientActiveId(null)
    window.history.pushState(null, '', '/messages')
  }, [])

  // ── Sync with browser back/forward buttons ────────────────────────────────
  useEffect(() => {
    function onPopState() {
      setClientActiveId(getActiveIdFromUrl())
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  // ── Fetch messages when switching to a conversation not yet loaded ────────
  useEffect(() => {
    if (!clientActiveId || loadedConversations.has(clientActiveId)) return

    fetchConversationMessages(clientActiveId).then((res) => {
      if ('error' in res && res.error) {
        toast.error(res.error)
        return
      }
      const messages = res.messages || []
      setMessagesByConversation((prev) => ({ ...prev, [clientActiveId]: messages }))
      setLoadedConversations((prev) => new Set(prev).add(clientActiveId))
    })
  }, [clientActiveId, loadedConversations])

  // Mark as read when the active conversation changes — does NOT affect ordering.
  useEffect(() => {
    if (clientActiveId) {
      clearUnread(clientActiveId)
      markConversationRead(clientActiveId)
    }
  }, [clientActiveId, clearUnread])

  const handleRealtimeMessage = useCallback(
    (msg: MessageRow) => {
      const chatMessage: ChatMessage = {
        id: msg.id,
        conversationId: msg.conversation_id,
        senderId: msg.sender_id,
        body: msg.body ?? '',
        imageUrl: msg.image_url ?? undefined,
        sentAt: msg.created_at,
      }

      setMessagesByConversation((prev) => ({
        ...prev,
        [msg.conversation_id]: [
          ...(prev[msg.conversation_id] ?? []),
          chatMessage,
        ],
      }))

      // Bubble the conversation to the top when a message arrives.
      const preview = msg.body?.trim() || '📷 Photo'
      setSortedConversations((prev) =>
        bubbleConversation(prev, msg.conversation_id, preview, msg.created_at),
      )

      if (msg.conversation_id === clientActiveId) {
        markConversationRead(msg.conversation_id)
      } else {
        incrementUnread(msg.conversation_id)
      }
    },
    [clientActiveId, incrementUnread],
  )

  useRealtimeMessages({
    currentUserId,
    onNewMessage: handleRealtimeMessage,
  })

  async function handleSend(newMessage: ChatMessage) {
    // Optimistic update — add message to local thread immediately.
    setMessagesByConversation((prev) => ({
      ...prev,
      [newMessage.conversationId]: [
        ...(prev[newMessage.conversationId] ?? []),
        newMessage,
      ],
    }))

    const { error } = await sendConversationMessage(
      newMessage.conversationId,
      newMessage.body || null,
      newMessage.imageUrl ?? null
    )

    if (error) {
      // Rollback optimistic update on failure.
      setMessagesByConversation((prev) => ({
        ...prev,
        [newMessage.conversationId]: (prev[newMessage.conversationId] ?? []).filter(
          (m) => m.id !== newMessage.id,
        ),
      }))
      toast.error('Failed to send message.')
      return
    }

    // Bubble the conversation to top on successful send.
    const preview = newMessage.body.trim() || '📷 Photo'
    setSortedConversations((prev) =>
      bubbleConversation(prev, newMessage.conversationId, preview, newMessage.sentAt),
    )
  }

  const messages = clientActiveId ? (messagesByConversation[clientActiveId] ?? []) : []

  return (
    <div className="flex h-[calc(100dvh-80px)] overflow-hidden md:h-screen">
      <div className={`${clientActiveId ? 'hidden md:flex' : 'flex'} w-full md:w-auto`}>
        <ConversationList
          conversations={sortedConversations}
          activeId={clientActiveId}
          unreadCounts={unreadCounts}
          onSelect={handleSelectConversation}
        />
      </div>

      {activeConversation ? (
        <div className={`${clientActiveId ? 'flex' : 'hidden md:flex'} flex-1 flex-col overflow-hidden`}>
          <MessageThread
            conversation={activeConversation}
            messages={messages}
            currentUserId={currentUserId}
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

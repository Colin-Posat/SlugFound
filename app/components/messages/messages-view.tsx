'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { Conversation, ChatMessage, MessageRow } from '@/app/lib/definitions'
import { createSupabaseBrowserClient } from '@/app/lib/supabase/client'
import { useUnread } from '@/app/lib/unread-context'
import { useRealtimeMessages } from '@/app/lib/use-realtime-messages'
import { markConversationRead } from '@/app/actions/messages'
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

export default function MessagesView({
  conversations,
  activeId,
  currentUserId,
  initialMessages,
}: MessagesViewProps) {
  const router = useRouter()
  const { unreadCounts, clearUnread, incrementUnread } = useUnread()

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

  const activeConversation = activeId
    ? (sortedConversations.find((c) => c.id === activeId) ?? null)
    : null

  // Fetch messages when switching to a conversation not yet loaded
  useEffect(() => {
    if (!activeId || loadedConversations.has(activeId)) return

    const supabase = createSupabaseBrowserClient()
    supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', activeId)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          toast.error('Failed to load messages.')
          return
        }
        const messages: ChatMessage[] = ((data ?? []) as MessageRow[]).map((row) => ({
          id: row.id,
          conversationId: row.conversation_id,
          senderId: row.sender_id,
          body: row.body ?? '',
          imageUrl: row.image_url ?? undefined,
          sentAt: row.created_at,
        }))
        setMessagesByConversation((prev) => ({ ...prev, [activeId]: messages }))
        setLoadedConversations((prev) => new Set(prev).add(activeId))
      })
  }, [activeId, loadedConversations])

  // Mark as read when the active conversation changes — does NOT affect ordering.
  useEffect(() => {
    if (activeId) {
      clearUnread(activeId)
      markConversationRead(activeId)
    }
  }, [activeId, clearUnread])

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

      if (msg.conversation_id === activeId) {
        markConversationRead(msg.conversation_id)
      } else {
        incrementUnread(msg.conversation_id)
      }
    },
    [activeId, incrementUnread],
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

    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.from('messages').insert({
      conversation_id: newMessage.conversationId,
      sender_id: currentUserId,
      body: newMessage.body || null,         // empty string → null in DB
      image_url: newMessage.imageUrl ?? null,
    })

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

  function handleBack() {
    router.push('/messages')
  }

  const messages = activeId ? (messagesByConversation[activeId] ?? []) : []

  return (
    <div className="flex h-[calc(100dvh-80px)] overflow-hidden md:h-screen">
      <div className={`${activeId ? 'hidden md:flex' : 'flex'} w-full md:w-auto`}>
        <ConversationList
          conversations={sortedConversations}
          activeId={activeId}
          unreadCounts={unreadCounts}
        />
      </div>

      {activeConversation ? (
        <div className={`${activeId ? 'flex' : 'hidden md:flex'} flex-1 flex-col overflow-hidden`}>
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

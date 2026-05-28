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

export default function MessagesView({
  conversations,
  activeId,
  currentUserId,
  initialMessages,
}: MessagesViewProps) {
  const router = useRouter()
  const { unreadCounts, clearUnread, incrementUnread } = useUnread()

  const [messagesByConversation, setMessagesByConversation] = useState<
    Record<string, readonly ChatMessage[]>
  >(() => ({ ...initialMessages }))

  const [loadedConversations, setLoadedConversations] = useState<Set<string>>(
    () => new Set(Object.keys(initialMessages)),
  )

  const activeConversation = activeId
    ? (conversations.find((c) => c.id === activeId) ?? null)
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
          body: row.body,
          sentAt: row.created_at,
        }))
        setMessagesByConversation((prev) => ({ ...prev, [activeId]: messages }))
        setLoadedConversations((prev) => new Set(prev).add(activeId))
      })
  }, [activeId, loadedConversations])

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
        body: msg.body,
        sentAt: msg.created_at,
      }

      setMessagesByConversation((prev) => ({
        ...prev,
        [msg.conversation_id]: [
          ...(prev[msg.conversation_id] ?? []),
          chatMessage,
        ],
      }))

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
      body: newMessage.body,
    })

    if (error) {
      setMessagesByConversation((prev) => ({
        ...prev,
        [newMessage.conversationId]: (prev[newMessage.conversationId] ?? []).filter(
          (m) => m.id !== newMessage.id,
        ),
      }))
      toast.error('Failed to send message.')
    }
  }

  function handleBack() {
    router.push('/messages')
  }

  const messages = activeId ? (messagesByConversation[activeId] ?? []) : []

  return (
    <div className="flex h-[calc(100dvh-80px)] overflow-hidden md:h-screen">
      <div className={`${activeId ? 'hidden md:flex' : 'flex'} w-full md:w-auto`}>
        <ConversationList
          conversations={conversations}
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

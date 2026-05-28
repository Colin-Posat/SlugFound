'use client'

import { useEffect, useRef } from 'react'
import { createSupabaseBrowserClient } from '@/app/lib/supabase/client'
import type { MessageRow } from '@/app/lib/definitions'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface UseRealtimeMessagesOptions {
  currentUserId: string
  onNewMessage: (message: MessageRow) => void
}

export function useRealtimeMessages({
  currentUserId,
  onNewMessage,
}: UseRealtimeMessagesOptions) {
  const callbackRef = useRef(onNewMessage)

  useEffect(() => {
    callbackRef.current = onNewMessage
  }, [onNewMessage])

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()

    const channel: RealtimeChannel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const msg = payload.new as MessageRow
          if (msg.sender_id !== currentUserId) {
            callbackRef.current(msg)
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId])
}

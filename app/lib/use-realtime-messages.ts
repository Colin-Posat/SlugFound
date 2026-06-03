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
  const supabaseRef = useRef(createSupabaseBrowserClient())

  useEffect(() => {
    callbackRef.current = onNewMessage
  }, [onNewMessage])

  useEffect(() => {
    const supabase = supabaseRef.current

    const channel: RealtimeChannel = supabase
      .channel(`messages-realtime-${currentUserId}`)
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
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('[realtime] channel error:', err?.message)
        }
        if (status === 'TIMED_OUT') {
          console.warn('[realtime] subscription timed out for user', currentUserId)
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId])
}

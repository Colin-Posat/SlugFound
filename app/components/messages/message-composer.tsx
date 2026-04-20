'use client'

import { useState, type KeyboardEvent } from 'react'
import type { ChatMessage } from '@/app/lib/definitions'
import { CURRENT_USER_ID } from '@/app/lib/definitions'

interface MessageComposerProps {
  conversationId: string
  onSend: (message: ChatMessage) => void
}

export default function MessageComposer({ conversationId, onSend }: MessageComposerProps) {
  const [draft, setDraft] = useState('')

  function handleSend() {
    const trimmed = draft.trim()
    if (!trimmed) return

    const newMessage: ChatMessage = {
      id: crypto.randomUUID(),
      conversationId,
      senderId: CURRENT_USER_ID,
      body: trimmed,
      sentAt: new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      }),
    }

    onSend(newMessage)
    setDraft('')
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex shrink-0 items-end gap-3 border-t border-zinc-800 p-4">
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Send a message… (Enter to send, Shift+Enter for new line)"
        rows={1}
        className="flex-1 resize-none rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
      />
      <button
        type="button"
        onClick={handleSend}
        disabled={!draft.trim()}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-400 text-lg font-bold text-zinc-950 transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Send message"
      >
        ↑
      </button>
    </div>
  )
}

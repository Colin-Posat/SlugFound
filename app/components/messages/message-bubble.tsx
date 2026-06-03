'use client'

import { useState } from 'react'
import type { ChatMessage } from '@/app/lib/definitions'
import { formatMessageTime } from '@/app/lib/format'

interface MessageBubbleProps {
  message: ChatMessage
  isOwn: boolean
}

export default function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const hasText = message.body && message.body.trim().length > 0
  const hasImage = Boolean(message.imageUrl)

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className="flex max-w-[75%] flex-col gap-1">
        <div
          className={`overflow-hidden rounded-2xl text-sm leading-relaxed ${
            isOwn
              ? 'rounded-br-sm bg-gold text-on-gold'
              : 'rounded-bl-sm border border-line bg-surface text-ink'
          }`}
        >
          {/* Image attachment */}
          {hasImage && (
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              className="block w-full cursor-pointer hover:opacity-95 transition"
              aria-label="View full image"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={message.imageUrl}
                alt="Attached photo"
                className="block max-h-60 w-full object-cover"
              />
            </button>
          )}

          {/* Text body */}
          {hasText && (
            <p className={`px-4 py-2.5 ${hasImage ? 'pt-2' : ''}`}>{message.body}</p>
          )}
        </div>

        <span
          className={`font-mono text-[10px] text-muted ${isOwn ? 'text-right' : 'text-left'}`}
        >
          {formatMessageTime(message.sentAt)}
        </span>
      </div>

      {/* Full-screen image overlay */}
      {isExpanded && message.imageUrl && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setIsExpanded(false)}
        >
          <button 
            className="absolute top-6 right-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            onClick={() => setIsExpanded(false)}
          >
            <span className="sr-only">Close</span>
            ✕
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={message.imageUrl} 
            alt="Attached photo full size" 
            className="max-h-[90vh] max-w-[100vw] rounded-lg object-contain md:max-w-[90vw]"
          />
        </div>
      )}
    </div>
  )
}

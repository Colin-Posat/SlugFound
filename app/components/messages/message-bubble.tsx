import type { ChatMessage } from '@/app/lib/definitions'
import { formatMessageTime } from '@/app/lib/format'

interface MessageBubbleProps {
  message: ChatMessage
  isOwn: boolean
}

export default function MessageBubble({ message, isOwn }: MessageBubbleProps) {
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
            <a
              href={message.imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View full image"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={message.imageUrl}
                alt="Attached photo"
                className="block max-h-60 w-full object-cover"
              />
            </a>
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
    </div>
  )
}

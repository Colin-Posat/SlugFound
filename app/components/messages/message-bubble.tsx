import type { ChatMessage } from '@/app/lib/definitions'

interface MessageBubbleProps {
  message: ChatMessage
  isOwn: boolean
}

export default function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className="flex max-w-[75%] flex-col gap-1">
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isOwn
              ? 'rounded-br-sm bg-yellow-400 text-zinc-950'
              : 'rounded-bl-sm bg-zinc-800 text-zinc-100'
          }`}
        >
          {message.body}
        </div>
        <span
          className={`text-[10px] text-zinc-600 ${isOwn ? 'text-right' : 'text-left'}`}
        >
          {message.sentAt}
        </span>
      </div>
    </div>
  )
}

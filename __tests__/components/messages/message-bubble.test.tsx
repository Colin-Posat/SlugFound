import { render, screen } from '@testing-library/react'
import MessageBubble from '@/app/components/messages/message-bubble'
import type { ChatMessage } from '@/app/lib/definitions'

const MESSAGE: ChatMessage = {
  id: 'msg-1',
  conversationId: 'conv-1',
  senderId: 'user-a',
  body: 'Hello there!',
  sentAt: new Date().toISOString(),
}

describe('MessageBubble', () => {
  it('renders the message body', () => {
    render(<MessageBubble message={MESSAGE} isOwn={false} />)
    expect(screen.getByText('Hello there!')).toBeInTheDocument()
  })

  it('formats ISO timestamp for display', () => {
    const msg = { ...MESSAGE, sentAt: '2026-05-28T14:30:00Z' }
    render(<MessageBubble message={msg} isOwn={false} />)
    const timeEl = screen.getByText(/\d/)
    expect(timeEl).toBeInTheDocument()
  })

  it('applies the gold accent background for own messages', () => {
    const { container } = render(<MessageBubble message={MESSAGE} isOwn={true} />)
    const bubble = container.querySelector('.bg-gold')
    expect(bubble).toBeInTheDocument()
  })

  it('applies the surface background for other messages', () => {
    const { container } = render(<MessageBubble message={MESSAGE} isOwn={false} />)
    const bubble = container.querySelector('.bg-surface')
    expect(bubble).toBeInTheDocument()
  })
})

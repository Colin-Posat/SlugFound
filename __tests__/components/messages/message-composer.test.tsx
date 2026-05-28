import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MessageComposer from '@/app/components/messages/message-composer'

describe('MessageComposer', () => {
  it('calls onSend with the current user ID as senderId', async () => {
    const user = userEvent.setup()
    const onSend = jest.fn()

    render(
      <MessageComposer
        conversationId="conv-1"
        currentUserId="real-user-id"
        onSend={onSend}
      />,
    )

    const input = screen.getByPlaceholderText(/send a message/i)
    await user.type(input, 'Hello!')
    await user.keyboard('{Enter}')

    expect(onSend).toHaveBeenCalledTimes(1)
    const sent = onSend.mock.calls[0][0]
    expect(sent.senderId).toBe('real-user-id')
    expect(sent.conversationId).toBe('conv-1')
    expect(sent.body).toBe('Hello!')
  })

  it('sends an ISO timestamp in sentAt', async () => {
    const user = userEvent.setup()
    const onSend = jest.fn()

    render(
      <MessageComposer
        conversationId="conv-1"
        currentUserId="user-1"
        onSend={onSend}
      />,
    )

    await user.type(screen.getByPlaceholderText(/send a message/i), 'test')
    await user.keyboard('{Enter}')

    const sent = onSend.mock.calls[0][0]
    expect(() => new Date(sent.sentAt).toISOString()).not.toThrow()
  })

  it('does not send an empty message', async () => {
    const user = userEvent.setup()
    const onSend = jest.fn()

    render(
      <MessageComposer
        conversationId="conv-1"
        currentUserId="user-1"
        onSend={onSend}
      />,
    )

    await user.keyboard('{Enter}')
    expect(onSend).not.toHaveBeenCalled()
  })

  it('clears the input after sending', async () => {
    const user = userEvent.setup()
    const onSend = jest.fn()

    render(
      <MessageComposer
        conversationId="conv-1"
        currentUserId="user-1"
        onSend={onSend}
      />,
    )

    const input = screen.getByPlaceholderText(/send a message/i)
    await user.type(input, 'Hello')
    await user.keyboard('{Enter}')

    expect(input).toHaveValue('')
  })
})

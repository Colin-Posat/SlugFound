import { toChatMessage, toConversation } from '@/app/lib/conversations'
import type { ConversationRow, MessageRow } from '@/app/lib/definitions'

describe('toChatMessage', () => {
  const row: MessageRow = {
    id: 'msg-1',
    conversation_id: 'conv-1',
    sender_id: 'user-a',
    body: 'Hello there',
    created_at: '2026-05-28T10:00:00Z',
  }

  it('maps a MessageRow to a ChatMessage', () => {
    const result = toChatMessage(row)
    expect(result).toEqual({
      id: 'msg-1',
      conversationId: 'conv-1',
      senderId: 'user-a',
      body: 'Hello there',
      sentAt: '2026-05-28T10:00:00Z',
    })
  })

  it('preserves the ISO timestamp in sentAt', () => {
    const result = toChatMessage(row)
    expect(new Date(result.sentAt).toISOString()).toBe('2026-05-28T10:00:00.000Z')
  })
})

describe('toConversation', () => {
  const convRow: ConversationRow = {
    id: 'conv-1',
    item_id: 'item-1',
    user_a: 'aaa-aaa',
    user_b: 'bbb-bbb',
    user_a_last_read_at: '2026-05-28T09:00:00Z',
    user_b_last_read_at: '2026-05-28T09:00:00Z',
    created_at: '2026-05-27T10:00:00Z',
    updated_at: '2026-05-28T10:00:00Z',
  }

  const otherProfile = {
    id: 'bbb-bbb',
    display_name: 'Jordan Kim',
    avatar_url: null,
    college: 'Stevenson',
  }

  const item = {
    id: 'item-1',
    title: 'AirPods Pro',
    emoji: '🎧',
    type: 'lost' as const,
  }

  const lastMessage = { body: 'Are they still in the case?', created_at: '2026-05-28T10:30:00Z' }

  it('maps a ConversationRow to a Conversation with correct otherUser', () => {
    const result = toConversation(convRow, 'aaa-aaa', otherProfile, item, lastMessage, 2)

    expect(result.id).toBe('conv-1')
    expect(result.otherUser.id).toBe('bbb-bbb')
    expect(result.otherUser.name).toBe('Jordan Kim')
    expect(result.otherUser.initial).toBe('J')
    expect(result.otherUser.college).toBe('Stevenson')
  })

  it('uses the item fields', () => {
    const result = toConversation(convRow, 'aaa-aaa', otherProfile, item, lastMessage, 2)
    expect(result.itemId).toBe('item-1')
    expect(result.itemTitle).toBe('AirPods Pro')
    expect(result.itemEmoji).toBe('🎧')
    expect(result.itemType).toBe('lost')
  })

  it('uses lastMessage for preview and timestamp', () => {
    const result = toConversation(convRow, 'aaa-aaa', otherProfile, item, lastMessage, 2)
    expect(result.lastMessagePreview).toBe('Are they still in the case?')
    expect(result.lastMessageAt).toBe('2026-05-28T10:30:00Z')
    expect(result.unreadCount).toBe(2)
  })

  it('falls back to empty preview when no last message', () => {
    const result = toConversation(convRow, 'aaa-aaa', otherProfile, item, null, 0)
    expect(result.lastMessagePreview).toBe('')
    expect(result.lastMessageAt).toBe(convRow.created_at)
    expect(result.unreadCount).toBe(0)
  })

  it('defaults emoji to 📦 when item has no emoji', () => {
    const noEmoji = { ...item, emoji: null }
    const result = toConversation(convRow, 'aaa-aaa', otherProfile, noEmoji, lastMessage, 0)
    expect(result.itemEmoji).toBe('📦')
  })
})

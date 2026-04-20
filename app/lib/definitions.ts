import { z } from 'zod'

export const LoginFormSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }).trim(),
  password: z.string().min(1, { message: 'Password is required.' }).trim(),
})

export type FormState =
  | {
      errors?: {
        email?: string[]
        password?: string[]
      }
      message?: string
    }
  | undefined

export type SessionPayload = {
  userId: string
  expiresAt: Date
}

// ── Messaging ──────────────────────────────────────────────

export type MessageUser = {
  id: string
  name: string
  initial: string
  college?: string
}

export type ChatMessage = {
  id: string
  conversationId: string
  senderId: string
  body: string
  sentAt: string
}

export type Conversation = {
  id: string
  otherUser: MessageUser
  itemId: string
  itemTitle: string
  itemEmoji: string
  itemType: 'lost' | 'found'
  lastMessagePreview: string
  lastMessageAt: string
  unreadCount: number
}

export const CURRENT_USER_ID = 'me'

// ── Item listings ──────────────────────────────────────────

export type Item = {
  id: string
  type: 'lost' | 'found'
  title: string
  category: string
  location: string
  time: string
  description: string
  emoji: string
}

// ⚠️ This entire file is mock data. When a database is added:
//   - Replace MOCK_CONVERSATIONS with a DB query for the current user's conversations
//   - Replace MOCK_MESSAGES with a DB query for messages in a given conversation
//   - Remove CURRENT_USER and TOTAL_UNREAD — derive them from real session + DB data

import type { MessageUser, ChatMessage, Conversation } from './definitions'

// CURRENT_USER represents the logged-in user in mock data.
// CURRENT_USER_ID ('me') is also defined in definitions.ts and used in components
// to determine message bubble direction. Both must match until real auth is wired in.
export const CURRENT_USER: MessageUser = {
  id: 'me',
  name: 'Sam Slug',
  initial: 'S',
  college: 'Cowell',
}

export const MOCK_USERS: readonly MessageUser[] = [
  { id: 'u1', name: 'Jordan Kim', initial: 'J', college: 'Stevenson' },
  { id: 'u2', name: 'Priya Nair', initial: 'P', college: 'Merrill' },
  { id: 'u3', name: 'Leo Torres', initial: 'L', college: 'Crown' },
  { id: 'u4', name: 'Maya Chen', initial: 'M', college: 'Porter' },
  { id: 'u5', name: 'Diego Reyes', initial: 'D', college: 'Oakes' },
]

export const MOCK_CONVERSATIONS: readonly Conversation[] = [
  {
    id: 'conv-1',
    otherUser: MOCK_USERS[0],
    itemId: '1',
    itemTitle: 'AirPods Pro (2nd Gen)',
    itemEmoji: '🎧',
    itemType: 'lost',
    lastMessagePreview: 'Are they still in the case?',
    lastMessageAt: '2h',
    unreadCount: 2,
  },
  {
    id: 'conv-2',
    otherUser: MOCK_USERS[1],
    itemId: '3',
    itemTitle: 'Student ID Card',
    itemEmoji: '🪪',
    itemType: 'found',
    lastMessagePreview: 'I can meet in Merrill tomorrow at 3pm',
    lastMessageAt: '1d',
    unreadCount: 1,
  },
  {
    id: 'conv-3',
    otherUser: MOCK_USERS[2],
    itemId: '5',
    itemTitle: 'Hydro Flask (32oz)',
    itemEmoji: '🫙',
    itemType: 'lost',
    lastMessagePreview: 'I think I saw it in Kresge lobby',
    lastMessageAt: '3d',
    unreadCount: 0,
  },
  {
    id: 'conv-4',
    otherUser: MOCK_USERS[3],
    itemId: '6',
    itemTitle: 'Prescription Glasses',
    itemEmoji: '👓',
    itemType: 'lost',
    lastMessagePreview: "Yes! Those are mine. Thank you!",
    lastMessageAt: '4d',
    unreadCount: 0,
  },
  {
    id: 'conv-5',
    otherUser: MOCK_USERS[4],
    itemId: '8',
    itemTitle: 'Honda Car Keys',
    itemEmoji: '🔑',
    itemType: 'lost',
    lastMessagePreview: 'Can you meet at Quarry Plaza?',
    lastMessageAt: '6h',
    unreadCount: 3,
  },
]

export const MOCK_MESSAGES: Readonly<Record<string, readonly ChatMessage[]>> = {
  'conv-1': [
    { id: 'm1-1', conversationId: 'conv-1', senderId: 'u1', body: 'Hey! I saw your post about the AirPods. I think I found a pair in McHenry near the 3rd floor quiet section.', sentAt: '10:12 AM' },
    { id: 'm1-2', conversationId: 'conv-1', senderId: 'me', body: "Oh wow, really?! That's exactly where I left them. Are they still in the case?", sentAt: '10:15 AM' },
    { id: 'm1-3', conversationId: 'conv-1', senderId: 'u1', body: 'Yes! White case, small scratch on the lid — that matches your description.', sentAt: '10:16 AM' },
    { id: 'm1-4', conversationId: 'conv-1', senderId: 'me', body: "That's definitely mine! When can we meet to pick them up?", sentAt: '10:18 AM' },
    { id: 'm1-5', conversationId: 'conv-1', senderId: 'u1', body: "I'm at McHenry until 1pm today. Just ask for Jordan at the front desk!", sentAt: '10:20 AM' },
    { id: 'm1-6', conversationId: 'conv-1', senderId: 'u1', body: 'Are they still in the case?', sentAt: '11:30 AM' },
  ],
  'conv-2': [
    { id: 'm2-1', conversationId: 'conv-2', senderId: 'u2', body: 'Hi! I found a UCSC student ID near the Cowell/Stevenson bus stop. Is this yours?', sentAt: '9:00 AM' },
    { id: 'm2-2', conversationId: 'conv-2', senderId: 'me', body: "Yes! That's mine — Jordan Kim, Class of 2026. Thank you for posting it!", sentAt: '9:05 AM' },
    { id: 'm2-3', conversationId: 'conv-2', senderId: 'u2', body: "Great! How can I get it back to you? I'm usually on the east side of campus.", sentAt: '9:08 AM' },
    { id: 'm2-4', conversationId: 'conv-2', senderId: 'me', body: "I can meet anywhere on campus, totally flexible.", sentAt: '9:10 AM' },
    { id: 'm2-5', conversationId: 'conv-2', senderId: 'u2', body: "I can meet in Merrill tomorrow at 3pm", sentAt: '9:12 AM' },
  ],
  'conv-3': [
    { id: 'm3-1', conversationId: 'conv-3', senderId: 'u3', body: 'Hey, did you ever find your Hydro Flask? I think I may have seen it.', sentAt: '2:00 PM' },
    { id: 'm3-2', conversationId: 'conv-3', senderId: 'me', body: 'Not yet! Does it have stickers on it?', sentAt: '2:03 PM' },
    { id: 'm3-3', conversationId: 'conv-3', senderId: 'u3', body: 'Yes — banana slug sticker and a Golden Gate Bridge one. Black bottle.', sentAt: '2:05 PM' },
    { id: 'm3-4', conversationId: 'conv-3', senderId: 'me', body: "That's mine!! Where did you see it?", sentAt: '2:06 PM' },
    { id: 'm3-5', conversationId: 'conv-3', senderId: 'u3', body: 'I think I saw it in Kresge lobby', sentAt: '2:08 PM' },
  ],
  'conv-4': [
    { id: 'm4-1', conversationId: 'conv-4', senderId: 'me', body: 'Hi Maya, did you happen to find a pair of round black-frame glasses near Oakes Learning Center?', sentAt: '11:00 AM' },
    { id: 'm4-2', conversationId: 'conv-4', senderId: 'u4', body: 'Yes! I found them yesterday and turned them in to the Oakes front desk.', sentAt: '11:04 AM' },
    { id: 'm4-3', conversationId: 'conv-4', senderId: 'me', body: "Oh thank goodness. I've been struggling without them. Was it in a brown case?", sentAt: '11:06 AM' },
    { id: 'm4-4', conversationId: 'conv-4', senderId: 'u4', body: "Yes, brown faux-leather case. They're waiting for you at the front desk!", sentAt: '11:08 AM' },
    { id: 'm4-5', conversationId: 'conv-4', senderId: 'me', body: "Yes! Those are mine. Thank you!", sentAt: '11:09 AM' },
  ],
  'conv-5': [
    { id: 'm5-1', conversationId: 'conv-5', senderId: 'u5', body: 'Yo, I found some keys at Quarry Plaza. Honda fob with a red lanyard and a rubber duck keychain.', sentAt: '8:15 AM' },
    { id: 'm5-2', conversationId: 'conv-5', senderId: 'me', body: "That's my keys!! I've been stranded without them. Are you still there?", sentAt: '8:20 AM' },
    { id: 'm5-3', conversationId: 'conv-5', senderId: 'u5', body: "I left already but I can bring them to campus tomorrow. Where are you usually?", sentAt: '8:22 AM' },
    { id: 'm5-4', conversationId: 'conv-5', senderId: 'me', body: "I'm usually at Baskin in the mornings, around 9–10am.", sentAt: '8:25 AM' },
    { id: 'm5-5', conversationId: 'conv-5', senderId: 'u5', body: 'Can you meet at Quarry Plaza?', sentAt: '8:30 AM' },
  ],
}

export function getMessagesFor(conversationId: string): readonly ChatMessage[] {
  return MOCK_MESSAGES[conversationId] ?? []
}

export const TOTAL_UNREAD = MOCK_CONVERSATIONS.reduce(
  (sum, c) => sum + c.unreadCount,
  0,
)

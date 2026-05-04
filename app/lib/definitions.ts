/**
 * Shared types used across the app.
 *
 * Auth-related types are now in @/app/actions/auth.ts (the schemas + AuthFormState).
 * This file holds purely-data types and Item-related shapes.
 */

// ─── Items ──────────────────────────────────────────────────────────────────

export type ItemType = 'lost' | 'found'
export type ItemStatus = 'active' | 'claimed' | 'resolved'

export const ITEM_CATEGORIES = [
  'Electronics',
  'Clothing',
  'Accessories',
  'Books',
  'Keys',
  'ID/Cards',
  'Water Bottle',
  'Personal Items',
  'Other',
] as const

export type ItemCategory = (typeof ITEM_CATEGORIES)[number]

/**
 * Item shape as returned by the database. Matches public.items columns
 * defined in /supabase/migrations/0002_items.sql.
 *
 * `profile` is populated when we join via `select('*, profile:profiles(*)')`
 * to display the poster's name/avatar on listing cards.
 */
export type Item = {
  id: string
  user_id: string
  type: ItemType
  title: string
  description: string
  category: string
  location: string
  status: ItemStatus
  image_url: string | null
  emoji: string | null
  created_at: string
  updated_at: string
  // Hydrated when we join the profiles table (optional)
  profile?: Pick<Profile, 'id' | 'display_name' | 'avatar_url'> | null
}

// ─── Profiles ───────────────────────────────────────────────────────────────

export type Profile = {
  id: string
  display_name: string
  email: string
  avatar_url: string | null
  college: string | null
  created_at: string
  updated_at: string
}

// ─── Messaging (still mock for Sprint 2 — see /app/lib/mock-messages.ts) ────

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
  itemType: ItemType
  lastMessagePreview: string
  lastMessageAt: string
  unreadCount: number
}

export const CURRENT_USER_ID = 'me'

// ─── Campus locations (used by Create form + filters) ───────────────────────

export const UCSC_LOCATIONS = [
  'McHenry Library',
  'Science & Engineering Library',
  'Baskin Engineering',
  'Cowell College',
  'Stevenson College',
  'Crown College',
  'Merrill College',
  'Kresge College',
  'Porter College',
  'Oakes College',
  'Rachel Carson College',
  'Quarry Plaza',
  'Dining Hall',
  'Bus Stop',
  'Other',
] as const

export type UcscLocation = (typeof UCSC_LOCATIONS)[number]

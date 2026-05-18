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
  lat: number | null
  lng: number | null
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

export const UCSC_PRESET_LOCATIONS = [
  { label: 'McHenry Library',              lat: 36.9996, lng: -122.0579 },
  { label: 'Science & Engineering Library', lat: 37.0002, lng: -122.0626 },
  { label: 'Baskin Engineering',            lat: 37.0000, lng: -122.0643 },
  { label: 'Cowell College',                lat: 36.9987, lng: -122.0562 },
  { label: 'Stevenson College',             lat: 36.9976, lng: -122.0569 },
  { label: 'Crown College',                 lat: 37.0004, lng: -122.0596 },
  { label: 'Merrill College',               lat: 36.9990, lng: -122.0608 },
  { label: 'Kresge College',                lat: 37.0014, lng: -122.0638 },
  { label: 'Porter College',                lat: 37.0030, lng: -122.0657 },
  { label: 'Oakes College',                 lat: 36.9944, lng: -122.0620 },
  { label: 'Rachel Carson College',         lat: 36.9958, lng: -122.0638 },
  { label: 'Quarry Plaza',                  lat: 36.9996, lng: -122.0603 },
  { label: 'Dining Hall',                   lat: 36.9993, lng: -122.0572 },
  { label: 'Bus Stop',                      lat: 36.9985, lng: -122.0558 },
] as const

export type UcscPresetLocation = (typeof UCSC_PRESET_LOCATIONS)[number]

// Backward-compat string array — items-filter.tsx and the filter query use this.
export const UCSC_LOCATIONS = [
  ...UCSC_PRESET_LOCATIONS.map((p) => p.label),
  'Other',
] as const satisfies readonly string[]

export type UcscLocation = (typeof UCSC_LOCATIONS)[number]

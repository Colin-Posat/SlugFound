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
  reported_flag: boolean
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
  email_notifications: boolean
  created_at: string
  updated_at: string
}

// ─── Messaging (UI-facing shapes) ──────────────────────────────────────────

export type MessageUser = {
  id: string
  name: string
  initial: string
  avatarUrl?: string
  college?: string
}

export type ChatMessage = {
  id: string
  conversationId: string
  senderId: string
  body: string        // empty string for image-only messages (UI layer)
  imageUrl?: string   // Supabase Storage public URL for a photo attachment
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

// ─── Messaging (DB row shapes — match supabase/migrations/0006) ────────────

export type ConversationRow = {
  id: string
  item_id: string
  user_a: string
  user_b: string
  user_a_last_read_at: string
  user_b_last_read_at: string
  created_at: string
  updated_at: string
}

export type MessageRow = {
  id: string
  conversation_id: string
  sender_id: string
  body: string | null   // nullable — image-only messages have no text body
  image_url: string | null
  created_at: string
}

// ─── Reports (US 4.6) ───────────────────────────────────────────────────────

export const REPORT_REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'offensive', label: 'Offensive or inappropriate' },
  { value: 'duplicate', label: 'Duplicate listing' },
  { value: 'other', label: 'Other' },
] as const

export type ReportReason = (typeof REPORT_REASONS)[number]['value']

// ─── Campus locations (used by Create form + filters) ───────────────────────

// Coordinates sourced from OpenStreetMap (Nominatim) — the same data behind the
// map tiles — so pins line up with the labelled buildings on the map.
export const UCSC_PRESET_LOCATIONS = [
  { label: 'McHenry Library',               lat: 36.9954, lng: -122.0590 },
  { label: 'Science & Engineering Library', lat: 36.9991, lng: -122.0608 },
  { label: 'Baskin Engineering',            lat: 37.0004, lng: -122.0632 },
  { label: 'Cowell College',                lat: 36.9969, lng: -122.0540 },
  { label: 'Stevenson College',             lat: 36.9970, lng: -122.0519 },
  { label: 'Crown College',                 lat: 36.9999, lng: -122.0548 },
  { label: 'Merrill College',               lat: 37.0001, lng: -122.0531 },
  { label: 'Kresge College',                lat: 36.9980, lng: -122.0659 },
  { label: 'Porter College',                lat: 36.9944, lng: -122.0653 },
  { label: 'Oakes College',                 lat: 36.9901, lng: -122.0630 },
  { label: 'Rachel Carson College',         lat: 36.9914, lng: -122.0649 },
  { label: 'Quarry Plaza',                  lat: 36.9978, lng: -122.0556 },
  { label: 'Dining Hall',                   lat: 36.9966, lng: -122.0535 },
  { label: 'Bus Stop',                      lat: 36.9973, lng: -122.0561 },
] as const

export type UcscPresetLocation = (typeof UCSC_PRESET_LOCATIONS)[number]

// Backward-compat string array — items-filter.tsx and the filter query use this.
export const UCSC_LOCATIONS = [
  ...UCSC_PRESET_LOCATIONS.map((p) => p.label),
  'Other',
] as const satisfies readonly string[]

export type UcscLocation = (typeof UCSC_LOCATIONS)[number]

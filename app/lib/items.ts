/**
 * Items repository — thin wrapper around Supabase queries on the `items` table.
 *
 * All callers should go through these functions instead of writing inline
 * supabase.from('items')... — keeps query logic in one place and makes it
 * trivial to swap implementations (e.g. add caching, batch joins, etc.).
 *
 * Server-only: imports the SSR client. Use these from server components and
 * server actions. Client components should call server actions, not these
 * directly.
 */

import 'server-only'
import { cache } from 'react'
import { createSupabaseServerClient } from './supabase/server'
import type { Item, ItemType } from './definitions'

export interface ListItemsOptions {
  type: ItemType
  search?: string
  category?: string  // 'All' or undefined → no filter
  location?: string  // empty string or undefined → no filter
  activeOnly?: boolean // when true, hide claimed/resolved items (US 4.3)
  limit?: number
}

/**
 * Fetch items of a given type (lost/found) with optional filters.
 *
 * Joins `profiles` so each item carries the poster's display_name + avatar
 * for rendering on listing cards.
 *
 * Ordering (US 4.3): active items first, then claimed/resolved. We rely on the
 * `item_status` enum being defined as ('active','claimed','resolved') — ascending
 * enum order is exactly active → claimed → resolved. Within each group, newest
 * first by created_at.
 */
export async function listItems(opts: ListItemsOptions): Promise<Item[]> {
  const { type, search, category, location, activeOnly, limit = 100 } = opts
  const supabase = await createSupabaseServerClient()

  let query = supabase
    .from('items')
    .select('*, profile:profiles(id, display_name, avatar_url)')
    .eq('type', type)
    .order('status', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (activeOnly) {
    query = query.eq('status', 'active')
  }

  // Search across title + description using Postgres ILIKE (case-insensitive).
  // The `or` filter format is: 'col1.ilike.%term%,col2.ilike.%term%'.
  if (search && search.trim().length > 0) {
    const term = search.trim().replace(/[%_]/g, '\\$&') // escape ILIKE wildcards
    query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`)
  }

  if (category && category !== 'All') {
    query = query.eq('category', category)
  }

  if (location) {
    // Use ILIKE so 'Kresge' matches 'Kresge College'
    query = query.ilike('location', `%${location}%`)
  }

  const { data, error } = await query
  if (error) {
    console.error('[items.listItems] failed:', error.message)
    return []
  }
  return (data ?? []) as Item[]
}

/**
 * Fetch a single item by id (with poster profile joined).
 *
 * Wrapped in React `cache()` so that a detail page and its `generateMetadata`
 * (which both need the item) share a single Supabase query per request.
 * Supabase calls aren't auto-memoized the way `fetch` is, so we memoize here.
 */
export const getItemById = cache(async (id: string): Promise<Item | null> => {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('items')
    .select('*, profile:profiles(id, display_name, avatar_url)')
    .eq('id', id)
    .single()

  if (error) {
    console.error('[items.getItemById] failed:', error.message)
    return null
  }
  return data as Item
})

/** Stats used by the Account page (US 2.6). */
export interface UserItemStats {
  totalPosts: number
  reunited: number  // claimed + resolved
  active: number
}

export async function getUserItemStats(userId: string): Promise<UserItemStats> {
  const supabase = await createSupabaseServerClient()

  // Use head: true with count: 'exact' to count rows without fetching them
  const [totalRes, activeRes, reunitedRes] = await Promise.all([
    supabase
      .from('items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'active'),
    supabase
      .from('items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('status', ['claimed', 'resolved']),
  ])

  return {
    totalPosts: totalRes.count ?? 0,
    active: activeRes.count ?? 0,
    reunited: reunitedRes.count ?? 0,
  }
}

/** Fetch items posted by a specific user (for Profile → My Listings). */
export async function listUserItems(userId: string, limit = 50): Promise<Item[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[items.listUserItems] failed:', error.message)
    return []
  }
  return (data ?? []) as Item[]
}

/**
 * Browser-side Supabase client.
 *
 * Use this in any client component (`'use client'` files) that needs to
 * read or mutate Supabase data, listen to auth state changes, or call
 * `supabase.auth.signInWithPassword()` / `supabase.from(...).select()`.
 *
 * This client reads/writes the auth session from browser cookies via the
 * @supabase/ssr package, which keeps it in sync with the server client.
 *
 * Usage:
 *   'use client'
 *   import { createSupabaseBrowserClient } from '@/app/lib/supabase/client'
 *   const supabase = createSupabaseBrowserClient()
 */
import { createBrowserClient } from '@supabase/ssr'

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

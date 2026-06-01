import 'server-only'
import { createClient } from '@supabase/supabase-js'

/**
 * Service-role Supabase client (US 4.4).
 *
 * Bypasses RLS, so it must ONLY be used in trusted server contexts (the
 * notification webhook route and the unsubscribe route) — never in a path
 * reachable with user-controlled intent without its own authorization check.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY, which must never be exposed to the client.
 */
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error(
      'Supabase admin client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY',
    )
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

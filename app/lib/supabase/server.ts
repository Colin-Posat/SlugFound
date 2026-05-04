/**
 * Server-side Supabase client (Server Components, Server Actions, Route Handlers).
 *
 * Use this in any server file that needs the authenticated user — e.g. a page
 * that reads the current user's profile, or a server action that inserts into
 * `items` on behalf of the user.
 *
 * Cookies are read/written via Next.js's `cookies()` helper. Cookie writes can
 * fail in Server Components (Next.js disallows them outside actions/handlers);
 * we swallow that error because middleware will refresh the session anyway.
 */
import 'server-only'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // The `setAll` method was called from a Server Component.
            // Server Components can't set cookies — middleware handles
            // session refresh, so it's safe to ignore here.
          }
        },
      },
    },
  )
}

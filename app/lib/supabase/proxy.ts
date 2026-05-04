/**
 * Supabase session refresh helper for Next.js middleware.
 *
 * Why this exists:
 *   Supabase's auth tokens are short-lived (1 hour by default). Without a
 *   refresh-on-every-request middleware, signed-in users would get logged out
 *   unexpectedly. This helper does three things:
 *     1. Reads the existing session cookie
 *     2. Calls supabase.auth.getUser() which auto-refreshes if needed
 *     3. Writes the (possibly refreshed) cookie back on the response
 *
 * It also enforces route protection — unauthenticated users hitting protected
 * routes are redirected to /login, and signed-in users hitting /login or /signup
 * are redirected to /lost.
 */
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes that require a valid Supabase session
const PROTECTED_PREFIXES = ['/lost', '/found', '/messages', '/create', '/profile']

// Routes that should redirect signed-in users away (no point seeing login when logged in)
const AUTH_ROUTES = ['/login', '/signup']

export async function updateSession(request: NextRequest) {
  // Start with a "pass-through" response. We may overwrite cookies on it below.
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Mirror cookie writes onto BOTH the request (so subsequent code in
          // this middleware sees them) and the response (so the browser receives them).
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // IMPORTANT: do not run any code between createServerClient and getUser.
  // A simple mistake (e.g. an early return) makes the session fail to refresh
  // and users get randomly logged out.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => path === p || path.startsWith(p + '/'),
  )
  const isAuthRoute = AUTH_ROUTES.includes(path)

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/lost'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

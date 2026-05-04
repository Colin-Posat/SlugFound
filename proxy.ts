/**
 * Next.js 16 proxy — runs on every request before the page renders.
 *
 * NOTE: In Next.js 16 the file convention was renamed from `middleware.ts` to
 * `proxy.ts`, and the exported function from `middleware` to `proxy`. The old
 * `middleware.ts` name still works but emits a deprecation warning.
 *
 * Two responsibilities:
 *   1. Refresh the Supabase session cookie so signed-in users don't get kicked
 *      out when their access token expires (Supabase access tokens are 1 hour).
 *   2. Enforce route protection — unauthenticated users hitting protected pages
 *      are redirected to /login.
 *
 * The actual logic lives in app/lib/supabase/proxy.ts so it can be tested
 * independently of Next.js's matcher config.
 */
import type { NextRequest } from 'next/server'
import { updateSession } from '@/app/lib/supabase/proxy'

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static assets)
     * - _next/image  (image optimizer)
     * - favicon.ico, .png, .svg, .jpg, .jpeg, .webp, .gif (static images)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|jpg|jpeg|webp|gif)$).*)',
  ],
}

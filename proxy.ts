import { NextRequest, NextResponse } from 'next/server'
import { decrypt } from '@/app/lib/session'
import { cookies } from 'next/headers'

// ⚠️  THIS FILE IS NOT ACTIVE.
//
// Next.js middleware must be in a file named `middleware.ts` at the project root,
// and the exported function must be named `middleware`. This file is named `proxy.ts`
// and exports a function named `proxy` — Next.js ignores it entirely.
//
// To activate route protection:
//   1. Rename this file: mv proxy.ts middleware.ts
//   2. Rename the exported function below to `middleware`
//
// Until then, ALL routes are publicly accessible without a session.

// Routes that require a valid session — unauthenticated visitors are redirected to /login
const protectedPrefixes = ['/lost', '/found', '/create', '/profile', '/dashboard']

// Routes that redirect to /lost when the user is already signed in
// (prevents signed-in users from seeing the login/signup pages)
const authRoutes = ['/login', '/signup']

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname
  const isProtected = protectedPrefixes.some((p) => path === p || path.startsWith(p + '/'))
  const isAuthRoute = authRoutes.includes(path)

  const cookie = (await cookies()).get('session')?.value
  const session = await decrypt(cookie)

  if (isProtected && !session?.userId) {
    return NextResponse.redirect(new URL('/login', req.nextUrl))
  }

  if (isAuthRoute && session?.userId) {
    return NextResponse.redirect(new URL('/lost', req.nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
}

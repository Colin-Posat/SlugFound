import { NextRequest, NextResponse } from 'next/server'
import { decrypt } from '@/app/lib/session'
import { cookies } from 'next/headers'

// Routes that require a session
const protectedPrefixes = ['/lost', '/found', '/create', '/profile', '/dashboard']
// Routes that should redirect to /lost when already authed
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

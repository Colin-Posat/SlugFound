// `server-only` ensures this module is never accidentally imported in a client
// component — doing so would expose SESSION_SECRET to the browser bundle.
import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { SessionPayload } from '@/app/lib/definitions'

// SESSION_SECRET must be set in .env.local. If it's missing, JWT signing will
// fail silently (jose encodes with an empty key). Changing the secret at any
// point invalidates all existing sessions — every signed-in user gets logged out.
const secretKey = process.env.SESSION_SECRET
const encodedKey = new TextEncoder().encode(secretKey)

// Signs a JWT with HS256 and a 7-day expiry. Only called from createSession.
export async function encrypt(payload: SessionPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedKey)
}

// Verifies the JWT signature and expiry. Returns null instead of throwing so
// callers can treat an invalid/missing session as "not logged in" cleanly.
export async function decrypt(session: string | undefined = '') {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ['HS256'],
    })
    return payload
  } catch {
    // Invalid signature, expired token, or malformed JWT — all treated as "no session"
    return null
  }
}

export async function createSession(userId: string) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const session = await encrypt({ userId, expiresAt })

  // `cookies()` is a Promise in Next.js 15+ — must be awaited
  const cookieStore = await cookies()

  cookieStore.set('session', session, {
    httpOnly: true,           // JS cannot read this cookie — prevents XSS token theft
    secure: process.env.NODE_ENV === 'production',  // HTTPS-only in prod, HTTP allowed locally
    expires: expiresAt,
    sameSite: 'lax',          // Sent on same-site requests and top-level cross-site GETs (e.g. links)
    path: '/',
  })
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
}

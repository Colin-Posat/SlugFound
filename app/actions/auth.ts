'use server'

import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { LoginFormSchema, FormState } from '@/app/lib/definitions'
import { createSession, deleteSession } from '@/app/lib/session'

// ---------------------------------------------------------------------------
// ⚠️  STUB — Replace with a real database lookup before going to production.
//
// Example with Drizzle + Postgres:
//   return db.query.users.findFirst({ where: eq(users.email, email) })
//
// Performance note: The current implementation calls bcrypt.hash() on every
// invocation, even for emails that don't exist. bcrypt is intentionally slow
// (cost factor 10 ≈ 100ms). In production, store the hash once at registration
// and never re-hash at login time.
// ---------------------------------------------------------------------------
async function getUserByEmail(email: string) {
  // Demo credentials: demo@example.com / Password1!
  const DEMO_HASH = await bcrypt.hash('Password1!', 10)
  const users = [{ id: '1', email: 'demo@example.com', password: DEMO_HASH }]
  return users.find((u) => u.email === email) ?? null
}

export async function login(state: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = LoginFormSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors }
  }

  const { email, password } = validatedFields.data

  const user = await getUserByEmail(email)
  if (!user) {
    return { message: 'Invalid email or password.' }
  }

  const passwordMatch = await bcrypt.compare(password, user.password)
  if (!passwordMatch) {
    return { message: 'Invalid email or password.' }
  }

  await createSession(user.id)
  redirect('/lost')
}

export async function logout() {
  await deleteSession()
  redirect('/login')
}

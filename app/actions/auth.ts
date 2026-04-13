'use server'

import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { LoginFormSchema, FormState } from '@/app/lib/definitions'
import { createSession, deleteSession } from '@/app/lib/session'

// ---------------------------------------------------------------------------
// Replace this stub with a real database lookup.
// e.g. const user = await db.query.users.findFirst({ where: eq(users.email, email) })
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

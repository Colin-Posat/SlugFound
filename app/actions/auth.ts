'use server'

/**
 * Authentication server actions — Supabase-backed.
 *
 * Replaces the old JWT/bcrypt stub. Now delegates to Supabase Auth which
 * handles password hashing, session JWTs, refresh tokens, and email confirmation.
 *
 * Server actions used by:
 *   - Login form  → login()
 *   - Signup form → signup()
 *   - Sign out    → logout()
 *
 * NOTE: This file uses 'use server', which restricts exports to async functions
 * only. Schemas and types live in app/lib/auth-schemas.ts.
 */

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/app/lib/supabase/server'
import {
  LoginFormSchema,
  SignupFormSchema,
  type AuthFormState,
} from '@/app/lib/auth-schemas'

/**
 * Sign an existing user in. Called from the login form.
 * On success, redirects to /lost. On failure, returns a form state with errors.
 */
export async function login(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const validated = LoginFormSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.signInWithPassword(validated.data)

  if (error) {
    // Map known Supabase error codes to user-friendly messages.
    if (error.message.toLowerCase().includes('invalid login')) {
      return { message: 'Invalid email or password.' }
    }
    if (error.message.toLowerCase().includes('email not confirmed')) {
      return { message: 'Please confirm your email before signing in.' }
    }
    return { message: error.message }
  }

  // Revalidate so server components re-fetch with the new session
  revalidatePath('/', 'layout')
  redirect('/lost')
}

/**
 * Register a new user. Called from the signup form.
 *
 * `display_name` is passed in user_metadata and read by the
 * `handle_new_user()` trigger in migration 0001 to populate the profiles row.
 */
export async function signup(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const validated = SignupFormSchema.safeParse({
    displayName: formData.get('displayName'),
    email: formData.get('email'),
    password: formData.get('password'),
    confirm: formData.get('confirm'),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.signUp({
    email: validated.data.email,
    password: validated.data.password,
    options: {
      data: { display_name: validated.data.displayName },
    },
  })

  if (error) {
    if (error.message.toLowerCase().includes('already registered')) {
      return { errors: { email: ['An account with this email already exists.'] } }
    }
    return { message: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/lost')
}

/**
 * Sign the current user out. Called by the sign-out button in Sidebar/Profile.
 * Clears the Supabase session cookie and redirects to /login.
 */
export async function logout() {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

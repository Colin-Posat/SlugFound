'use client'

/**
 * Sign-in form (US 2.2).
 *
 * Wired to the `login` server action which calls
 * supabase.auth.signInWithPassword() and redirects to /lost on success.
 */

import { useActionState } from 'react'
import Link from 'next/link'
import { login } from '@/app/actions/auth'
import type { AuthFormState } from '@/app/lib/auth-schemas'

const INPUT_CLS =
  'rounded-xl border border-line-strong bg-surface-2 px-4 py-2.5 text-sm text-ink placeholder-muted outline-none transition focus:border-gold focus:ring-1 focus:ring-gold'

export default function LoginForm() {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(login, undefined)

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-ink-soft">
          UCSC email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="slug@ucsc.edu"
          className={INPUT_CLS}
        />
        {state?.errors?.email && (
          <p className="text-xs text-lost">{state.errors.email[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-medium text-ink-soft">
            Password
          </label>
          <Link href="#" className="text-xs text-gold-ink hover:text-gold-ink">
            Forgot password?
          </Link>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          className={INPUT_CLS}
        />
        {state?.errors?.password && (
          <p className="text-xs text-lost">{state.errors.password[0]}</p>
        )}
      </div>

      {state?.message && (
        <p className="rounded-xl border border-lost/25 bg-lost-soft px-4 py-3 text-sm text-lost">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 flex h-11 items-center justify-center rounded-full bg-gold text-sm font-bold text-on-gold transition hover:bg-gold-bright disabled:opacity-50"
      >
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}

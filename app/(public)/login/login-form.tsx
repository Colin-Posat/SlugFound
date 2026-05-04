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
  'rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400'

export default function LoginForm() {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(login, undefined)

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-zinc-300">
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
          <p className="text-xs text-red-400">{state.errors.email[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-medium text-zinc-300">
            Password
          </label>
          <Link href="#" className="text-xs text-yellow-400 hover:text-yellow-300">
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
          <p className="text-xs text-red-400">{state.errors.password[0]}</p>
        )}
      </div>

      {state?.message && (
        <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 flex h-11 items-center justify-center rounded-full bg-yellow-400 text-sm font-bold text-zinc-950 transition hover:bg-yellow-300 disabled:opacity-50"
      >
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}

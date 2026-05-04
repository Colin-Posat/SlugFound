'use client'

/**
 * Sign-up form (US 2.1).
 *
 * Wired to the `signup` server action. Includes:
 *   - Real-time password strength indicator
 *   - Inline @ucsc.edu validation hint
 *   - Confirm-password mismatch detection
 *   - Server-side error rendering via useActionState()
 */

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { signup } from '@/app/actions/auth'
import type { AuthFormState } from '@/app/lib/auth-schemas'

// ─── Password strength helpers ─────────────────────────────────────────────

interface StrengthInfo {
  score: 0 | 1 | 2 | 3 | 4
  label: string
  color: string
}

/** Cheap, deterministic strength scorer. Mirrors the regex rules in SignupFormSchema. */
function scorePassword(pw: string): StrengthInfo {
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 12) score++

  const map: Record<number, Omit<StrengthInfo, 'score'>> = {
    0: { label: 'Too short', color: 'bg-zinc-700' },
    1: { label: 'Weak', color: 'bg-red-500' },
    2: { label: 'Fair', color: 'bg-orange-500' },
    3: { label: 'Good', color: 'bg-yellow-400' },
    4: { label: 'Strong', color: 'bg-green-500' },
  }
  return { score: score as StrengthInfo['score'], ...map[score] }
}

const INPUT_CLS =
  'rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400'

export default function SignupForm() {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(signup, undefined)

  // Local mirrors of the password fields so we can show strength + match feedback
  // before the user submits. The server action also re-validates on submit.
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [email, setEmail] = useState('')

  const strength = scorePassword(password)
  const passwordsMatch = confirm.length > 0 && password === confirm
  const showEmailHint = email.length > 0 && !email.endsWith('@ucsc.edu')

  return (
    <form action={action} className="flex flex-col gap-4">
      {/* Display name */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="displayName" className="text-sm font-medium text-zinc-300">
          Full name
        </label>
        <input
          id="displayName"
          name="displayName"
          type="text"
          autoComplete="name"
          placeholder="Sam Slug"
          className={INPUT_CLS}
        />
        {state?.errors?.displayName && (
          <p className="text-xs text-red-400">{state.errors.displayName[0]}</p>
        )}
      </div>

      {/* Email */}
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
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={INPUT_CLS}
        />
        {showEmailHint && (
          <p className="text-xs text-amber-400">
            Only <span className="font-mono">@ucsc.edu</span> emails can register.
          </p>
        )}
        {state?.errors?.email && (
          <p className="text-xs text-red-400">{state.errors.email[0]}</p>
        )}
      </div>

      {/* Password + strength meter */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-zinc-300">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={INPUT_CLS}
        />

        {/* Strength meter — 4 bars that fill up as score increases */}
        {password.length > 0 && (
          <div className="mt-1 flex items-center gap-2">
            <div className="flex flex-1 gap-1">
              {[1, 2, 3, 4].map((bar) => (
                <div
                  key={bar}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    strength.score >= bar ? strength.color : 'bg-zinc-800'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-zinc-500">{strength.label}</span>
          </div>
        )}

        <p className="text-xs text-zinc-600">8+ chars, one uppercase, one number</p>

        {state?.errors?.password && (
          <p className="text-xs text-red-400">{state.errors.password[0]}</p>
        )}
      </div>

      {/* Confirm password */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirm" className="text-sm font-medium text-zinc-300">
          Confirm password
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={INPUT_CLS}
        />
        {confirm.length > 0 && !passwordsMatch && (
          <p className="text-xs text-red-400">Passwords do not match.</p>
        )}
        {state?.errors?.confirm && (
          <p className="text-xs text-red-400">{state.errors.confirm[0]}</p>
        )}
      </div>

      {/* Server-level error message (anything that isn't a per-field error) */}
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
        {pending ? 'Creating account…' : 'Create account'}
      </button>

      <p className="mt-2 text-center text-sm text-zinc-500">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-yellow-400 hover:text-yellow-300">
          Sign in
        </Link>
      </p>
    </form>
  )
}

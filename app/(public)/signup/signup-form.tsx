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
    0: { label: 'Too short', color: 'bg-surface-2' },
    1: { label: 'Weak', color: 'bg-lost' },
    2: { label: 'Fair', color: 'bg-[#c98a2e]' },
    3: { label: 'Good', color: 'bg-gold' },
    4: { label: 'Strong', color: 'bg-found' },
  }
  return { score: score as StrengthInfo['score'], ...map[score] }
}

const INPUT_CLS =
  'rounded-xl border border-line-strong bg-surface-2 px-4 py-2.5 text-sm text-ink placeholder-muted outline-none transition focus:border-gold focus:ring-1 focus:ring-gold'

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
        <label htmlFor="displayName" className="text-sm font-medium text-ink-soft">
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
          <p className="text-xs text-lost">{state.errors.displayName[0]}</p>
        )}
      </div>

      {/* Email */}
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
          <p className="text-xs text-lost">{state.errors.email[0]}</p>
        )}
      </div>

      {/* Password + strength meter */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-ink-soft">
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
                    strength.score >= bar ? strength.color : 'bg-surface-2'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-muted">{strength.label}</span>
          </div>
        )}

        <p className="text-xs text-muted">8+ chars, one uppercase, one number</p>

        {state?.errors?.password && (
          <p className="text-xs text-lost">{state.errors.password[0]}</p>
        )}
      </div>

      {/* Confirm password */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirm" className="text-sm font-medium text-ink-soft">
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
          <p className="text-xs text-lost">Passwords do not match.</p>
        )}
        {state?.errors?.confirm && (
          <p className="text-xs text-lost">{state.errors.confirm[0]}</p>
        )}
      </div>

      {/* Server-level error message (anything that isn't a per-field error) */}
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
        {pending ? 'Creating account…' : 'Create account'}
      </button>

      <p className="mt-2 text-center text-sm text-muted">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-gold-ink hover:text-gold-ink">
          Sign in
        </Link>
      </p>
    </form>
  )
}

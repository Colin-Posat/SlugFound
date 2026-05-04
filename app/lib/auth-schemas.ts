/**
 * Zod schemas + form state types for the auth flow.
 *
 * IMPORTANT: This file is intentionally separate from app/actions/auth.ts.
 * Files marked 'use server' (server actions) can only export async functions,
 * so schemas and types must live in a regular module.
 *
 * Used by:
 *   - app/actions/auth.ts          → validates form input
 *   - app/(public)/login/login-form.tsx   → AuthFormState shape
 *   - app/(public)/signup/signup-form.tsx → AuthFormState shape
 */

import { z } from 'zod'

// ─── Reusable building blocks ──────────────────────────────────────────────

// 8+ chars, at least one uppercase, at least one number (US 2.1 rules)
export const PasswordSchema = z
  .string()
  .min(8, { message: 'Password must be at least 8 characters.' })
  .regex(/[A-Z]/, { message: 'Password must include an uppercase letter.' })
  .regex(/[0-9]/, { message: 'Password must include a number.' })

// UCSC-only email — enforced both client-side (here) and at the DB layer
// (CHECK constraint in migration 0001) as a defense-in-depth measure.
export const UcscEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email({ message: 'Please enter a valid email.' })
  .refine((email) => email.endsWith('@ucsc.edu'), {
    message: 'Email must be a @ucsc.edu address.',
  })

// ─── Form schemas ──────────────────────────────────────────────────────────

export const LoginFormSchema = z.object({
  email: UcscEmailSchema,
  password: z.string().min(1, { message: 'Password is required.' }),
})

export const SignupFormSchema = z
  .object({
    displayName: z.string().trim().min(1, { message: 'Name is required.' }).max(60),
    email: UcscEmailSchema,
    password: PasswordSchema,
    confirm: z.string().min(1, { message: 'Please confirm your password.' }),
  })
  .refine((data) => data.password === data.confirm, {
    message: 'Passwords do not match.',
    path: ['confirm'],
  })

// ─── Form state shape returned to useActionState() ─────────────────────────

export type AuthFormState =
  | {
      errors?: {
        email?: string[]
        password?: string[]
        confirm?: string[]
        displayName?: string[]
      }
      message?: string
    }
  | undefined

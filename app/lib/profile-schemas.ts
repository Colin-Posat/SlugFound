/**
 * Zod schema + form-state type for the profile edit form (US 4.5).
 *
 * Separate from app/actions/profile.ts because 'use server' files can only
 * export async functions.
 */

import { z } from 'zod'

export const UpdateProfileSchema = z.object({
  display_name: z
    .string()
    .trim()
    .min(1, 'Display name is required.')
    .max(40, 'Display name must be 40 characters or fewer.'),
})

export type UpdateProfileFormState =
  | {
      errors?: {
        display_name?: string[]
        avatar?: string[]
      }
      message?: string
      success?: boolean
    }
  | undefined

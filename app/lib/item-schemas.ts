/**
 * Zod schemas + form state types for item-related forms.
 *
 * Separate from app/actions/items.ts because 'use server' files can only
 * export async functions.
 */

import { z } from 'zod'
import { ITEM_CATEGORIES } from './definitions'

// FormData always serialises values as strings; empty string means "not set".
const toOptionalNumber = (v: unknown) =>
  v === '' || v === null || v === undefined ? undefined : Number(v)

export const CreateItemSchema = z.object({
  type: z.enum(['lost', 'found']),
  title: z.string().trim().min(1, 'Title is required.').max(120),
  description: z.string().trim().min(1, 'Description is required.').max(1000),
  category: z.enum(ITEM_CATEGORIES, { message: 'Pick a category.' }),
  location: z.string().trim().min(1, 'Location is required.'),
  lat: z.preprocess(toOptionalNumber, z.number().min(-90).max(90).optional()),
  lng: z.preprocess(toOptionalNumber, z.number().min(-180).max(180).optional()),
})

export type CreateItemFormState =
  | {
      errors?: {
        title?: string[]
        description?: string[]
        category?: string[]
        location?: string[]
        lat?: string[]
        lng?: string[]
        photo?: string[]
      }
      message?: string
    }
  | undefined

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

// Shared field shape for both create and edit. Editing supports the same fields
// (title, description, category, location, photo) plus the lost/found type.
const itemFields = {
  type: z.enum(['lost', 'found']),
  title: z.string().trim().min(1, 'Title is required.').max(120),
  description: z.string().trim().min(1, 'Description is required.').max(1000),
  category: z.enum(ITEM_CATEGORIES, { message: 'Pick a category.' }),
  location: z.string().trim().min(1, 'Location is required.'),
  lat: z.preprocess(toOptionalNumber, z.number().min(-90).max(90).optional()),
  lng: z.preprocess(toOptionalNumber, z.number().min(-180).max(180).optional()),
}

export const CreateItemSchema = z.object(itemFields)

/** Same fields as create; the photo is handled separately and stays optional. */
export const UpdateItemSchema = z.object(itemFields)

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

/** Edit form returns the same error/message shape as create. */
export type UpdateItemFormState = CreateItemFormState

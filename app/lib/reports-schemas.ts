/**
 * Zod schema + types for item reports (US 4.6). Shared by the report action
 * and the report UI so the reason set and limits stay in sync.
 */

import { z } from 'zod'

export const ReportInputSchema = z.object({
  itemId: z.string().uuid('Invalid item.'),
  reason: z.enum(['spam', 'offensive', 'duplicate', 'other']),
  notes: z.string().trim().max(300, 'Notes must be 300 characters or fewer.').optional(),
})

export type ReportInput = z.infer<typeof ReportInputSchema>

export type ReportResult =
  | { success: true }
  | { alreadyReported: true }
  | { error: string }

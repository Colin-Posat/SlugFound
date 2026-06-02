'use server'

/**
 * Report an item as inappropriate (US 4.6).
 *
 * Inserts a row into public.reports. The unique (item_id, reporter_id)
 * constraint means a second report from the same user surfaces as a friendly
 * "already reported" result rather than a duplicate row.
 */

import { createSupabaseServerClient } from '@/app/lib/supabase/server'
import { ReportInputSchema, type ReportInput, type ReportResult } from '@/app/lib/reports-schemas'

export async function reportItem(input: ReportInput): Promise<ReportResult> {
  const parsed = ReportInputSchema.safeParse(input)
  if (!parsed.success) {
    return { error: 'Please choose a reason for the report.' }
  }

  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'You must be signed in to report an item.' }
  }

  const notes =
    parsed.data.notes && parsed.data.notes.length > 0 ? parsed.data.notes : null

  const { error } = await supabase.from('reports').insert({
    item_id: parsed.data.itemId,
    reporter_id: user.id,
    reason: parsed.data.reason,
    notes,
  })

  if (error) {
    // 23505 = unique_violation → this user already reported this item.
    if (error.code === '23505') {
      return { alreadyReported: true }
    }
    return { error: `Could not submit report: ${error.message}` }
  }

  return { success: true }
}

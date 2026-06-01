import { ReportInputSchema } from '@/app/lib/reports-schemas'

const VALID_UUID = '00000000-0000-0000-0000-000000000000'

describe('ReportInputSchema', () => {
  it('accepts a valid report with a reason and no notes', () => {
    const result = ReportInputSchema.safeParse({ itemId: VALID_UUID, reason: 'spam' })
    expect(result.success).toBe(true)
  })

  it('accepts optional notes within the length limit', () => {
    const result = ReportInputSchema.safeParse({
      itemId: VALID_UUID,
      reason: 'other',
      notes: 'This looks like a scam.',
    })
    expect(result.success).toBe(true)
  })

  it('rejects an invalid reason', () => {
    const result = ReportInputSchema.safeParse({ itemId: VALID_UUID, reason: 'banana' })
    expect(result.success).toBe(false)
  })

  it('rejects a non-uuid item id', () => {
    const result = ReportInputSchema.safeParse({ itemId: 'not-a-uuid', reason: 'spam' })
    expect(result.success).toBe(false)
  })

  it('rejects notes longer than 300 characters', () => {
    const result = ReportInputSchema.safeParse({
      itemId: VALID_UUID,
      reason: 'spam',
      notes: 'x'.repeat(301),
    })
    expect(result.success).toBe(false)
  })
})

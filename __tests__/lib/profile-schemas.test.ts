import { UpdateProfileSchema } from '@/app/lib/profile-schemas'

describe('UpdateProfileSchema', () => {
  it('accepts a valid display name', () => {
    const result = UpdateProfileSchema.safeParse({ display_name: 'Sammy Slug' })
    expect(result.success).toBe(true)
  })

  it('trims surrounding whitespace', () => {
    const result = UpdateProfileSchema.safeParse({ display_name: '  Sammy  ' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.display_name).toBe('Sammy')
    }
  })

  it('rejects an empty display name', () => {
    const result = UpdateProfileSchema.safeParse({ display_name: '   ' })
    expect(result.success).toBe(false)
  })

  it('rejects a display name longer than 40 characters', () => {
    const result = UpdateProfileSchema.safeParse({ display_name: 'a'.repeat(41) })
    expect(result.success).toBe(false)
  })
})

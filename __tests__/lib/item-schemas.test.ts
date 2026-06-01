import { CreateItemSchema, UpdateItemSchema } from '@/app/lib/item-schemas'

const BASE_VALID = {
  type: 'lost' as const,
  title: 'Test item',
  description: 'A description',
  category: 'Electronics' as const,
  location: 'McHenry Library',
}

describe('CreateItemSchema — lat/lng fields', () => {
  it('accepts a valid lat/lng pair alongside required fields', () => {
    const result = CreateItemSchema.safeParse({
      ...BASE_VALID,
      lat: '36.9996',
      lng: '-122.0579',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.lat).toBeCloseTo(36.9996)
      expect(result.data.lng).toBeCloseTo(-122.0579)
    }
  })

  it('accepts a submission with no lat/lng (both optional)', () => {
    const result = CreateItemSchema.safeParse(BASE_VALID)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.lat).toBeUndefined()
      expect(result.data.lng).toBeUndefined()
    }
  })

  it('coerces an empty-string lat to undefined without error', () => {
    const result = CreateItemSchema.safeParse({ ...BASE_VALID, lat: '', lng: '' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.lat).toBeUndefined()
      expect(result.data.lng).toBeUndefined()
    }
  })

  it('rejects a lat value above 90', () => {
    const result = CreateItemSchema.safeParse({ ...BASE_VALID, lat: '91', lng: '-122' })
    expect(result.success).toBe(false)
  })

  it('rejects a lat value below -90', () => {
    const result = CreateItemSchema.safeParse({ ...BASE_VALID, lat: '-91', lng: '-122' })
    expect(result.success).toBe(false)
  })

  it('rejects a lng value below -180', () => {
    const result = CreateItemSchema.safeParse({ ...BASE_VALID, lat: '37', lng: '-181' })
    expect(result.success).toBe(false)
  })

  it('rejects a lng value above 180', () => {
    const result = CreateItemSchema.safeParse({ ...BASE_VALID, lat: '37', lng: '181' })
    expect(result.success).toBe(false)
  })
})

describe('UpdateItemSchema', () => {
  it('accepts a valid edit payload', () => {
    const result = UpdateItemSchema.safeParse({ ...BASE_VALID, title: 'Updated name' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.title).toBe('Updated name')
    }
  })

  it('rejects an empty title (all core fields stay required)', () => {
    const result = UpdateItemSchema.safeParse({ ...BASE_VALID, title: '' })
    expect(result.success).toBe(false)
  })

  it('rejects an unknown category', () => {
    const result = UpdateItemSchema.safeParse({ ...BASE_VALID, category: 'Spaceship' })
    expect(result.success).toBe(false)
  })
})

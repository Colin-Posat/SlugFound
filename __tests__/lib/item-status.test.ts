import { nextStatuses, isReunited } from '@/app/lib/item-status'

describe('nextStatuses', () => {
  it('allows active → claimed or resolved', () => {
    expect(nextStatuses('active')).toEqual(['claimed', 'resolved'])
  })

  it('allows claimed → resolved only', () => {
    expect(nextStatuses('claimed')).toEqual(['resolved'])
  })

  it('treats resolved as terminal (no transitions)', () => {
    expect(nextStatuses('resolved')).toEqual([])
  })
})

describe('isReunited', () => {
  it('is false for active', () => {
    expect(isReunited('active')).toBe(false)
  })

  it('is true for claimed and resolved', () => {
    expect(isReunited('claimed')).toBe(true)
    expect(isReunited('resolved')).toBe(true)
  })
})

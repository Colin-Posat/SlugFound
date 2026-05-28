import { formatMessageTime, timeAgo } from '@/app/lib/format'

describe('formatMessageTime', () => {
  it('returns time like "10:12 AM" for timestamps today', () => {
    const now = new Date()
    now.setHours(10, 12, 0, 0)
    const result = formatMessageTime(now.toISOString())
    expect(result).toMatch(/10:12\s*AM/)
  })

  it('returns "Yesterday" for timestamps from yesterday', () => {
    const yesterday = new Date(Date.now() - 86_400_000)
    yesterday.setHours(14, 0, 0, 0)
    const result = formatMessageTime(yesterday.toISOString())
    expect(result).toBe('Yesterday')
  })

  it('returns "May 12" style for older timestamps', () => {
    const old = new Date('2025-05-12T10:00:00Z')
    const result = formatMessageTime(old.toISOString())
    expect(result).toMatch(/May 12/)
  })

  it('returns empty string for invalid date', () => {
    expect(formatMessageTime('not-a-date')).toBe('')
  })
})

describe('timeAgo', () => {
  it('returns "just now" for timestamps within 60 seconds', () => {
    const recent = new Date(Date.now() - 30_000).toISOString()
    expect(timeAgo(recent)).toBe('just now')
  })

  it('returns "Xm ago" for timestamps within an hour', () => {
    const fiveMin = new Date(Date.now() - 5 * 60_000).toISOString()
    expect(timeAgo(fiveMin)).toBe('5m ago')
  })

  it('returns "Xh ago" for timestamps within 24 hours', () => {
    const threeHours = new Date(Date.now() - 3 * 3_600_000).toISOString()
    expect(timeAgo(threeHours)).toBe('3h ago')
  })
})

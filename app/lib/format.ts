/**
 * Small formatting helpers used by listing cards and profile.
 */

/**
 * Render a relative time string from an ISO timestamp.
 * "2h ago", "3d ago", "just now". Falls back to a date for >30d.
 */
export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime()
  const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000))

  if (diffSec < 60) return 'just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h ago`
  const diffD = Math.floor(diffH / 24)
  if (diffD < 7) return `${diffD}d ago`
  if (diffD < 30) return `${Math.floor(diffD / 7)}w ago`

  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/**
 * Format an ISO timestamp for message display.
 * Today → "10:12 AM", yesterday → "Yesterday", older → "May 12".
 */
export function formatMessageTime(iso: string): string {
  const date = new Date(iso)
  if (isNaN(date.getTime())) return ''

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterdayStart = new Date(todayStart.getTime() - 86_400_000)

  if (date.getTime() >= todayStart.getTime()) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }
  if (date.getTime() >= yesterdayStart.getTime()) {
    return 'Yesterday'
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** "Cowell College" → "C", "Sam Slug" → "S". Always uppercase. */
export function initialFromName(name: string | null | undefined): string {
  if (!name) return '?'
  const trimmed = name.trim()
  return (trimmed.charAt(0) || '?').toUpperCase()
}

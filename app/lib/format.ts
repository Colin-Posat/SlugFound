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

/** "Cowell College" → "C", "Sam Slug" → "S". Always uppercase. */
export function initialFromName(name: string | null | undefined): string {
  if (!name) return '?'
  const trimmed = name.trim()
  return (trimmed.charAt(0) || '?').toUpperCase()
}

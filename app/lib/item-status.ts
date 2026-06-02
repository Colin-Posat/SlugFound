import type { ItemStatus } from './definitions'

/**
 * Status transition rules (US 4.3).
 *
 *   active   → claimed, resolved
 *   claimed  → resolved
 *   resolved → (terminal — no further transitions)
 *
 * Returns the statuses an owner may move TO from the given status. Pure function
 * so it can drive both the detail-page buttons and unit tests.
 */
export function nextStatuses(status: ItemStatus): ItemStatus[] {
  switch (status) {
    case 'active':
      return ['claimed', 'resolved']
    case 'claimed':
      return ['resolved']
    case 'resolved':
      return []
  }
}

/**
 * Whether an item counts as "reunited" (claimed or resolved). Used to mute
 * listing cards and to compute the Account page reunited stat.
 */
export function isReunited(status: ItemStatus): boolean {
  return status === 'claimed' || status === 'resolved'
}

/**
 * Geo helpers for map view (US 4.7). Pure — no Leaflet or server dependencies,
 * so they're safe to import in client components and unit tests.
 */

import type { Item } from './definitions'

/** True when an item has both coordinates and can be placed on the map. */
export function hasCoordinates(item: Pick<Item, 'lat' | 'lng'>): boolean {
  return item.lat !== null && item.lng !== null
}

/** Items that can be shown on the map (those missing lat/lng are excluded). */
export function geotaggedItems<T extends Pick<Item, 'lat' | 'lng'>>(items: T[]): T[] {
  return items.filter(hasCoordinates)
}

/** UCSC campus center + default zoom for the listings map. */
export const UCSC_CENTER: readonly [number, number] = [36.9916, -122.0583]
export const UCSC_ZOOM = 15

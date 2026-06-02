'use client'

// Wraps LocationMapPicker with { ssr: false } so Leaflet (which accesses
// window/document) is never executed during server-side rendering.
import dynamic from 'next/dynamic'

const LocationMapPicker = dynamic(() => import('./location-map-picker'), {
  ssr: false,
  loading: () => (
    <div className="h-64 w-full animate-pulse rounded-xl border border-line-strong bg-surface-2 flex items-center justify-center">
      <span className="text-sm text-muted">Loading map…</span>
    </div>
  ),
})

export default LocationMapPicker
export type { LocationMapPickerProps, MapLocation } from './location-map-picker'

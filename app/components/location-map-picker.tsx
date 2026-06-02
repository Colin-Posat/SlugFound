'use client'

import 'leaflet/dist/leaflet.css'
import { useMemo } from 'react'
import L from 'leaflet'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import { UCSC_PRESET_LOCATIONS } from '@/app/lib/definitions'

// Leaflet's default marker icons break under webpack/turbopack because the
// bundler cannot resolve the image paths. Point them at the CDN copy instead.
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// UCSC campus center
const CAMPUS_CENTER: [number, number] = [37.0000, -122.0620]
const CAMPUS_ZOOM = 15

export interface MapLocation {
  lat: number
  lng: number
  label: string
}

export interface LocationMapPickerProps {
  value: MapLocation | null
  onChange: (location: MapLocation) => void
  readOnly?: boolean
}

function MapClickHandler({
  onMapClick,
}: {
  onMapClick: (lat: number, lng: number) => void
}) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

export default function LocationMapPicker({
  value,
  onChange,
  readOnly = false,
}: LocationMapPickerProps) {
  // Constructed here (not at module level) to avoid running during SSR / in tests
  // where L.Icon may not be available.
  const selectedIcon = useMemo(
    () =>
      new L.Icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl:
          'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        // CSS filter shifts the default blue marker to yellow to match app palette
        className: 'hue-rotate-[200deg]',
      }),
    [],
  )

  const center = value
    ? ([value.lat, value.lng] as [number, number])
    : CAMPUS_CENTER
  const zoom = value && readOnly ? 16 : CAMPUS_ZOOM

  function handlePresetClick(preset: (typeof UCSC_PRESET_LOCATIONS)[number]) {
    if (!readOnly) {
      onChange({ lat: preset.lat, lng: preset.lng, label: preset.label })
    }
  }

  function handleMapClick(lat: number, lng: number) {
    if (!readOnly) {
      onChange({ lat, lng, label: 'Other' })
    }
  }

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={!readOnly}
      className="h-64 w-full rounded-xl border border-line-strong"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {!readOnly && <MapClickHandler onMapClick={handleMapClick} />}

      {UCSC_PRESET_LOCATIONS.map((preset) => (
        <Marker
          key={preset.label}
          position={[preset.lat, preset.lng]}
          eventHandlers={{ click: () => handlePresetClick(preset) }}
        >
          <Popup>{preset.label}</Popup>
        </Marker>
      ))}

      {value && (
        <Marker position={[value.lat, value.lng]} icon={selectedIcon}>
          <Popup>{value.label}</Popup>
        </Marker>
      )}
    </MapContainer>
  )
}

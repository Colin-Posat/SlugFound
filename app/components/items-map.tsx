'use client'

/**
 * Read-only map of listing locations (US 4.7).
 *
 * Renders a Leaflet map centered on UCSC with one pin per geotagged item.
 * Items without lat/lng are excluded. Each pin's popup shows a thumbnail,
 * title, category, date, and a link to the item detail page.
 *
 * Always loaded via items-map-dynamic (ssr: false) so Leaflet never runs on
 * the server.
 */

import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import Link from 'next/link'
import type { Item } from '@/app/lib/definitions'
import { timeAgo } from '@/app/lib/format'
import { geotaggedItems, UCSC_CENTER, UCSC_ZOOM } from '@/app/lib/geo'

// Leaflet's default marker icons break under the bundler; point them at the CDN
// copy (same fix as location-map-picker.tsx).
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface ItemsMapProps {
  items: Item[]
}

export default function ItemsMap({ items }: ItemsMapProps) {
  const pins = geotaggedItems(items)

  return (
    <MapContainer
      center={[UCSC_CENTER[0], UCSC_CENTER[1]]}
      zoom={UCSC_ZOOM}
      scrollWheelZoom
      className="h-[500px] w-full rounded-xl border border-line-strong md:h-[600px]"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {pins.map((item) => (
        <Marker key={item.id} position={[item.lat as number, item.lng as number]}>
          <Popup>
            <div className="w-44">
              {item.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="mb-2 h-24 w-full rounded object-cover"
                />
              ) : (
                <div className="mb-2 flex h-24 w-full items-center justify-center rounded bg-surface-2 text-3xl">
                  {item.emoji ?? '📦'}
                </div>
              )}
              <p className="font-display text-sm font-semibold text-ink">{item.title}</p>
              <p className="font-mono text-xs text-muted">
                {item.category} · {timeAgo(item.created_at)}
              </p>
              <Link
                href={`/items/${item.id}`}
                className="mt-1 inline-block text-xs font-semibold text-gold-ink underline"
              >
                View item →
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}

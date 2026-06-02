'use client'

// Wraps ItemsMap with { ssr: false } so Leaflet (which touches window/document)
// is never executed during server-side rendering.
import dynamic from 'next/dynamic'

const ItemsMap = dynamic(() => import('./items-map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[500px] w-full animate-pulse items-center justify-center rounded-xl border border-line-strong bg-surface-2 md:h-[600px]">
      <span className="text-sm text-muted">Loading map…</span>
    </div>
  ),
})

export default ItemsMap

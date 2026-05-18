import React, { type ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UCSC_PRESET_LOCATIONS } from '@/app/lib/definitions'

// ── Leaflet / react-leaflet mocks ─────────────────────────────────────────────
// Leaflet accesses window/document — mock it entirely for jsdom.

type ClickHandler = (e: { latlng: { lat: number; lng: number } }) => void

let capturedMapClickHandler: ClickHandler | null = null

jest.mock('leaflet', () => {
  function IconCtor() { /* stub */ }
  IconCtor.Default = {
    prototype: {} as Record<string, unknown>,
    mergeOptions: jest.fn(),
  }
  return { Icon: IconCtor }
})

jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  TileLayer: () => null,
  Marker: ({
    children,
    eventHandlers,
    position,
  }: {
    children?: ReactNode
    eventHandlers?: { click?: () => void }
    position: [number, number]
  }) => (
    <button
      data-testid="marker"
      data-lat={position[0]}
      data-lng={position[1]}
      onClick={eventHandlers?.click}
    >
      {children}
    </button>
  ),
  Popup: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  useMapEvents: ({ click }: { click?: ClickHandler }) => {
    capturedMapClickHandler = click ?? null
    return null
  },
}))

// Import after mocks are set up
import LocationMapPicker from '@/app/components/location-map-picker'

const NOOP = () => undefined

describe('LocationMapPicker', () => {
  beforeEach(() => {
    capturedMapClickHandler = null
  })

  it('renders the map container', () => {
    render(<LocationMapPicker value={null} onChange={NOOP} />)
    expect(screen.getByTestId('map-container')).toBeInTheDocument()
  })

  it('renders a button for each preset UCSC location', () => {
    render(<LocationMapPicker value={null} onChange={NOOP} />)
    const markers = screen.getAllByTestId('marker')
    // One marker per preset (no selected-value marker since value is null)
    expect(markers.length).toBe(UCSC_PRESET_LOCATIONS.length)
  })

  it('calls onChange with the correct label and coordinates when a preset marker is clicked', async () => {
    const user = userEvent.setup()
    const handleChange = jest.fn()
    render(<LocationMapPicker value={null} onChange={handleChange} />)

    const firstPreset = UCSC_PRESET_LOCATIONS[0]
    const markers = screen.getAllByTestId('marker')
    await user.click(markers[0])

    expect(handleChange).toHaveBeenCalledWith({
      label: firstPreset.label,
      lat: firstPreset.lat,
      lng: firstPreset.lng,
    })
  })

  it('calls onChange with label "Other" when clicking a custom spot on the map', () => {
    const handleChange = jest.fn()
    render(<LocationMapPicker value={null} onChange={handleChange} />)

    capturedMapClickHandler?.({ latlng: { lat: 37.001, lng: -122.06 } })

    expect(handleChange).toHaveBeenCalledWith({
      label: 'Other',
      lat: 37.001,
      lng: -122.06,
    })
  })

  it('does not fire onChange when in readOnly mode and a map click occurs', () => {
    const handleChange = jest.fn()
    render(
      <LocationMapPicker
        value={{ lat: 36.9996, lng: -122.0579, label: 'McHenry Library' }}
        onChange={handleChange}
        readOnly
      />,
    )

    capturedMapClickHandler?.({ latlng: { lat: 37.001, lng: -122.06 } })
    expect(handleChange).not.toHaveBeenCalled()
  })

  it('displays a selected-location marker when value is provided', () => {
    render(
      <LocationMapPicker
        value={{ lat: 36.9996, lng: -122.0579, label: 'McHenry Library' }}
        onChange={NOOP}
      />,
    )
    // Preset markers + 1 selected marker
    const markers = screen.getAllByTestId('marker')
    expect(markers.length).toBe(UCSC_PRESET_LOCATIONS.length + 1)
  })
})

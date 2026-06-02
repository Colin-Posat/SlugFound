import { hasCoordinates, geotaggedItems } from '@/app/lib/geo'

describe('hasCoordinates', () => {
  it('is true when both lat and lng are present', () => {
    expect(hasCoordinates({ lat: 36.99, lng: -122.05 })).toBe(true)
  })

  it('treats 0 as a valid coordinate (not falsy)', () => {
    expect(hasCoordinates({ lat: 0, lng: 0 })).toBe(true)
  })

  it('is false when either coordinate is null', () => {
    expect(hasCoordinates({ lat: null, lng: -122.05 })).toBe(false)
    expect(hasCoordinates({ lat: 36.99, lng: null })).toBe(false)
    expect(hasCoordinates({ lat: null, lng: null })).toBe(false)
  })
})

describe('geotaggedItems', () => {
  it('keeps only items that have coordinates', () => {
    const items = [
      { id: 'a', lat: 36.99, lng: -122.05 },
      { id: 'b', lat: null, lng: null },
      { id: 'c', lat: 37, lng: -122 },
    ]
    expect(geotaggedItems(items).map((i) => i.id)).toEqual(['a', 'c'])
  })

  it('returns an empty array when nothing is geotagged', () => {
    expect(geotaggedItems([{ lat: null, lng: null }])).toEqual([])
  })
})

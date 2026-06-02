import { storagePathFromPublicUrl } from '@/app/lib/storage'

describe('storagePathFromPublicUrl', () => {
  const base = 'https://abc123.supabase.co/storage/v1/object/public'

  it('extracts the in-bucket path from an item-images public URL', () => {
    const url = `${base}/item-images/user-123/photo.jpg`
    expect(storagePathFromPublicUrl(url)).toBe('user-123/photo.jpg')
  })

  it('URL-decodes encoded characters in the path', () => {
    const url = `${base}/item-images/user-123/my%20photo.png`
    expect(storagePathFromPublicUrl(url)).toBe('user-123/my photo.png')
  })

  it('supports a custom bucket name', () => {
    const url = `${base}/avatars/user-9/avatar.webp`
    expect(storagePathFromPublicUrl(url, 'avatars')).toBe('user-9/avatar.webp')
  })

  it('returns null when the URL is not for the given bucket', () => {
    const url = `${base}/avatars/user-9/avatar.webp`
    expect(storagePathFromPublicUrl(url, 'item-images')).toBeNull()
  })

  it('returns null for null, undefined, or empty input', () => {
    expect(storagePathFromPublicUrl(null)).toBeNull()
    expect(storagePathFromPublicUrl(undefined)).toBeNull()
    expect(storagePathFromPublicUrl('')).toBeNull()
  })

  it('returns null when the marker is present but no path follows', () => {
    expect(storagePathFromPublicUrl(`${base}/item-images/`)).toBeNull()
  })
})

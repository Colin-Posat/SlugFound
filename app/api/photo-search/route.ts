import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/app/lib/supabase/server'
import { compareImagesWithGemini } from '@/app/lib/gemini'
import type { Item } from '@/app/lib/definitions'

export type MatchStrength = 'High' | 'Medium' | 'Low'

export type PhotoSearchResult = Item & {
  similarity: number
  matchStrength: MatchStrength
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp']
const MIN_SIMILARITY = 0.4
const MAX_CANDIDATES = 30

function toMatchStrength(similarity: number): MatchStrength {
  if (similarity >= 0.75) return 'High'
  if (similarity >= 0.55) return 'Medium'
  return 'Low'
}

async function fetchImageAsBase64(
  url: string,
): Promise<{ base64: string; mimeType: string } | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null
    const mimeType = res.headers.get('content-type') ?? 'image/jpeg'
    const base64 = Buffer.from(await res.arrayBuffer()).toString('base64')
    return { base64, mimeType }
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const photo = formData.get('photo') as File | null

  if (!photo || photo.size === 0) {
    return NextResponse.json({ error: 'No photo provided' }, { status: 400 })
  }
  if (photo.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: 'Image must be 5 MB or smaller' }, { status: 400 })
  }
  if (!ALLOWED_MIME.includes(photo.type)) {
    return NextResponse.json({ error: 'Image must be JPG, PNG, or WebP' }, { status: 400 })
  }

  const queryBase64 = Buffer.from(await photo.arrayBuffer()).toString('base64')

  // Only compare items that have photos — no image means nothing to visually compare
  const { data: items, error: dbError } = await supabase
    .from('items')
    .select('*, profile:profiles(id, display_name, avatar_url)')
    .eq('type', 'found')
    .eq('status', 'active')
    .not('image_url', 'is', null)
    .order('created_at', { ascending: false })
    .limit(MAX_CANDIDATES)

  if (dbError) {
    console.error('[photo-search] DB error:', dbError)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  if (!items || items.length === 0) {
    return NextResponse.json({ items: [] })
  }

  // Fetch all listing images in parallel
  const fetched = await Promise.all(
    (items as Item[]).map((item) => fetchImageAsBase64(item.image_url!)),
  )

  const candidates = (items as Item[])
    .map((item, i) => ({ item, img: fetched[i] }))
    .filter((c): c is { item: Item; img: { base64: string; mimeType: string } } => c.img !== null)

  if (candidates.length === 0) {
    return NextResponse.json({ items: [] })
  }

  let similarities: Map<string, number>
  try {
    similarities = await compareImagesWithGemini(
      queryBase64,
      photo.type,
      candidates.map((c) => ({ id: c.item.id, ...c.img })),
    )
  } catch (err) {
    console.error('[photo-search] Gemini compare error:', err)
    return NextResponse.json({ error: 'Could not analyze image' }, { status: 502 })
  }

  const results: PhotoSearchResult[] = candidates
    .map((c) => {
      const similarity = similarities.get(c.item.id) ?? 0
      return { ...c.item, similarity, matchStrength: toMatchStrength(similarity) }
    })
    .filter((r) => r.similarity >= MIN_SIMILARITY)
    .sort((a, b) => b.similarity - a.similarity)

  return NextResponse.json({ items: results })
}

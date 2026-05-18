/**
 * AI photo scan endpoint — US 3.3.
 *
 * Request body:  { image: string (base64, no data: prefix), mimeType: string }
 * Response:      { title, category, description }
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import { ITEM_CATEGORIES } from '@/app/lib/definitions'

const TITLE_MAX = 80
const DESCRIPTION_MAX = 500

function clamp(value: unknown, max: number): string {
  if (typeof value !== 'string') return ''
  const trimmed = value.trim()
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed
}

export async function POST(request: Request) {
  let body: { image?: string; mimeType?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const { image, mimeType } = body
  if (!image) {
    return Response.json({ error: 'No image provided.' }, { status: 400 })
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY ?? ''
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const prompt =
      `You are analyzing a photo of a found item for a university lost-and-found app. ` +
      `Respond ONLY with a valid JSON object and nothing else — no markdown, no backticks, no explanation. ` +
      `The JSON must have exactly these fields: { title: string (max ${TITLE_MAX} chars, concise name of the item), ` +
      `category: string (must be exactly one of: ${ITEM_CATEGORIES.map((c) => `"${c}"`).join(', ')}), ` +
      `description: string (max ${DESCRIPTION_MAX} chars, describe visible details like color, brand, condition, distinguishing features) }. ` +
      `Do not include suggested_type.`

    const result = await model.generateContent([
      { text: prompt },
      { inlineData: { data: image, mimeType: mimeType || 'image/jpeg' } },
    ])

    let parsed: Record<string, unknown>
    try {
      const raw = result.response.text().trim()
      // Strip accidental code-fence wrapping
      const cleaned = raw.startsWith('```')
        ? raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
        : raw
      parsed = JSON.parse(cleaned)
    } catch {
      return Response.json({ error: 'AI service unavailable' }, { status: 500 })
    }

    const categoryRaw = typeof parsed.category === 'string' ? parsed.category : ''
    const category = (ITEM_CATEGORIES as readonly string[]).includes(categoryRaw)
      ? categoryRaw
      : ITEM_CATEGORIES[0]

    return Response.json({
      title: clamp(parsed.title, TITLE_MAX),
      category,
      description: clamp(parsed.description, DESCRIPTION_MAX),
    })
  } catch {
    return Response.json({ error: 'AI service unavailable' }, { status: 500 })
  }
}

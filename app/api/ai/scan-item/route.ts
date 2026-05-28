/**
 * AI photo scan endpoint — uses Groq vision API.
 *
 * Request body:  { image: string (base64, no data: prefix), mimeType: string }
 * Response:      { title, category, description }
 */

import Groq from 'groq-sdk'
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

  const prompt =
    `You are analyzing a photo of a found item for a university lost-and-found app. ` +
    `Respond ONLY with a valid JSON object and nothing else — no markdown, no backticks, no explanation. ` +
    `The JSON must have exactly these fields: { title: string (max ${TITLE_MAX} chars, concise name of the item), ` +
    `category: string (must be exactly one of: ${ITEM_CATEGORIES.map((c) => `"${c}"`).join(', ')}), ` +
    `description: string (max ${DESCRIPTION_MAX} chars, describe visible details like color, brand, condition, distinguishing features) }`

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

    const completion = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType ?? 'image/jpeg'};base64,${image}` },
            },
            { type: 'text', text: prompt },
          ],
        },
      ],
    })

    const raw = (completion.choices[0]?.message?.content ?? '').trim()

    // Strip accidental code-fence wrapping in case the model adds it anyway
    const fenceStripped = raw.startsWith('```')
      ? raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
      : raw
    const jsonMatch = fenceStripped.match(/\{[\s\S]*\}/)
    const cleaned = jsonMatch ? jsonMatch[0] : fenceStripped

    let parsed: Record<string, unknown>
    try {
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
  } catch (err) {
    console.error('[scan-item] Groq error:', err)
    return Response.json({ error: 'AI service unavailable' }, { status: 500 })
  }
}

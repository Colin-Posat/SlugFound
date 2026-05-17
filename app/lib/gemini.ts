const VISION_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'
const EMBED_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent'
const BATCH_EMBED_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:batchEmbedContents'

export async function describeImage(base64: string, mimeType: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not set')

  const res = await fetch(`${VISION_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: 'Describe this item for a lost-and-found database. Be specific about: item type, color(s), brand (if visible), material, size, condition, and any distinctive features. Output only the description.',
            },
            { inline_data: { mime_type: mimeType, data: base64 } },
          ],
        },
      ],
    }),
    signal: AbortSignal.timeout(10000),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(`Gemini vision ${res.status}: ${JSON.stringify(body)}`)
  }

  const body = await res.json()
  return body.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

export async function embedText(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not set')

  const res = await fetch(`${EMBED_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'models/gemini-embedding-2',
      content: { parts: [{ text }] },
    }),
    signal: AbortSignal.timeout(10000),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(`Gemini embed ${res.status}: ${JSON.stringify(body)}`)
  }

  const body = await res.json()
  return body.embedding?.values ?? []
}

/** Embeds multiple texts in a single API call. Returns embeddings in the same order. */
export async function batchEmbedTexts(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not set')

  const res = await fetch(`${BATCH_EMBED_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: texts.map((text) => ({
        model: 'models/gemini-embedding-2',
        content: { parts: [{ text }] },
      })),
    }),
    signal: AbortSignal.timeout(30000),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(`Gemini batch embed ${res.status}: ${JSON.stringify(body)}`)
  }

  const body = await res.json()
  return (body.embeddings as { values: number[] }[]).map((e) => e.values)
}

/**
 * Sends a query image + up to N candidate images to Gemini in one call.
 * Returns a map of candidate id → similarity score (0–1).
 */
export async function compareImagesWithGemini(
  queryBase64: string,
  queryMimeType: string,
  candidates: { id: string; base64: string; mimeType: string }[],
): Promise<Map<string, number>> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not set')

  const parts: object[] = [
    {
      text: `The first image is something someone lost and is searching for. I will show you ${candidates.length} found-item photos. For each, rate how visually similar it is to the first image — same item type, color, brand, and appearance. Return ONLY a JSON array with no extra text: [{"id":"<id>","similarity":<0.0-1.0>}]`,
    },
    { inline_data: { mime_type: queryMimeType, data: queryBase64 } },
    { text: 'Found item photos:' },
  ]

  for (const c of candidates) {
    parts.push({ text: `ID: ${c.id}` })
    parts.push({ inline_data: { mime_type: c.mimeType, data: c.base64 } })
  }

  const res = await fetch(`${VISION_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { responseMimeType: 'application/json' },
    }),
    signal: AbortSignal.timeout(30000),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(`Gemini compare ${res.status}: ${JSON.stringify(body)}`)
  }

  const body = await res.json()
  const text: string = body.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]'
  const scores = JSON.parse(text) as { id: string; similarity: number }[]
  return new Map(scores.map((s) => [s.id, s.similarity]))
}

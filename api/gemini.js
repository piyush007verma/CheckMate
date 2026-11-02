// Vercel serverless function. GEMINI_API_KEY stays server-side.
// Returns 503 when unconfigured so the frontend uses rule-based fallbacks.
const JSON_TASKS = new Set(['recommend', 'search'])
const PROMPTS = {
  recommend: 'You are a rental assistant. Given the user preferences and listings JSON, pick the best 3 listings. Use only ids from the listings. Return JSON only: [{"id": "<listing id>", "reason": "<one short sentence>"}]. Do not invent facts.',
  search: 'Convert the natural-language rental search in "query" into JSON filters: {"city": string|null, "locality": string|null, "maxRent": number|null, "category": "student"|"professional"|"family"|"individual"|null, "bedrooms": number|null, "furnishing": "Furnished"|"Semi-furnished"|"Unfurnished"|null, "amenities": string[]}. Prefer values from knownPlaces for city/locality. Return JSON only.',
  roommate: 'Explain in 2 short sentences why these two roommate profiles are or are not compatible.',
  roommates: 'You are a roommate-matching assistant. Given the user preferences and the top matches (with rule-based scores), recommend the best match in 3 short sentences and mention one thing to discuss. Do not invent facts.',
  summarize: 'Summarize this property description in 2 friendly sentences.',
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const key = process.env.GEMINI_API_KEY
  if (!key) return res.status(503).json({ error: 'Gemini not configured' })

  const { task, payload } = req.body || {}
  const instruction = PROMPTS[task]
  if (!instruction) return res.status(400).json({ error: 'Unknown task' })

  const model = process.env.GEMINI_MODEL || 'gemini-flash-latest'
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${instruction}\n\n${JSON.stringify(payload).slice(0, 8000)}` }] }],
          ...(JSON_TASKS.has(task) ? { generationConfig: { responseMimeType: 'application/json' } } : {}),
        }),
      }
    )
    if (!r.ok) {
      // Log Google's reason server-side (terminal / Vercel logs) and return it as `detail` to help debugging. Never includes the key.
      const body = await r.json().catch(() => ({}))
      const detail = body?.error?.message || `HTTP ${r.status}`
      console.error(`[gemini] ${r.status} model=${model}: ${detail}`)
      return res.status(502).json({ error: 'Gemini request failed', status: r.status, detail })
    }
    const data = await r.json()
    const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || ''
    return res.status(200).json({ text })
  } catch (e) {
    console.error('[gemini] network error:', e?.message)
    return res.status(502).json({ error: 'Gemini unreachable', detail: e?.message })
  }
}

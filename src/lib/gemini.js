// Client helper. Calls our serverless endpoint, never Gemini directly.
// Returns { ok, text, source } where source is 'gemini' or 'fallback'.
export async function askGemini(task, payload) {
  try {
    const res = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task, payload }),
    })
    if (!res.ok) return { ok: false, text: '', source: 'fallback' }
    const data = await res.json()
    return { ok: true, text: data.text || '', source: 'gemini' }
  } catch {
    return { ok: false, text: '', source: 'fallback' }
  }
}

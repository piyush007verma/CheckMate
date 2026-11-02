import { useMemo, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { askGemini } from '../../lib/gemini.js'
import { parseSearchRule, sanitizeFilters, parseJsonLoose, describeFilters } from './parseSearch.js'

const EXAMPLES = ['2bhk under 20000 in Pune furnished', 'student pg with meals in Mohali', 'family house in Chandigarh']

// Natural-language search. onApply(partialFilters) merges into the Properties filters.
export default function AiSearch({ properties, onApply }) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null) // { filters, source }
  const places = useMemo(() => [...new Set(properties.flatMap((p) => [p.city, p.locality]).filter(Boolean))], [properties])

  const run = async (query) => {
    const q = (query ?? text).trim()
    if (!q) return
    setBusy(true)
    let filters = null
    let source = 'rule-based'
    const ai = await askGemini('search', { query: q, knownPlaces: places.slice(0, 60) })
    if (ai.ok) {
      const parsed = sanitizeFilters(parseJsonLoose(ai.text))
      if (Object.keys(parsed).length) { filters = parsed; source = 'Gemini' }
    }
    if (!filters) filters = parseSearchRule(q, places)
    setBusy(false)
    setResult({ filters, source, empty: Object.keys(filters).length === 0 })
    if (Object.keys(filters).length) onApply(filters)
  }

  return (
    <div className="aisearch card">
      <form className="aisearch__form" onSubmit={(e) => { e.preventDefault(); run() }}>
        <Sparkles size={18} className="aisearch__icon" />
        <input
          type="text" value={text} onChange={(e) => setText(e.target.value)}
          placeholder='Describe what you need, e.g. "2bhk under 20000 in Pune furnished"'
          aria-label="Describe your ideal rental in plain words"
        />
        <button className="btn btn--primary" type="submit" disabled={busy || !text.trim()}>{busy ? 'Thinking…' : 'Smart search'}</button>
      </form>
      <div className="aisearch__ex">
        {EXAMPLES.map((ex) => <button key={ex} type="button" className="aisearch__pill" onClick={() => { setText(ex); run(ex) }}>{ex}</button>)}
      </div>
      {result && (
        <p className="aisearch__result" role="status">
          {result.empty
            ? 'Could not pick out any filters from that. Try a city, budget or BHK count.'
            : <>Applied: {describeFilters(result.filters).map((c) => <span key={c} className="chip">{c}</span>)} </>}
          <span className="muted aisearch__src">Interpreted by {result.source}{result.source === 'rule-based' ? ' (no AI configured or unavailable)' : ''}</span>
        </p>
      )}
    </div>
  )
}

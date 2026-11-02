import { useState } from 'react'
import { MapPin, Wallet, Heart, Sparkles } from 'lucide-react'
import { formatINR } from '../../data/properties.js'
import { useStoredList } from '../../hooks/useStoredList.js'
import { askGemini } from '../../lib/gemini.js'
import { explainRule } from './matching.js'

export default function RoommateCard({ match, me }) {
  const { roommate: r, score } = match
  const saved = useStoredList('rentnest_roommate_saved')
  const [explain, setExplain] = useState(null) // { text, source }
  const [loading, setLoading] = useState(false)

  const runExplain = async () => {
    setLoading(true)
    const res = await askGemini('roommate', {
      me, other: { ...r, bio: undefined }, score, strengths: match.good, concerns: match.concerns,
    })
    setExplain(res.ok && res.text ? { text: res.text, source: 'Gemini' } : { text: explainRule(r, match), source: 'Rule-based' })
    setLoading(false)
  }

  const tone = score >= 75 ? 'high' : score >= 50 ? 'mid' : 'low'
  return (
    <article className="rcard card">
      <div className="rcard__head">
        <span className="avatar avatar--sm">{r.display_name.split(' ').map((w) => w[0]).join('').slice(0, 2)}</span>
        <div className="rcard__id">
          <h3>{r.display_name}, {r.age}</h3>
          <p className="muted">{r.occupation}</p>
        </div>
        <div className={`score score--${tone}`} aria-label={`${score} percent compatible`}>{score}%</div>
      </div>

      <p className="muted rcard__line"><MapPin size={14} /> {r.locality}, {r.city}</p>
      <p className="muted rcard__line"><Wallet size={14} /> {formatINR(r.budget_min)} – {formatINR(r.budget_max)} / month</p>
      <p className="rcard__bio">{r.bio}</p>

      <div className="tags">
        <span className="chip">{r.sharing_type}</span>
        <span className="tag">{r.sleep === 'early' ? 'Early riser' : r.sleep === 'night' ? 'Night owl' : 'Flexible sleep'}</span>
        <span className="tag">{r.smoking === 'yes' ? 'Smoker' : 'Non-smoker'}</span>
        <span className="tag">{r.diet === 'veg' ? 'Vegetarian' : r.diet === 'non-veg' ? 'Non-veg' : 'Any food'}</span>
        <span className="tag">{r.social === 'quiet' ? 'Quiet' : r.social === 'social' ? 'Social' : 'Balanced'}</span>
        <span className="tag">Move-in: {r.move_in}</span>
      </div>

      {explain && (
        <div className="notice">
          <p><strong>{explain.source} explanation</strong></p>
          <p>{explain.text}</p>
        </div>
      )}

      <div className="rcard__actions">
        <button className="btn btn--ghost" onClick={runExplain} disabled={loading}>
          <Sparkles size={16} /> {loading ? 'Thinking…' : 'Why this match?'}
        </button>
        <button className={`btn btn--ghost ${saved.has(r.id) ? 'is-on' : ''}`} onClick={() => saved.toggle(r.id)} aria-pressed={saved.has(r.id)}>
          <Heart size={16} fill={saved.has(r.id) ? 'currentColor' : 'none'} /> {saved.has(r.id) ? 'Shortlisted' : 'Shortlist'}
        </button>
      </div>
    </article>
  )
}

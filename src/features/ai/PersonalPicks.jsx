import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Wand2 } from 'lucide-react'
import SafeImage from '../../components/SafeImage.jsx'
import { formatINR } from '../../data/properties.js'
import { useFavorites } from '../../hooks/useStoredList.js'
import { getPicks } from './recommend.js'

export default function PersonalPicks({ properties, filters }) {
  const fav = useFavorites()
  const [state, setState] = useState({ busy: false, data: null })

  const run = async () => {
    setState({ busy: true, data: null })
    const data = await getPicks(properties, fav.list, filters)
    setState({ busy: false, data })
  }

  return (
    <div className="picks">
      <div className="picks__head">
        <button className="btn btn--ghost" onClick={run} disabled={state.busy}><Wand2 size={16} /> {state.busy ? 'Finding picks…' : 'Picks for you'}</button>
        {state.data && <span className="muted picks__src">Source: {state.data.source}</span>}
      </div>
      {state.data && (state.data.picks.length === 0
        ? <p className="muted">Save a few properties with the heart icon and we will tailor picks to them.</p>
        : (
          <div className="picks__grid">
            {state.data.picks.map(({ property: p, reason }) => (
              <Link key={p.id} to={`/properties/${p.id}`} className="picks__item card">
                <div className="picks__thumb"><SafeImage src={p.images?.[0]} alt={p.title} /></div>
                <div>
                  <strong>{p.title}</strong>
                  <p className="muted picks__loc">{p.locality}, {p.city} · {formatINR(p.monthly_rent)}</p>
                  <p className="picks__why">{reason}</p>
                </div>
              </Link>
            ))}
          </div>
        ))}
    </div>
  )
}

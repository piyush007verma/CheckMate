import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Phone, Globe, ExternalLink, MapPin, RefreshCw } from 'lucide-react'
import { CITY_COORDS } from '../data/properties.js'
import { fetchNearby, googleMapsUrl } from '../lib/overpass.js'
import ErrorBoundary from '../components/ErrorBoundary.jsx'

const NearbyMap = lazy(() => import('../features/nearby/NearbyMap.jsx'))
const KINDS = ['All', 'PG / hostel', 'Hostel', 'Guest house', 'Serviced apartment', 'Dormitory', 'Co-living']

export default function Nearby() {
  const [city, setCity] = useState('Mohali')
  const [radius, setRadius] = useState(5)
  const [kind, setKind] = useState('All')
  const [q, setQ] = useState('')
  const [state, setState] = useState({ loading: true, places: [], error: '', cached: false, stale: false })
  const [selectedId, setSelectedId] = useState(null)

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: '' })); setSelectedId(null)
    try {
      const r = await fetchNearby(city, CITY_COORDS[city], radius)
      setState({ loading: false, places: r.places, error: '', cached: !!r.cached, stale: !!r.stale })
    } catch {
      setState({ loading: false, places: [], error: 'The free OpenStreetMap data service is busy or unreachable right now (we tried several servers). Wait a moment and press Refresh. Meanwhile, browse RentNest listings.', cached: false, stale: false })
    }
  }, [city, radius])
  useEffect(() => { load() }, [load])

  const shown = useMemo(() => state.places.filter((p) =>
    (kind === 'All' || p.kind === kind) && (!q.trim() || p.name.toLowerCase().includes(q.trim().toLowerCase()))), [state.places, kind, q])

  return (
    <section className="container section">
      <h1 className="h2">Nearby stays</h1>
      <p className="muted lead">Real PGs, hostels and guest houses mapped by the community on OpenStreetMap. Rent and availability are <strong>not</strong> listed here, so contact each place directly.</p>

      <div className="nearby__bar">
        <label className="sort"><span className="muted">City</span>
          <select value={city} onChange={(e) => setCity(e.target.value)} aria-label="City">{Object.keys(CITY_COORDS).map((c) => <option key={c}>{c}</option>)}</select></label>
        <label className="sort"><span className="muted">Radius</span>
          <select value={radius} onChange={(e) => setRadius(Number(e.target.value))} aria-label="Search radius">{[2, 5, 10].map((r) => <option key={r} value={r}>{r} km</option>)}</select></label>
        <label className="sort"><span className="muted">Type</span>
          <select value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Place type">{KINDS.map((k) => <option key={k}>{k}</option>)}</select></label>
        <input type="search" className="nearby__q" placeholder="Search by name" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search by name" />
        <button className="btn btn--ghost" onClick={load} disabled={state.loading}><RefreshCw size={16} /> Refresh</button>
      </div>

      {state.loading && <p className="muted" role="status">Loading places…</p>}
      {state.error && (
        <div className="notice" role="alert">
          <strong>{state.error}</strong>
          <div className="row"><button className="btn btn--primary" onClick={load}><RefreshCw size={16} /> Try again</button><Link className="btn btn--ghost" to={`/properties?q=${encodeURIComponent(city)}`}>See {city} listings</Link></div>
        </div>
      )}
      {state.stale && <p className="warn" role="status">Showing saved results. The data service could not be reached.</p>}

      {!state.loading && !state.error && (
        <>
          <p className="muted">{shown.length} places{state.cached ? ' (saved from the last 24 hours)' : ''}. Coverage depends on what mappers have added, so some places will be missing.</p>
          {shown.length === 0 ? (
            <div className="empty card"><h3>No places found</h3><p className="muted">Try a larger radius or another type. OpenStreetMap coverage in India is incomplete.</p></div>
          ) : (
            <div className="nearby__layout">
              <ErrorBoundary title="The map could not load">
                <Suspense fallback={<div className="pmap pmap--empty card" style={{ height: 520 }}><p className="muted" role="status">Loading map…</p></div>}>
                  <NearbyMap places={shown} selectedId={selectedId} onSelect={setSelectedId} center={CITY_COORDS[city]} />
                </Suspense>
              </ErrorBoundary>
              <ul className="nearby__list">
                {shown.map((p) => (
                  <li key={p.id} className={`card nearby__item ${p.id === selectedId ? 'is-on' : ''}`}>
                    <button className="nearby__pick" onClick={() => setSelectedId(p.id)} aria-label={`Show ${p.name} on the map`}>
                      <span className="chip">{p.kind}</span>
                      <strong>{p.name}</strong>
                      <span className="muted small"><MapPin size={12} /> {p.address || 'Address not listed'}</span>
                    </button>
                    <div className="nearby__links">
                      {p.phone && <a href={`tel:${p.phone.replace(/[^+\d]/g, '')}`}><Phone size={13} /> {p.phone}</a>}
                      {p.website && /^https?:\/\//i.test(p.website) && <a href={p.website} target="_blank" rel="noreferrer"><Globe size={13} /> Website</a>}
                      <a href={googleMapsUrl(p)} target="_blank" rel="noreferrer"><ExternalLink size={13} /> Google Maps</a>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
      <p className="muted small">Place data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a> (ODbL), via the Overpass API. Results are cached for 24 hours.</p>
    </section>
  )
}

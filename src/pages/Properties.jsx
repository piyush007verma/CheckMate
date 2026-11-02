import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal, List, Map as MapIcon, GraduationCap } from 'lucide-react'
import PropertyCard from '../components/PropertyCard.jsx'
import Filters from '../features/marketplace/Filters.jsx'
import { DEFAULT_FILTERS, filterProperties } from '../features/marketplace/filterProperties.js'
import { useProperties } from '../hooks/useProperties.js'
import { MAX_RENT } from '../data/properties.js'
import { UNIVERSITIES, universityById, distanceToUniversity } from '../data/universities.js'
import LazyMap from '../features/maps/LazyMap.jsx'
import AiSearch from '../features/ai/AiSearch.jsx'
import PersonalPicks from '../features/ai/PersonalPicks.jsx'

export default function Properties() {
  const [params] = useSearchParams()
  const { properties, loading } = useProperties()
  const [filters, setFilters] = useState(() => ({
    ...DEFAULT_FILTERS,
    q: params.get('q') || '',
    category: params.get('category') || '',
    maxRent: Number(params.get('max')) || MAX_RENT,
    ...(universityById(params.get('university')) ? { university: params.get('university'), pgOnly: true } : {}),
  }))
  const [sort, setSort] = useState('relevance')
  const [showFilters, setShowFilters] = useState(false)
  const [view, setView] = useState('list')

  const results = useMemo(() => filterProperties(properties, filters, sort), [properties, filters, sort])
  const uni = universityById(filters.university)
  const pickUni = (id) => setFilters((f) => (f.university === id ? { ...f, university: '', pgOnly: false } : { ...f, university: id, pgOnly: true }))

  return (
    <section className="container section">
      <h1 className="h2">Browse rentals</h1>
      <AiSearch properties={properties} onApply={(f) => setFilters((cur) => ({ ...DEFAULT_FILTERS, ...cur, ...f }))} />
      <PersonalPicks properties={properties} filters={filters} />
      <div className="searchrow">
        <div className="searchbox">
          <Search size={18} />
          <input type="search" placeholder="Search city, locality or property" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} aria-label="Search properties" />
        </div>
        <button className="btn btn--ghost filters-toggle" onClick={() => setShowFilters((s) => !s)} aria-expanded={showFilters}>
          <SlidersHorizontal size={16} /> Filters
        </button>
      </div>

      <div className="unistrip" role="group" aria-label="PGs near universities">
        <span className="unistrip__label"><GraduationCap size={16} /> PGs near</span>
        {UNIVERSITIES.map((u) => (
          <button key={u.id} className={`chip-btn ${filters.university === u.id ? 'is-on' : ''}`} onClick={() => pickUni(u.id)} aria-pressed={filters.university === u.id}>{u.short}</button>
        ))}
      </div>

      <div className="market">
        <aside className={`market__side ${showFilters ? 'is-open' : ''}`}>
          <Filters filters={filters} onChange={setFilters} />
        </aside>

        <div className="market__main">
          <div className="market__bar">
            <p className="muted">{results.length} {results.length === 1 ? 'property' : 'properties'}</p>
            <div className="viewtoggle" role="group" aria-label="Results view">
              <button className={view === 'list' ? 'is-on' : ''} onClick={() => setView('list')} aria-pressed={view === 'list'}><List size={16} /> List</button>
              <button className={view === 'map' ? 'is-on' : ''} onClick={() => setView('map')} aria-pressed={view === 'map'}><MapIcon size={16} /> Map</button>
            </div>
            <label className="sort">
              <span className="muted">Sort</span>
              <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort properties">
                <option value="relevance">Relevance</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
                <option value="newest">Newest</option>
                {uni && <option value="distance">Nearest to {uni.short}</option>}
              </select>
            </label>
          </div>

          {loading ? <p className="muted" role="status">Loading properties…</p> : results.length === 0 ? (
            <div className="empty card">
              <h3>No properties match</h3>
              <p className="muted">Try a different locality or loosen your filters.</p>
              <button className="btn btn--primary" onClick={() => setFilters(DEFAULT_FILTERS)}>Reset filters</button>
            </div>
          ) : view === 'map' ? (
            <LazyMap properties={results} />
          ) : (
            <div className="grid">
              {results.map((p) => <PropertyCard key={p.id} property={p} distanceKm={uni ? distanceToUniversity(p, uni) : null} universityName={uni?.short} />)}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

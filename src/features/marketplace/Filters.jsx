import { CATEGORIES, PROPERTY_TYPES, FURNISHING, AMENITIES, MAX_RENT, formatINR } from '../../data/properties.js'
import { DEFAULT_FILTERS } from './filterProperties.js'
import { UNIVERSITIES, PG_FOR } from '../../data/universities.js'

export default function Filters({ filters, onChange }) {
  const set = (patch) => onChange({ ...filters, ...patch })
  const toggleAmenity = (a) =>
    set({ amenities: filters.amenities.includes(a) ? filters.amenities.filter((x) => x !== a) : [...filters.amenities, a] })

  return (
    <div className="filters">
      <div className="filters__head">
        <h2 className="filters__title">Filters</h2>
        <button className="link-btn" onClick={() => onChange(DEFAULT_FILTERS)}>Reset</button>
      </div>

      <fieldset className="field filters__uni">
        <legend>PG near a university</legend>
        <select id="f-uni" value={filters.university} onChange={(e) => set(e.target.value ? { university: e.target.value, pgOnly: true } : { university: '' })} aria-label="University">
          <option value="">Any location</option>
          {UNIVERSITIES.map((u) => <option key={u.id} value={u.id}>{u.name}, {u.city}</option>)}
        </select>
        {filters.university && (
          <>
            <label htmlFor="f-dist">Within <strong>{filters.maxDistance > 0 ? `${filters.maxDistance} km` : 'any distance'}</strong></label>
            <select id="f-dist" value={filters.maxDistance} onChange={(e) => set({ maxDistance: Number(e.target.value) })}>
              {[1, 2, 3, 5, 10, 0].map((k) => <option key={k} value={k}>{k ? `${k} km` : 'Any distance'}</option>)}
            </select>
          </>
        )}
        <label className="check"><input type="checkbox" checked={filters.pgOnly} onChange={(e) => set({ pgOnly: e.target.checked })} /> PGs &amp; hostels only</label>
        <div className="chips" role="group" aria-label="PG for">
          <button className={`chip-btn ${!filters.pgFor ? 'is-on' : ''}`} onClick={() => set({ pgFor: '' })}>Any</button>
          {PG_FOR.filter((x) => x !== 'Co-ed').map((g) => (
            <button key={g} className={`chip-btn ${filters.pgFor === g ? 'is-on' : ''}`} onClick={() => set({ pgFor: g })}>{g}</button>
          ))}
        </div>
      </fieldset>

      <fieldset className="field">
        <legend>Who is it for</legend>
        <div className="chips">
          <button className={`chip-btn ${!filters.category ? 'is-on' : ''}`} onClick={() => set({ category: '' })}>All</button>
          {CATEGORIES.map((c) => (
            <button key={c.value} className={`chip-btn ${filters.category === c.value ? 'is-on' : ''}`} onClick={() => set({ category: c.value })}>{c.label}</button>
          ))}
        </div>
      </fieldset>

      <div className="field">
        <label htmlFor="f-rent">Max rent: <strong>{filters.maxRent >= MAX_RENT ? 'Any' : formatINR(filters.maxRent)}</strong></label>
        <input id="f-rent" type="range" min="3000" max={MAX_RENT} step="1000" value={filters.maxRent} onChange={(e) => set({ maxRent: Number(e.target.value) })} />
      </div>

      <div className="field">
        <label htmlFor="f-type">Property type</label>
        <select id="f-type" value={filters.propertyType} onChange={(e) => set({ propertyType: e.target.value })}>
          <option value="">Any</option>
          {PROPERTY_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>

      <div className="field">
        <label htmlFor="f-beds">Bedrooms</label>
        <select id="f-beds" value={filters.bedrooms} onChange={(e) => set({ bedrooms: Number(e.target.value) })}>
          <option value={0}>Any</option>
          <option value={1}>1+</option>
          <option value={2}>2+</option>
          <option value={3}>3+</option>
        </select>
      </div>

      <div className="field">
        <label htmlFor="f-furn">Furnishing</label>
        <select id="f-furn" value={filters.furnishing} onChange={(e) => set({ furnishing: e.target.value })}>
          <option value="">Any</option>
          {FURNISHING.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>

      <fieldset className="field">
        <legend>Amenities</legend>
        <div className="checks">
          {AMENITIES.map((a) => (
            <label key={a} className="check">
              <input type="checkbox" checked={filters.amenities.includes(a)} onChange={() => toggleAmenity(a)} /> {a}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="check">
        <input type="checkbox" checked={filters.availableOnly} onChange={(e) => set({ availableOnly: e.target.checked })} /> Available now only
      </label>
    </div>
  )
}

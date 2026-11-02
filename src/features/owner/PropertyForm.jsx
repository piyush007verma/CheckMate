import { useState } from 'react'
import { X, ImagePlus } from 'lucide-react'
import { CATEGORIES, PROPERTY_TYPES, FURNISHING, AMENITIES, CITY_COORDS } from '../../data/properties.js'
import { uploadPropertyImages } from '../../lib/storage.js'
import { PG_FOR, PG_TYPES, nearestUniversity, distanceKm } from '../../data/universities.js'
import LazyLocationPicker from '../maps/LazyLocationPicker.jsx'

const MAX_IMAGES = 5
const blank = {
  title: '', description: '', category: 'student', property_type: 'PG', pg_for: 'Co-ed', city: 'Mohali', locality: '',
  latitude: null, longitude: null, monthly_rent: '', security_deposit: '',
  bedrooms: 1, bathrooms: 1, furnishing: 'Furnished', amenities: [], images: [], available: true,
}

export default function PropertyForm({ initial, ownerId, onSave, onCancel }) {
  const [f, setF] = useState(() => ({ ...blank, ...(initial || {}) }))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [url, setUrl] = useState('')
  const set = (patch) => setF((x) => ({ ...x, ...patch }))

  const hasPin = f.latitude != null && f.longitude != null && Number.isFinite(Number(f.latitude)) && Number.isFinite(Number(f.longitude))
  const isPg = PG_TYPES.includes(f.property_type)
  const near = hasPin ? nearestUniversity({ latitude: f.latitude, longitude: f.longitude }, 6) : null

  // Changing the city re-frames the map. A pin is kept if it is still near the new city, otherwise cleared so it cannot point to the wrong town.
  const onCity = (city) => {
    const c = CITY_COORDS[city]
    const stale = hasPin && c && distanceKm(Number(f.latitude), Number(f.longitude), c[0], c[1]) > 40
    set(stale ? { city, latitude: null, longitude: null } : { city })
  }
  const toggleAmenity = (a) => set({ amenities: f.amenities.includes(a) ? f.amenities.filter((x) => x !== a) : [...f.amenities, a] })

  const onFiles = async (e) => {
    const files = [...e.target.files].filter((x) => x.type.startsWith('image/'))
    e.target.value = ''
    const room = MAX_IMAGES - f.images.length
    if (files.length === 0) return
    if (room <= 0) return setError(`You can add up to ${MAX_IMAGES} photos.`)
    setBusy(true); setError('')
    try {
      const urls = await uploadPropertyImages(files.slice(0, room), ownerId)
      set({ images: [...f.images, ...urls] })
    } catch { setError('Photo upload failed. Please try again.') }
    setBusy(false)
  }
  const addUrl = () => {
    const u = url.trim()
    if (!/^https?:\/\//i.test(u)) return setError('Enter a valid image URL starting with http(s)://')
    if (f.images.length >= MAX_IMAGES) return setError(`You can add up to ${MAX_IMAGES} photos.`)
    set({ images: [...f.images, u] }); setUrl(''); setError('')
  }

  const submit = async (e) => {
    e.preventDefault()
    const rent = Number(f.monthly_rent)
    if (!f.title.trim() || !f.locality.trim()) return setError('Title and locality are required.')
    if (!(rent > 0)) return setError('Enter a monthly rent greater than 0.')
    if (!hasPin) return setError('Drop a pin on the map to mark the exact location of your property.')
    setBusy(true); setError('')
    const ok = await onSave({
      ...f,
      id: initial?.id || `local-${Date.now()}`,
      owner_id: ownerId,
      title: f.title.trim(), locality: f.locality.trim(),
      monthly_rent: rent, security_deposit: Number(f.security_deposit) || 0,
      bedrooms: Number(f.bedrooms) || 1, bathrooms: Number(f.bathrooms) || 1,
      latitude: Number(f.latitude), longitude: Number(f.longitude),
      pg_for: isPg ? f.pg_for : null,
      created_at: initial?.created_at || new Date().toISOString(),
    })
    if (ok === false) setError('Could not save the listing. Check your connection and the form values, or (demo mode) remove a photo to free browser storage.')
    setBusy(false)
  }

  return (
    <form className="ownerform card" onSubmit={submit}>
      <h2 className="h3 ownerform__title">{initial ? 'Edit property' : 'Add a property'}</h2>

      <div className="ownerform__grid">
        <div className="field span2"><label htmlFor="o-title">Title</label><input id="o-title" value={f.title} onChange={(e) => set({ title: e.target.value })} required /></div>
        <div className="field span2"><label htmlFor="o-desc">Description</label><textarea id="o-desc" rows="4" value={f.description} onChange={(e) => set({ description: e.target.value })} /></div>
        <div className="field"><label htmlFor="o-cat">Best for</label>
          <select id="o-cat" value={f.category} onChange={(e) => set({ category: e.target.value })}>{CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
        <div className="field"><label htmlFor="o-type">Property type</label>
          <select id="o-type" value={f.property_type} onChange={(e) => set({ property_type: e.target.value })}>{PROPERTY_TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
        {isPg && (
          <div className="field"><label htmlFor="o-pgfor">PG / hostel is for</label>
            <select id="o-pgfor" value={f.pg_for || 'Co-ed'} onChange={(e) => set({ pg_for: e.target.value })}>{PG_FOR.map((g) => <option key={g}>{g}</option>)}</select></div>
        )}
        <div className="field"><label htmlFor="o-city">City</label>
          <select id="o-city" value={f.city} onChange={(e) => onCity(e.target.value)}>{Object.keys(CITY_COORDS).map((c) => <option key={c}>{c}</option>)}</select></div>
        <div className="field"><label htmlFor="o-loc">Locality</label><input id="o-loc" value={f.locality} onChange={(e) => set({ locality: e.target.value })} required /></div>
        <div className="field span2">
          <label>Exact location <span className="muted">(click the map to place the pin)</span></label>
          <LazyLocationPicker
            value={hasPin ? { lat: f.latitude, lng: f.longitude } : null}
            center={CITY_COORDS[f.city]}
            onChange={({ lat, lng }) => set({ latitude: lat, longitude: lng })}
          />
          {near && <p className="muted small">About {near.km.toFixed(1)} km from {near.uni.name}.</p>}
        </div>
        <div className="field"><label htmlFor="o-rent">Monthly rent (₹)</label><input id="o-rent" type="number" min="1" value={f.monthly_rent} onChange={(e) => set({ monthly_rent: e.target.value })} required /></div>
        <div className="field"><label htmlFor="o-dep">Security deposit (₹)</label><input id="o-dep" type="number" min="0" value={f.security_deposit} onChange={(e) => set({ security_deposit: e.target.value })} /></div>
        <div className="field"><label htmlFor="o-bed">Bedrooms</label><input id="o-bed" type="number" min="1" max="10" value={f.bedrooms} onChange={(e) => set({ bedrooms: e.target.value })} /></div>
        <div className="field"><label htmlFor="o-bath">Bathrooms</label><input id="o-bath" type="number" min="1" max="10" value={f.bathrooms} onChange={(e) => set({ bathrooms: e.target.value })} /></div>
        <div className="field"><label htmlFor="o-furn">Furnishing</label>
          <select id="o-furn" value={f.furnishing} onChange={(e) => set({ furnishing: e.target.value })}>{FURNISHING.map((t) => <option key={t}>{t}</option>)}</select></div>
        <label className="check span1"><input type="checkbox" checked={f.available} onChange={(e) => set({ available: e.target.checked })} /> Available now</label>

        <fieldset className="field span2"><legend>Amenities</legend>
          <div className="checks checks--4">{AMENITIES.map((a) => (
            <label key={a} className="check"><input type="checkbox" checked={f.amenities.includes(a)} onChange={() => toggleAmenity(a)} /> {a}</label>
          ))}</div>
        </fieldset>

        <div className="field span2">
          <label>Photos ({f.images.length}/{MAX_IMAGES})</label>
          <div className="thumbs">
            {f.images.map((src, i) => (
              <div key={i} className="thumb">
                <img src={src} alt={`Photo ${i + 1}`} />
                <button type="button" className="thumb__x" onClick={() => set({ images: f.images.filter((_, j) => j !== i) })} aria-label={`Remove photo ${i + 1}`}><X size={14} /></button>
              </div>
            ))}
            <label className="thumb thumb--add">
              <ImagePlus size={20} /><span>Upload</span>
              <input type="file" accept="image/*" multiple onChange={onFiles} hidden />
            </label>
          </div>
          <div className="pair pair--url">
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="…or paste an image URL" aria-label="Image URL" />
            <button type="button" className="btn btn--ghost" onClick={addUrl}>Add URL</button>
          </div>
        </div>
      </div>

      {error && <p className="warn" role="alert">{error}</p>}
      <div className="row">
        <button className="btn btn--primary" type="submit" disabled={busy}>{busy ? 'Working…' : initial ? 'Save changes' : 'Publish listing'}</button>
        <button className="btn btn--ghost" type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}

import { Link } from 'react-router-dom'
import { Heart, Scale, BedDouble, Bath, MapPin, GraduationCap } from 'lucide-react'
import SafeImage from './SafeImage.jsx'
import { formatINR, categoryLabel } from '../data/properties.js'
import { useFavorites, useCompare } from '../hooks/useStoredList.js'

export default function PropertyCard({ property: p, distanceKm, universityName }) {
  const fav = useFavorites()
  const cmp = useCompare()
  const saved = fav.has(p.id)
  const comparing = cmp.has(p.id)

  const onCompare = (e) => {
    e.preventDefault()
    if (!cmp.toggle(p.id)) window.alert('You can compare up to 3 properties at a time.')
  }
  const onFav = (e) => { e.preventDefault(); fav.toggle(p.id) }

  return (
    <article className="pcard">
      <Link to={`/properties/${p.id}`} className="pcard__link">
        <div className="pcard__media">
          <SafeImage src={p.images?.[0]} alt={p.title} />
          <span className="chip pcard__chip">{categoryLabel(p.category)}</span>
          {!p.available && <span className="pcard__badge">Not available</span>}
        </div>
        <div className="pcard__body">
          <div className="pcard__top">
            <h3 className="pcard__title">{p.title}</h3>
          </div>
          <p className="pcard__loc muted"><MapPin size={14} /> {p.locality}, {p.city}</p>
          <p className="pcard__meta muted">
            <span>{p.property_type}</span>
            <span><BedDouble size={14} /> {p.bedrooms}</span>
            <span><Bath size={14} /> {p.bathrooms}</span>
            <span>{p.furnishing}</span>
          </p>
          {distanceKm != null && <p className="pcard__uni"><GraduationCap size={14} /> {distanceKm < 0.1 ? '<0.1' : distanceKm.toFixed(1)} km from {universityName}</p>}
          {p.pg_for && <p className="pcard__meta muted"><span>{p.pg_for === 'Co-ed' ? 'Co-ed PG' : `PG for ${p.pg_for}`}</span></p>}
          <p className="pcard__price"><strong>{formatINR(p.monthly_rent)}</strong> <span className="muted">/ month</span></p>
        </div>
      </Link>
      <div className="pcard__actions">
        <button className={`icon-btn pcard__fav ${saved ? 'is-on' : ''}`} onClick={onFav} aria-pressed={saved} aria-label={saved ? 'Remove from saved' : 'Save property'}>
          <Heart size={18} fill={saved ? 'currentColor' : 'none'} />
        </button>
        <button className={`icon-btn pcard__cmp ${comparing ? 'is-on' : ''}`} onClick={onCompare} aria-pressed={comparing} aria-label={comparing ? 'Remove from compare' : 'Add to compare'}>
          <Scale size={18} />
        </button>
      </div>
    </article>
  )
}

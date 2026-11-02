import { Link } from 'react-router-dom'
import { Pencil, Trash2 } from 'lucide-react'
import SafeImage from '../../components/SafeImage.jsx'
import { formatINR } from '../../data/properties.js'
import { deleteListing, setAvailability } from './listingsApi.js'

export default function MyListings({ listings, onEdit, onAdd }) {
  if (listings.length === 0) {
    return (
      <div className="empty card">
        <h3>No listings yet</h3>
        <p className="muted">Add your first property to start receiving enquiries.</p>
        <button className="btn btn--primary" onClick={onAdd}>Add a property</button>
      </div>
    )
  }
  return (
    <div className="mylist">
      {listings.map((p) => (
        <div key={p.id} className="myrow card">
          <SafeImage src={p.images?.[0]} alt="" className="myrow__img" />
          <div className="myrow__info">
            <Link to={`/properties/${p.id}`}><strong>{p.title}</strong></Link>
            <span className="muted">{p.locality}, {p.city} · {formatINR(p.monthly_rent)}/mo</span>
          </div>
          <label className="switch">
            <input type="checkbox" checked={p.available} onChange={async (e) => { if (!(await setAvailability(p.id, e.target.checked))) window.alert('Could not update availability. Please try again.') }} />
            <span>{p.available ? 'Available' : 'Unavailable'}</span>
          </label>
          <div className="myrow__btns">
            <button className="icon-btn" onClick={() => onEdit(p)} aria-label={`Edit ${p.title}`}><Pencil size={16} /></button>
            <button className="icon-btn" onClick={async () => { if (window.confirm(`Delete "${p.title}"?`) && !(await deleteListing(p.id))) window.alert('Could not delete this listing. It may belong to another account or already be removed. Please reload and try again.') }} aria-label={`Delete ${p.title}`}><Trash2 size={16} /></button>
          </div>
        </div>
      ))}
    </div>
  )
}

import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Heart, Scale, BedDouble, Bath, MapPin, Check, ArrowLeft, Sparkles } from 'lucide-react'
import SafeImage from '../components/SafeImage.jsx'
import { useProperty } from '../hooks/useProperties.js'
import { useFavorites, useCompare } from '../hooks/useStoredList.js'
import { formatINR, categoryLabel } from '../data/properties.js'
import { submitEnquiry } from '../features/owner/listingsApi.js'
import { useCurrentUser } from '../hooks/useCurrentUser.js'
import LazyMap from '../features/maps/LazyMap.jsx'
import ChatThread from '../features/chat/ChatThread.jsx'
import { summarizeDescription } from '../features/ai/recommend.js'

export default function PropertyDetail() {
  const { id } = useParams()
  const p = useProperty(id)
  const fav = useFavorites()
  const cmp = useCompare()
  const [active, setActive] = useState(0)
  const [form, setForm] = useState({ name: '', phone: '', message: '' })
  const [sent, setSent] = useState(false)
  const [needsLogin, setNeedsLogin] = useState(false)
  const [err, setErr] = useState('')
  const user = useCurrentUser()
  const [summary, setSummary] = useState(null)
  const [summarizing, setSummarizing] = useState(false)

  if (!p) {
    return (
      <section className="container section">
        <h1 className="h2">Property not found</h1>
        <Link to="/properties" className="btn btn--primary">Back to rentals</Link>
      </section>
    )
  }

  const submit = async (e) => {
    e.preventDefault()
    setErr(''); setNeedsLogin(false)
    const res = await submitEnquiry(p, form, user)
    if (res.needsLogin) return setNeedsLogin(true)
    if (!res.ok) return setErr('Could not send your enquiry. Please try again.')
    setSent({ remote: res.remote, enquiry: res.enquiry }); setForm({ name: '', phone: '', message: '' })
  }
  const onSummarize = async () => {
    setSummarizing(true)
    setSummary(await summarizeDescription(p.description))
    setSummarizing(false)
  }
  const onCompare = () => { if (!cmp.toggle(p.id)) window.alert('You can compare up to 3 properties at a time.') }

  return (
    <section className="container section detail">
      <Link to="/properties" className="back"><ArrowLeft size={16} /> All rentals</Link>
      <div className="detail__head">
        <div>
          <span className="chip">{categoryLabel(p.category)}</span>
          <h1 className="h2 detail__title">{p.title}</h1>
          <p className="muted"><MapPin size={14} /> {p.locality}, {p.city}</p>
        </div>
        <div className="detail__btns">
          <button className={`btn btn--ghost ${fav.has(p.id) ? 'is-on' : ''}`} onClick={() => fav.toggle(p.id)} aria-pressed={fav.has(p.id)}>
            <Heart size={16} fill={fav.has(p.id) ? 'currentColor' : 'none'} /> {fav.has(p.id) ? 'Saved' : 'Save'}
          </button>
          <button className={`btn btn--ghost ${cmp.has(p.id) ? 'is-on' : ''}`} onClick={onCompare} aria-pressed={cmp.has(p.id)}>
            <Scale size={16} /> {cmp.has(p.id) ? 'In compare' : 'Compare'}
          </button>
        </div>
      </div>

      <div className="gallery">
        <SafeImage src={p.images?.[active]} alt={p.title} className="gallery__main" />
        {p.images?.length > 1 && (
          <div className="gallery__thumbs">
            {p.images.map((src, i) => (
              <button key={src} className={i === active ? 'is-on' : ''} onClick={() => setActive(i)} aria-label={`Show photo ${i + 1}`}>
                <SafeImage src={src} alt="" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="detail__grid">
        <div>
          <div className="stats">
            <span>{p.property_type}</span>
            <span><BedDouble size={16} /> {p.bedrooms} bed</span>
            <span><Bath size={16} /> {p.bathrooms} bath</span>
            <span>{p.furnishing}</span>
          </div>
          <h2 className="h3">About this place</h2>
          <p>{p.description}</p>
          <button className="btn btn--ghost summary" onClick={onSummarize} disabled={summarizing}><Sparkles size={16} /> {summarizing ? 'Summarising…' : 'Summarise this place'}</button>
          {summary && (
            <div className="summary__box" role="status">
              <p>{summary.text}</p>
              <span className="muted summary__src">Source: {summary.source}</span>
            </div>
          )}
          <h2 className="h3">Amenities</h2>
          <ul className="amenities">
            {(p.amenities || []).map((a) => <li key={a}><Check size={16} /> {a}</li>)}
          </ul>
          <h2 className="h3">Location</h2>
          <p className="muted">{p.locality}, {p.city}. Approximate area on the map.</p>
          <div className="detail__map"><LazyMap properties={[p]} single /></div>
        </div>

        <aside className="booking card">
          <p className="pcard__price"><strong>{formatINR(p.monthly_rent)}</strong> <span className="muted">/ month</span></p>
          <p className="muted">Security deposit {formatINR(p.security_deposit)}</p>
          <p className={p.available ? 'ok' : 'warn'}>{p.available ? 'Available now' : 'Currently not available'}</p>
          {sent ? (
            <div className="notice">
              <strong>Enquiry sent. You can chat with the owner below.</strong>
              <p className="muted">{sent.remote ? 'The owner can see your enquiry and will reply here. You can also find this chat in your dashboard.' : 'Demo listing: saved in this browser only. A sample owner replies automatically.'}</p>
              {sent.enquiry && <div className="dash__chat"><ChatThread enquiry={sent.enquiry} viewerRole="tenant" user={user} title="Chat with the owner" /></div>}
            </div>
          ) : (
            <form onSubmit={submit} className="form">
              <input required placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} aria-label="Your name" />
              <input required type="tel" placeholder="Phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} aria-label="Phone number" />
              <textarea rows="3" placeholder="Message (optional)" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} aria-label="Message" />
              {needsLogin && <p className="warn">Please <Link to="/login" state={{ from: `/properties/${p.id}` }}>log in</Link> to send an enquiry.</p>}
              {err && <p className="warn" role="alert">{err}</p>}
              <button className="btn btn--primary" type="submit">Send enquiry</button>
            </form>
          )}
        </aside>
      </div>
    </section>
  )
}

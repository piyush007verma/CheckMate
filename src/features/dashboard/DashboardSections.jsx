import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, LogOut, Pencil, MessageCircle } from 'lucide-react'
import ChatThread from '../chat/ChatThread.jsx'
import PropertyCard from '../../components/PropertyCard.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useFavorites } from '../../hooks/useStoredList.js'
import { getEnquiries, getSentEnquiries } from '../owner/listingsApi.js'
import { DATA_EVENT, STORAGE_EVENT } from '../../lib/localStore.js'
import { formatINR } from '../../data/properties.js'

const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

export function ProfileCard({ user }) {
  const { signOut, updateProfile } = useAuth()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user.name)
  const [msg, setMsg] = useState('')

  const save = async (e) => {
    e.preventDefault()
    const res = await updateProfile({ name })
    if (res.error) return setMsg(res.error)
    setMsg(''); setEditing(false)
  }

  return (
    <section className="dash__profile card">
      <span className="avatar">{user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}</span>
      <div className="dash__id">
        {editing ? (
          <form className="dash__edit" onSubmit={save}>
            <input value={name} onChange={(e) => setName(e.target.value)} aria-label="Display name" required maxLength={60} />
            <button className="btn btn--primary" type="submit">Save</button>
            <button className="btn btn--ghost" type="button" onClick={() => { setEditing(false); setName(user.name); setMsg('') }}>Cancel</button>
          </form>
        ) : (
          <h1 className="h2 dash__name">{user.name} <button className="icon-btn" onClick={() => setEditing(true)} aria-label="Edit name"><Pencil size={14} /></button></h1>
        )}
        {msg && <p className="warn" role="alert">{msg}</p>}
        <p className="muted">{user.email} · {user.role === 'owner' ? 'Property owner' : 'Seeker'}</p>
        {user.demo && <p className="notice dash__demo">Demo account: no password is checked and data stays in this browser. Not secure.</p>}
      </div>
      <button className="btn btn--ghost" onClick={signOut}><LogOut size={16} /> Log out</button>
    </section>
  )
}

export function SavedProperties({ properties }) {
  const fav = useFavorites()
  const saved = properties.filter((p) => fav.list.includes(p.id))
  return (
    <section className="dash__block">
      <div className="sectionhead"><h2 className="h3">Saved properties ({saved.length})</h2></div>
      {saved.length === 0 ? (
        <div className="empty card"><Heart size={22} /><p className="muted">Nothing saved yet. Tap the heart on any listing.</p><Link to="/properties" className="btn btn--primary">Browse rentals</Link></div>
      ) : (
        <div className="grid">{saved.map((p) => <PropertyCard key={p.id} property={p} />)}</div>
      )}
    </section>
  )
}

export function SentEnquiries({ user }) {
  const [list, setList] = useState(null)
  const [openId, setOpenId] = useState(null)
  useEffect(() => {
    let dead = false
    const load = () => getSentEnquiries(user.id).then((r) => { if (!dead) setList(r) })
    load()
    window.addEventListener(DATA_EVENT, load); window.addEventListener(STORAGE_EVENT, load)
    return () => { dead = true; window.removeEventListener(DATA_EVENT, load); window.removeEventListener(STORAGE_EVENT, load) }
  }, [user.id])

  return (
    <section className="dash__block">
      <div className="sectionhead"><h2 className="h3">Recent enquiries</h2></div>
      {list === null ? <p className="muted" role="status">Loading…</p> : list.length === 0 ? (
        <div className="empty card"><p className="muted">You have not sent any enquiries yet.</p></div>
      ) : (
        <ul className="dash__list">
          {list.slice(0, 8).map((e) => (
            <li key={e.id}>
              <div className="card dash__row">
                <div><Link to={`/properties/${e.property_id}`}><strong>{e.property_title}</strong></Link><p className="muted small">{fmtDate(e.created_at)}{e.message ? ` · ${e.message.slice(0, 80)}` : ''}</p></div>
                <div className="row">
                  <span className="chip">{e.status}</span>
                  <button className="btn btn--ghost" onClick={() => setOpenId(openId === e.id ? null : e.id)} aria-expanded={openId === e.id}><MessageCircle size={16} /> {openId === e.id ? 'Hide chat' : 'Chat with owner'}</button>
                </div>
              </div>
              {openId === e.id && <div className="dash__chat"><ChatThread enquiry={e} viewerRole="tenant" user={user} title="Chat with the owner" /></div>}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function OwnerSummary({ user, properties }) {
  const mine = properties.filter((p) => p.owner_id === user.id)
  const [received, setReceived] = useState(0)
  useEffect(() => {
    let dead = false
    getEnquiries(user.id).then((r) => { if (!dead) setReceived(r.filter((e) => !('owner_id' in e) || e.owner_id === user.id).length) })
    return () => { dead = true }
  }, [user.id])

  return (
    <section className="dash__block">
      <div className="sectionhead"><h2 className="h3">My listings</h2><Link to="/owner" className="btn btn--ghost">Open owner portal</Link></div>
      {mine.length === 0 ? (
        <div className="empty card"><p className="muted">You have no listings. Owners can add one in a few minutes.</p><Link to="/owner" className="btn btn--primary">Add a property</Link></div>
      ) : (
        <>
          <div className="dash__stats">
            <div className="card dash__stat"><strong>{mine.length}</strong><span className="muted">Listings</span></div>
            <div className="card dash__stat"><strong>{mine.filter((p) => p.available).length}</strong><span className="muted">Available</span></div>
            <div className="card dash__stat"><strong>{received}</strong><span className="muted">Enquiries received</span></div>
          </div>
          <ul className="dash__list">
            {mine.slice(0, 5).map((p) => (
              <li key={p.id} className="card dash__row">
                <div><Link to={`/properties/${p.id}`}><strong>{p.title}</strong></Link><p className="muted small">{p.locality}, {p.city} · {formatINR(p.monthly_rent)}/month</p></div>
                <span className={p.available ? 'ok' : 'warn'}>{p.available ? 'Available' : 'Unavailable'}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

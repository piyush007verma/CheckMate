import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getEnquiries, setEnquiryStatus } from './listingsApi.js'
import { STORAGE_EVENT, DATA_EVENT } from '../../lib/localStore.js'
import { isSupabaseConfigured } from '../../lib/supabase.js'
import { MessageCircle } from 'lucide-react'
import ChatThread from '../chat/ChatThread.jsx'
import { useCurrentUser } from '../../hooks/useCurrentUser.js'

export default function EnquiriesPanel({ userId }) {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState(null)
  const user = useCurrentUser()

  const load = useCallback(async () => { setList(await getEnquiries(userId)); setLoading(false) }, [userId])
  useEffect(() => {
    load()
    window.addEventListener(STORAGE_EVENT, load)
    window.addEventListener(DATA_EVENT, load)
    return () => { window.removeEventListener(STORAGE_EVENT, load); window.removeEventListener(DATA_EVENT, load) }
  }, [load])

  const change = async (id, status) => { await setEnquiryStatus(id, status); load() }

  if (loading) return <p className="muted">Loading…</p>
  if (list.length === 0) {
    return <div className="empty card"><h3>No enquiries yet</h3><p className="muted">Enquiries sent from property pages appear here.</p></div>
  }
  return (
    <div className="mylist">
      {!isSupabaseConfigured && <p className="muted small">Demo mode: showing enquiries saved in this browser.</p>}
      {list.map((e) => (
        <div key={e.id} className="enq card">
          <div>
            <strong>{e.name}</strong> · <a href={`tel:${e.phone}`}>{e.phone}</a>
            <p className="muted small">For <Link to={`/properties/${e.property_id}`}>{e.property_title}</Link> · {new Date(e.created_at).toLocaleDateString()}</p>
            {e.message && <p>{e.message}</p>}
          </div>
          <button className="btn btn--ghost" onClick={() => setOpenId(openId === e.id ? null : e.id)} aria-expanded={openId === e.id}><MessageCircle size={16} /> {openId === e.id ? 'Hide chat' : 'Chat'}</button>
          <select value={e.status} onChange={(ev) => change(e.id, ev.target.value)} aria-label="Enquiry status">
            <option value="new">New</option><option value="contacted">Contacted</option><option value="closed">Closed</option>
          </select>
          {openId === e.id && <div className="enq__chat"><ChatThread enquiry={e} viewerRole="owner" user={user} title={`Chat with ${e.name}`} /></div>}
        </div>
      ))}
    </div>
  )
}

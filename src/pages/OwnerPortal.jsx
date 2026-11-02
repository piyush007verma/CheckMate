import { useState } from 'react'
import { Plus } from 'lucide-react'
import PropertyForm from '../features/owner/PropertyForm.jsx'
import MyListings from '../features/owner/MyListings.jsx'
import EnquiriesPanel from '../features/owner/EnquiriesPanel.jsx'
import { saveListing } from '../features/owner/listingsApi.js'
import { useProperties } from '../hooks/useProperties.js'
import { useCurrentUser } from '../hooks/useCurrentUser.js'
import { isSupabaseConfigured } from '../lib/supabase.js'

export default function OwnerPortal() {
  const user = useCurrentUser()
  const { properties } = useProperties()
  const [tab, setTab] = useState('listings')
  const [editing, setEditing] = useState(null) // property | 'new' | null

  const mine = properties.filter((p) => p.owner_id === user.id)

  const onSave = async (p) => {
    const ok = await saveListing(p)
    if (ok) { setEditing(null); setTab('listings') }
    return ok
  }

  return (
    <section className="container section">
      <div className="sectionhead">
        <h1 className="h2">Owner portal</h1>
        {!editing && <button className="btn btn--primary" onClick={() => setEditing('new')}><Plus size={16} /> Add property</button>}
      </div>
      {!isSupabaseConfigured && (
        <p className="notice">Demo mode: listings, photos and enquiries are stored in this browser only. Connect Supabase to save them online.</p>
      )}

      {editing ? (
        <PropertyForm
          initial={editing === 'new' ? null : editing}
          ownerId={user.id}
          onSave={onSave}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <>
          <div className="tabs" role="tablist">
            <button role="tab" aria-selected={tab === 'listings'} className={`tab ${tab === 'listings' ? 'is-on' : ''}`} onClick={() => setTab('listings')}>My listings ({mine.length})</button>
            <button role="tab" aria-selected={tab === 'enquiries'} className={`tab ${tab === 'enquiries' ? 'is-on' : ''}`} onClick={() => setTab('enquiries')}>Enquiries</button>
          </div>
          {tab === 'listings'
            ? <MyListings listings={mine} onEdit={setEditing} onAdd={() => setEditing('new')} />
            : <EnquiriesPanel userId={user.id} />}
        </>
      )}
    </section>
  )
}

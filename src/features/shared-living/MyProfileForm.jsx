import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import { CITY_COORDS } from '../../data/properties.js'
import { getMyProfile, saveMyProfile, deleteMyProfile } from './profilesApi.js'
import { DATA_EVENT, STORAGE_EVENT } from '../../lib/localStore.js'

const blank = (prefs) => ({
  display_name: '', age: '', occupation: '', city: prefs.city, locality: prefs.locality || '',
  budget_min: prefs.budgetMin, budget_max: prefs.budgetMax,
  sharing_type: prefs.sharing === 'Any' ? 'Private room' : prefs.sharing,
  sleep: prefs.sleep, smoking: prefs.smoking, diet: prefs.diet, social: prefs.social, bio: '', move_in: 'Immediately',
})

// "Create my roommate profile". prefs pre-fills a new profile from the filters on the page.
export default function MyProfileForm({ user, prefs }) {
  const [mine, setMine] = useState(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(() => blank(prefs))
  const [msg, setMsg] = useState({ type: '', text: '' })
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!user) { setMine(null); return undefined }
    let dead = false
    const load = () => getMyProfile(user).then((p) => { if (!dead) setMine(p) })
    load()
    window.addEventListener(DATA_EVENT, load)
    window.addEventListener(STORAGE_EVENT, load)
    return () => { dead = true; window.removeEventListener(DATA_EVENT, load); window.removeEventListener(STORAGE_EVENT, load) }
  }, [user])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value }))
  const edit = () => { setForm(mine ? { ...blank(prefs), ...mine } : { ...blank(prefs), display_name: user?.name || '' }); setMsg({ type: '', text: '' }); setOpen(true) }

  const submit = async (e) => {
    e.preventDefault()
    if (Number(form.budget_max) < Number(form.budget_min)) return setMsg({ type: 'warn', text: 'Maximum budget must be at least the minimum.' })
    if (form.age !== '' && (form.age < 18 || form.age > 100)) return setMsg({ type: 'warn', text: 'Age must be between 18 and 100.' })
    setBusy(true)
    const res = await saveMyProfile(user, form)
    setBusy(false)
    if (!res.ok) return setMsg({ type: 'warn', text: res.error || 'Could not save your profile.' })
    setMsg({ type: 'ok', text: 'Profile saved.' }); setOpen(false)
    setMine(await getMyProfile(user))
  }

  const remove = async () => {
    if (!window.confirm('Delete your roommate profile?')) return
    if (await deleteMyProfile(user)) { setMine(null); setMsg({ type: 'ok', text: 'Profile deleted.' }) }
    else setMsg({ type: 'warn', text: 'Could not delete your profile.' })
  }

  if (!user) {
    return (
      <div className="myprofile card">
        <div><h2 className="h4">Create my roommate profile</h2><p className="muted">Log in to publish a profile other people can match with.</p></div>
        <Link to="/login" state={{ from: '/shared-living' }} className="btn btn--primary">Log in</Link>
      </div>
    )
  }

  return (
    <div className="myprofile card">
      {!open ? (
        <>
          <div>
            <h2 className="h4">{mine ? 'Your roommate profile' : 'Create my roommate profile'}</h2>
            {mine
              ? <p className="muted">{mine.display_name} · {mine.city}{mine.locality ? `, ${mine.locality}` : ''} · ₹{Number(mine.budget_min).toLocaleString('en-IN')}–₹{Number(mine.budget_max).toLocaleString('en-IN')} · {mine.sharing_type}</p>
              : <p className="muted">Share your budget and lifestyle so others can find you. No contact details are shown publicly.</p>}
            {user.demo && <p className="muted small">Demo mode: your profile is saved in this browser only.</p>}
            {msg.text && <p className={msg.type} role="status">{msg.text}</p>}
          </div>
          <div className="row myprofile__btns">
            <button className="btn btn--primary" onClick={edit}><UserPlus size={16} /> {mine ? 'Edit profile' : 'Create profile'}</button>
            {mine && <button className="btn btn--ghost" onClick={remove}>Delete</button>}
          </div>
        </>
      ) : (
        <form className="myprofile__form" onSubmit={submit}>
          <h2 className="h4">{mine ? 'Edit your profile' : 'Create my roommate profile'}</h2>
          <div className="myprofile__grid">
            <div className="field"><label htmlFor="mp-name">Display name</label><input id="mp-name" required maxLength={40} value={form.display_name} onChange={set('display_name')} placeholder="First name and initial" /></div>
            <div className="field"><label htmlFor="mp-age">Age</label><input id="mp-age" type="number" min="18" max="100" value={form.age} onChange={set('age')} /></div>
            <div className="field"><label htmlFor="mp-occ">Occupation</label><input id="mp-occ" maxLength={60} value={form.occupation || ''} onChange={set('occupation')} placeholder="Student, engineer…" /></div>
            <div className="field"><label htmlFor="mp-city">City</label><select id="mp-city" value={form.city} onChange={set('city')}>{Object.keys(CITY_COORDS).map((c) => <option key={c}>{c}</option>)}</select></div>
            <div className="field"><label htmlFor="mp-loc">Locality</label><input id="mp-loc" value={form.locality || ''} onChange={set('locality')} /></div>
            <div className="field"><label htmlFor="mp-share">Sharing type</label><select id="mp-share" value={form.sharing_type} onChange={set('sharing_type')}><option>Private room</option><option>Shared room</option><option>Whole flat</option></select></div>
            <div className="field"><label htmlFor="mp-bmin">Budget min (₹)</label><input id="mp-bmin" type="number" min="0" step="500" required value={form.budget_min} onChange={set('budget_min')} /></div>
            <div className="field"><label htmlFor="mp-bmax">Budget max (₹)</label><input id="mp-bmax" type="number" min="0" step="500" required value={form.budget_max} onChange={set('budget_max')} /></div>
            <div className="field"><label htmlFor="mp-move">Move-in</label><input id="mp-move" value={form.move_in || ''} onChange={set('move_in')} placeholder="Immediately, next month…" /></div>
            <div className="field"><label htmlFor="mp-sleep">Sleep</label><select id="mp-sleep" value={form.sleep} onChange={set('sleep')}><option value="early">Early riser</option><option value="night">Night owl</option><option value="flexible">Flexible</option></select></div>
            <div className="field"><label htmlFor="mp-smoke">Smoking</label><select id="mp-smoke" value={form.smoking} onChange={set('smoking')}><option value="no">Non-smoker</option><option value="yes">Smoker</option></select></div>
            <div className="field"><label htmlFor="mp-diet">Food</label><select id="mp-diet" value={form.diet} onChange={set('diet')}><option value="any">Any</option><option value="veg">Vegetarian</option><option value="non-veg">Non-vegetarian</option></select></div>
            <div className="field"><label htmlFor="mp-social">At home I am</label><select id="mp-social" value={form.social} onChange={set('social')}><option value="quiet">Quiet</option><option value="balanced">Balanced</option><option value="social">Social</option></select></div>
          </div>
          <div className="field"><label htmlFor="mp-bio">Short bio</label><textarea id="mp-bio" rows="3" maxLength={300} value={form.bio || ''} onChange={set('bio')} placeholder="Do not include phone numbers or email." /></div>
          {msg.text && <p className={msg.type} role="alert">{msg.text}</p>}
          <div className="row">
            <button className="btn btn--primary" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</button>
            <button className="btn btn--ghost" type="button" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  )
}

import { useMemo, useState, useEffect } from 'react'
import { Sparkles } from 'lucide-react'
import RoommateCard from '../features/shared-living/RoommateCard.jsx'
import { DEFAULT_PREFS, rankMatches, summaryRule } from '../features/shared-living/matching.js'
import { DEMO_ROOMMATES, SHARING_TYPES } from '../data/roommates.js'
import { CITY_COORDS } from '../data/properties.js'
import { askGemini } from '../lib/gemini.js'
import { readJSON, writeJSON, DATA_EVENT } from '../lib/localStore.js'
import { useCurrentUser } from '../hooks/useCurrentUser.js'
import MyProfileForm from '../features/shared-living/MyProfileForm.jsx'
import { listRemoteRoommates } from '../features/shared-living/profilesApi.js'

const KEY = 'rentnest_roommate_prefs'

export default function SharedLiving() {
  const [prefs, setPrefs] = useState(() => ({ ...DEFAULT_PREFS, ...readJSON(KEY, {}) }))
  const [ai, setAi] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const user = useCurrentUser()
  const [remote, setRemote] = useState([])
  const set = (patch) => { setPrefs((p) => ({ ...p, ...patch })); setAi(null) }

  useEffect(() => { writeJSON(KEY, prefs) }, [prefs])

  // Real profiles from Supabase (when configured) are shown in addition to the demo profiles.
  useEffect(() => {
    let dead = false
    const load = () => listRemoteRoommates(user?.id).then((r) => { if (!dead) setRemote(r) })
    load()
    window.addEventListener(DATA_EVENT, load)
    return () => { dead = true; window.removeEventListener(DATA_EVENT, load) }
  }, [user?.id])

  const ranked = useMemo(() => rankMatches(prefs, [...remote, ...DEMO_ROOMMATES]), [prefs, remote])

  const runAi = async () => {
    setAiLoading(true)
    const top = ranked.slice(0, 4).map((m) => ({
      name: m.roommate.display_name, score: m.score, strengths: m.good, concerns: m.concerns,
      occupation: m.roommate.occupation, locality: m.roommate.locality, city: m.roommate.city,
    }))
    const res = await askGemini('roommates', { me: prefs, top })
    setAi(res.ok && res.text ? { text: res.text, source: 'Gemini' } : { text: summaryRule(ranked), source: 'Rule-based' })
    setAiLoading(false)
  }

  const budgetBad = prefs.budgetMin > prefs.budgetMax

  return (
    <section className="container section">
      <h1 className="h2">Find a roommate</h1>
      <p className="muted lead">Set your preferences. Compatibility is scored on budget, location, sharing type and lifestyle.</p>

      <div className="sl">
        <aside className="sl__side">
          <div className="filters">
            <h2 className="filters__title">Your preferences</h2>
            <div className="field">
              <label htmlFor="s-city">City</label>
              <select id="s-city" value={prefs.city} onChange={(e) => set({ city: e.target.value })}>
                {Object.keys(CITY_COORDS).map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="s-loc">Locality (optional)</label>
              <input id="s-loc" value={prefs.locality} onChange={(e) => set({ locality: e.target.value })} placeholder="e.g. Phase 7" />
            </div>
            <div className="field">
              <label>Monthly budget (₹)</label>
              <div className="pair">
                <input type="number" min="0" step="500" value={prefs.budgetMin} onChange={(e) => set({ budgetMin: Number(e.target.value) })} aria-label="Minimum budget" />
                <input type="number" min="0" step="500" value={prefs.budgetMax} onChange={(e) => set({ budgetMax: Number(e.target.value) })} aria-label="Maximum budget" />
              </div>
              {budgetBad && <span className="warn">Minimum is above maximum.</span>}
            </div>
            <div className="field">
              <label htmlFor="s-share">Preferred sharing</label>
              <select id="s-share" value={prefs.sharing} onChange={(e) => set({ sharing: e.target.value })}>
                {SHARING_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="s-sleep">Sleep schedule</label>
              <select id="s-sleep" value={prefs.sleep} onChange={(e) => set({ sleep: e.target.value })}>
                <option value="early">Early riser</option><option value="night">Night owl</option><option value="flexible">Flexible</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="s-smoke">Smoking</label>
              <select id="s-smoke" value={prefs.smoking} onChange={(e) => set({ smoking: e.target.value })}>
                <option value="no">Non-smoker</option><option value="yes">Smoker</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="s-diet">Food</label>
              <select id="s-diet" value={prefs.diet} onChange={(e) => set({ diet: e.target.value })}>
                <option value="any">Any</option><option value="veg">Vegetarian</option><option value="non-veg">Non-vegetarian</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="s-social">At home I am</label>
              <select id="s-social" value={prefs.social} onChange={(e) => set({ social: e.target.value })}>
                <option value="quiet">Quiet</option><option value="balanced">Balanced</option><option value="social">Social</option>
              </select>
            </div>
          </div>
        </aside>

        <div>
          <MyProfileForm user={user} prefs={prefs} />
          <div className="aibox card">
            <div>
              <h2 className="h4">Recommendation</h2>
              <p className="muted">Uses Gemini when configured, otherwise rule-based matching.</p>
            </div>
            <button className="btn btn--primary" onClick={runAi} disabled={aiLoading || budgetBad}>
              <Sparkles size={16} /> {aiLoading ? 'Thinking…' : 'Recommend my best match'}
            </button>
            {ai && <div className="notice aibox__out"><strong>{ai.source}</strong><p>{ai.text}</p></div>}
          </div>

          <div className="grid grid--2">
            {ranked.map((m) => <RoommateCard key={m.roommate.id} match={m} me={prefs} />)}
          </div>
          <p className="muted small">Profiles shown here include demo examples. No contact details are shown publicly. Your own profile is not listed to yourself.</p>
        </div>
      </div>
    </section>
  )
}

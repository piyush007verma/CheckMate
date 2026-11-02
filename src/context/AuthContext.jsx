import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase.js'
import { readJSON, writeJSON } from '../lib/localStore.js'

const AuthCtx = createContext(null)
const DEMO_KEY = 'rentnest_demo_user'

const fromSupabase = (u) => u && ({
  id: u.id, email: u.email, demo: false,
  name: u.user_metadata?.full_name || u.email?.split('@')[0] || 'Account',
  role: u.user_metadata?.role || 'seeker',
})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => (isSupabaseConfigured ? null : readJSON(DEMO_KEY, null)))
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined
    supabase.auth.getSession().then(({ data }) => { setUser(fromSupabase(data.session?.user)); setLoading(false) })
    const { data } = supabase.auth.onAuthStateChange((_e, session) => setUser(fromSupabase(session?.user)))
    return () => data.subscription.unsubscribe()
  }, [])

  // DEMO MODE ONLY: no password is checked and nothing is secure. Used when Supabase is not configured.
  const demoLogin = ({ name, email, role }) => {
    const u = { id: 'local-owner', email, demo: true, role: role || 'seeker', name: name || email.split('@')[0] }
    writeJSON(DEMO_KEY, u)
    setUser(u)
    return {}
  }

  const signUp = async ({ name, email, password, role }) => {
    if (!isSupabaseConfigured) return demoLogin({ name, email, role })
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name, role } } })
    if (error) return { error: error.message }
    return { needsConfirm: !data.session }
  }

  const signIn = async ({ email, password }) => {
    if (!isSupabaseConfigured) {
      const prev = readJSON(DEMO_KEY, null)
      return demoLogin({ email, name: prev?.email === email ? prev.name : '', role: prev?.email === email ? prev.role : 'owner' })
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error ? { error: error.message } : {}
  }

  const signOut = async () => {
    if (isSupabaseConfigured) await supabase.auth.signOut()
    else { try { localStorage.removeItem(DEMO_KEY) } catch { /* ignore */ } setUser(null) }
  }

  // Basic account management: display name only.
  const updateProfile = async ({ name }) => {
    const clean = String(name || '').trim()
    if (!clean) return { error: 'Name cannot be empty.' }
    if (!isSupabaseConfigured) {
      const next = { ...user, name: clean }
      writeJSON(DEMO_KEY, next); setUser(next)
      return {}
    }
    const { error } = await supabase.auth.updateUser({ data: { full_name: clean } })
    if (error) return { error: error.message }
    await supabase.from('profiles').update({ full_name: clean }).eq('id', user.id)
    setUser((u) => ({ ...u, name: clean }))
    return {}
  }

  return <AuthCtx.Provider value={{ user, loading, signUp, signIn, signOut, updateProfile }}>{children}</AuthCtx.Provider>
}

export const useAuth = () => useContext(AuthCtx)

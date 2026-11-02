import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { isSupabaseConfigured } from '../lib/supabase.js'

export default function AuthForm({ mode }) {
  const register = mode === 'register'
  const { signIn, signUp } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()
  const [f, setF] = useState({ name: '', email: '', password: '', role: 'seeker' })
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (patch) => setF((x) => ({ ...x, ...patch }))

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setInfo('')
    if (register && f.password.length < 6) return setError('Password must be at least 6 characters.')
    setBusy(true)
    const res = register ? await signUp(f) : await signIn(f)
    setBusy(false)
    if (res.error) return setError(res.error)
    if (res.needsConfirm) return setInfo('Account created. Check your email to confirm, then log in.')
    nav(loc.state?.from || (f.role === 'owner' ? '/owner' : '/'), { replace: true })
  }

  return (
    <section className="container section">
      <div className="authcard card">
        <h1 className="h2">{register ? 'Create your account' : 'Welcome back'}</h1>
        {!isSupabaseConfigured && (
          <p className="notice"><strong>Demo mode.</strong> Supabase is not configured, so this is not real authentication: any email works, no password is verified, and data stays in this browser. Do not use real passwords.</p>
        )}
        <form className="form" onSubmit={submit}>
          {register && <input required placeholder="Full name" value={f.name} onChange={(e) => set({ name: e.target.value })} aria-label="Full name" />}
          <input required type="email" placeholder="Email" value={f.email} onChange={(e) => set({ email: e.target.value })} aria-label="Email" autoComplete="email" />
          <input required={isSupabaseConfigured} type="password" placeholder="Password" value={f.password} onChange={(e) => set({ password: e.target.value })} aria-label="Password" autoComplete={register ? 'new-password' : 'current-password'} />
          {register && (
            <select value={f.role} onChange={(e) => set({ role: e.target.value })} aria-label="I am">
              <option value="seeker">I am looking for a place</option>
              <option value="owner">I own property to list</option>
            </select>
          )}
          {error && <p className="warn" role="alert">{error}</p>}
          {info && <p className="ok">{info}</p>}
          <button className="btn btn--primary" type="submit" disabled={busy}>{busy ? 'Please wait…' : register ? 'Sign up' : 'Log in'}</button>
        </form>
        <p className="muted small">
          {register ? <>Already have an account? <Link to="/login">Log in</Link></> : <>New here? <Link to="/register">Create an account</Link></>}
        </p>
      </div>
    </section>
  )
}

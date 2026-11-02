import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  const loc = useLocation()
  if (loading) return <section className="container section"><p className="muted">Loading…</p></section>
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />
  return children
}

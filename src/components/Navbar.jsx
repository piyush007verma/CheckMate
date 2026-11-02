import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Home, Menu, X, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

const links = [
  { to: '/properties', label: 'Rentals' },
  { to: '/nearby', label: 'Nearby stays' },
  { to: '/shared-living', label: 'Shared living' },
  { to: '/owner', label: 'List your property' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const { user, signOut } = useAuth()
  useEffect(() => setOpen(false), [pathname])

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <Link to="/" className="brand" aria-label="RentNest home">
          <span className="brand__mark"><Home size={18} strokeWidth={2.5} /></span>
          RentNest
        </Link>

        <nav className={`navbar__links ${open ? 'is-open' : ''}`}>
          {links.map(l => (
            <NavLink key={l.to} to={l.to} className="navbar__link">{l.label}</NavLink>
          ))}
          <div className="navbar__auth-mobile">
            {user ? (
              <>
                <Link to="/dashboard" className="btn btn--ghost">{user.name}</Link>
                <button className="btn btn--primary" onClick={signOut}>Log out</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn--ghost">Log in</Link>
                <Link to="/register" className="btn btn--primary">Sign up</Link>
              </>
            )}
          </div>
        </nav>

        <div className="navbar__actions">
          <Link to="/dashboard" className="icon-btn" aria-label="Dashboard"><User size={18} /></Link>
          {user ? (
            <button className="btn btn--ghost hide-mobile" onClick={signOut}>Log out</button>
          ) : (
            <>
              <Link to="/login" className="btn btn--ghost hide-mobile">Log in</Link>
              <Link to="/register" className="btn btn--primary hide-mobile">Sign up</Link>
            </>
          )}
          <button className="icon-btn menu-btn" onClick={() => setOpen(o => !o)} aria-label="Toggle menu" aria-expanded={open}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
    </header>
  )
}

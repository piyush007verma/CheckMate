import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div>
          <div className="brand">RentNest</div>
          <p className="muted footer__blurb">Rentals and shared living for students, professionals, families and individuals.</p>
        </div>
        <div>
          <h4>Explore</h4>
          <Link to="/properties">Rentals</Link>
          <Link to="/nearby">Nearby stays</Link>
          <Link to="/shared-living">Shared living</Link>
        </div>
        <div>
          <h4>Owners</h4>
          <Link to="/owner">List a property</Link>
          <Link to="/dashboard">Dashboard</Link>
        </div>
        <div>
          <h4>Account</h4>
          <Link to="/login">Log in</Link>
          <Link to="/register">Sign up</Link>
        </div>
      </div>
      <div className="container footer__bottom muted">
        © {new Date().getFullYear()} RentNest. Map data © OpenStreetMap contributors.
      </div>
    </footer>
  )
}

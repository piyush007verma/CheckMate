import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <section className="container section">
      <h1 className="h1">Page not found</h1>
      <Link to="/" className="btn btn--primary">Back home</Link>
    </section>
  )
}

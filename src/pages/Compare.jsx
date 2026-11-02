import { Link } from 'react-router-dom'
import SafeImage from '../components/SafeImage.jsx'
import { useCompare } from '../hooks/useStoredList.js'
import { useProperties } from '../hooks/useProperties.js'
import { formatINR, categoryLabel } from '../data/properties.js'

const rows = [
  ['Monthly rent', (p) => formatINR(p.monthly_rent)],
  ['Security deposit', (p) => formatINR(p.security_deposit)],
  ['Location', (p) => `${p.locality}, ${p.city}`],
  ['For', (p) => categoryLabel(p.category)],
  ['Type', (p) => p.property_type],
  ['Bedrooms', (p) => p.bedrooms],
  ['Bathrooms', (p) => p.bathrooms],
  ['Furnishing', (p) => p.furnishing],
  ['Available', (p) => (p.available ? 'Yes' : 'No')],
  ['Amenities', (p) => (p.amenities || []).join(', ')],
]

export default function Compare() {
  const { list, toggle } = useCompare()
  const { properties } = useProperties()
  const items = list.map((id) => properties.find((p) => p.id === id)).filter(Boolean)

  if (items.length === 0) {
    return (
      <section className="container section">
        <h1 className="h2">Compare properties</h1>
        <p className="muted">Nothing to compare yet. Use the scale icon on a property to add it.</p>
        <Link to="/properties" className="btn btn--primary">Browse rentals</Link>
      </section>
    )
  }

  return (
    <section className="container section">
      <h1 className="h2">Compare properties</h1>
      <div className="table-wrap">
        <table className="compare">
          <thead>
            <tr>
              <th />
              {items.map((p) => (
                <th key={p.id}>
                  <Link to={`/properties/${p.id}`}>
                    <SafeImage src={p.images?.[0]} alt={p.title} className="compare__img" />
                    <span className="compare__title">{p.title}</span>
                  </Link>
                  <button className="link-btn" onClick={() => toggle(p.id)}>Remove</button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, fn]) => (
              <tr key={label}>
                <th scope="row">{label}</th>
                {items.map((p) => <td key={p.id}>{fn(p)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

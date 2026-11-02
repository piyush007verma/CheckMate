import { MAX_RENT } from '../../data/properties.js'
import { PG_TYPES, universityById, distanceToUniversity } from '../../data/universities.js'

export const DEFAULT_FILTERS = {
  q: '', maxRent: MAX_RENT, category: '', propertyType: '',
  bedrooms: 0, furnishing: '', amenities: [], availableOnly: false,
  // PG near university: university = id from data/universities.js; maxDistance in km (0 = any); pgOnly limits to PG/Hostel.
  university: '', maxDistance: 5, pgOnly: false, pgFor: '',
}

const tokens = (q) => q.toLowerCase().split(/[\s,]+/).filter(Boolean)

// Relevance: how many query tokens hit city/locality (weighted) or title/type.
function relevance(p, q) {
  const t = tokens(q)
  if (t.length === 0) return 0
  const loc = `${p.city} ${p.locality}`.toLowerCase()
  const other = `${p.title} ${p.property_type} ${p.category}`.toLowerCase()
  return t.reduce((s, w) => s + (loc.includes(w) ? 3 : 0) + (other.includes(w) ? 1 : 0), 0)
}

export function filterProperties(list, f, sort = 'relevance') {
  const t = tokens(f.q)
  const uni = universityById(f.university)
  let out = list.filter((p) => {
    if (f.pgOnly && !PG_TYPES.includes(p.property_type)) return false
    if (f.pgFor && p.pg_for !== f.pgFor && p.pg_for !== 'Co-ed') return false
    if (uni) {
      const km = distanceToUniversity(p, uni)
      if (km == null || (f.maxDistance > 0 && km > f.maxDistance)) return false
    }
    if (t.length) {
      const hay = `${p.city} ${p.locality} ${p.title} ${p.property_type}`.toLowerCase()
      if (!t.every((w) => hay.includes(w))) return false
    }
    if (f.maxRent < MAX_RENT && p.monthly_rent > f.maxRent) return false
    if (f.category && p.category !== f.category) return false
    if (f.propertyType && p.property_type !== f.propertyType) return false
    if (f.bedrooms && p.bedrooms < f.bedrooms) return false
    if (f.furnishing && p.furnishing !== f.furnishing) return false
    if (f.availableOnly && !p.available) return false
    if (f.amenities.length && !f.amenities.every((a) => p.amenities?.includes(a))) return false
    return true
  })

  const byNewest = (a, b) => new Date(b.created_at) - new Date(a.created_at)
  out = [...out]
  const dist = (p) => distanceToUniversity(p, uni) ?? Infinity
  if (sort === 'distance' && uni) out.sort((a, b) => dist(a) - dist(b))
  else if (sort === 'price-asc') out.sort((a, b) => a.monthly_rent - b.monthly_rent)
  else if (sort === 'price-desc') out.sort((a, b) => b.monthly_rent - a.monthly_rent)
  else if (sort === 'newest') out.sort(byNewest)
  else if (uni) out.sort((a, b) => dist(a) - dist(b)) // relevance: nearest first when a university is chosen
  else out.sort((a, b) => relevance(b, f.q) - relevance(a, f.q) || (b.available - a.available) || byNewest(a, b))
  return out
}

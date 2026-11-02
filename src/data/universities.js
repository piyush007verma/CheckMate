// Major universities used by the "PG near university" filter. Coordinates are approximate campus gates.
export const UNIVERSITIES = [
  { id: 'chitkara', name: 'Chitkara University', short: 'Chitkara', city: 'Rajpura', latitude: 30.5168, longitude: 76.6602 },
  { id: 'cu', name: 'Chandigarh University (CU)', short: 'CU', city: 'Mohali', latitude: 30.7683, longitude: 76.5745 },
  { id: 'cgc', name: 'CGC Landran', short: 'CGC', city: 'Mohali', latitude: 30.677, longitude: 76.658 },
  { id: 'lpu', name: 'Lovely Professional University (LPU)', short: 'LPU', city: 'Phagwara', latitude: 31.2554, longitude: 75.705 },
  { id: 'thapar', name: 'Thapar Institute (TIET)', short: 'Thapar', city: 'Patiala', latitude: 30.3568, longitude: 76.3659 },
  { id: 'pu', name: 'Panjab University (PU)', short: 'PU', city: 'Chandigarh', latitude: 30.759, longitude: 76.768 },
  { id: 'punjabi', name: 'Punjabi University', short: 'Punjabi Univ.', city: 'Patiala', latitude: 30.3567, longitude: 76.4542 },
  { id: 'kuk', name: 'Kurukshetra University', short: 'KUK', city: 'Kurukshetra', latitude: 29.959, longitude: 76.817 },
  { id: 'mdu', name: 'MD University', short: 'MDU', city: 'Rohtak', latitude: 28.8836, longitude: 76.6208 },
  { id: 'mmu', name: 'MM University, Mullana', short: 'MMU', city: 'Ambala', latitude: 30.2705, longitude: 77.0495 },
]

export const PG_FOR = ['Boys', 'Girls', 'Co-ed']
export const PG_TYPES = ['PG', 'Hostel']
export const universityById = (id) => UNIVERSITIES.find((u) => u.id === id) || null

const rad = (d) => (d * Math.PI) / 180
// Great-circle distance in km.
export function distanceKm(lat1, lng1, lat2, lng2) {
  const a = Math.sin(rad(lat2 - lat1) / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Distance (km) from a property to a university, or null when the property has no valid coordinates.
export function distanceToUniversity(p, uni) {
  const lat = Number(p.latitude), lng = Number(p.longitude)
  if (!uni || p.latitude == null || p.longitude == null || !Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return distanceKm(lat, lng, uni.latitude, uni.longitude)
}

// Closest university within maxKm, as { uni, km } or null.
export function nearestUniversity(p, maxKm = 8) {
  let best = null
  for (const uni of UNIVERSITIES) {
    const km = distanceToUniversity(p, uni)
    if (km != null && km <= maxKm && (!best || km < best.km)) best = { uni, km }
  }
  return best
}

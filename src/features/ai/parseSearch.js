import { CATEGORIES, PROPERTY_TYPES, FURNISHING, AMENITIES, MAX_RENT } from '../../data/properties.js'

const num = (s) => {
  const m = String(s).toLowerCase().replace(/,/g, '').match(/(\d+(?:\.\d+)?)\s*(k|l|lakh|lac)?/)
  if (!m) return 0
  const n = parseFloat(m[1])
  return Math.round(m[2] === 'k' ? n * 1000 : m[2] ? n * 100000 : n)
}

// Rule-based natural-language parser. Works with no AI, e.g. "2bhk under 20000 in Pune furnished".
// cities: list of known city/locality names so we can spot places in the text.
export function parseSearchRule(text, places = []) {
  const t = ` ${String(text || '').toLowerCase()} `
  const f = {}

  const bhk = t.match(/(\d)\s*-?\s*(?:bhk|bed(?:room)?s?|bd)\b/)
  if (bhk) f.bedrooms = Math.min(4, Number(bhk[1]))

  const rent = t.match(/(?:under|below|upto|up to|within|max(?:imum)?|less than|<=?|budget(?: of)?)\s*(?:rs\.?|inr|₹)?\s*(\d[\d,.]*\s*(?:k|l|lakh|lac)?)/)
    || t.match(/(?:rs\.?|inr|₹)\s*(\d[\d,.]*\s*(?:k|l|lakh|lac)?)/)
    || t.match(/\b(\d{4,6}|\d{1,2}\s*k)\b\s*(?:per month|\/month|pm|a month)?/)
  if (rent) { const v = num(rent[1]); if (v >= 1000) f.maxRent = Math.min(v, MAX_RENT) }

  if (/\bsemi[\s-]?furnished\b/.test(t)) f.furnishing = 'Semi-furnished'
  else if (/\bunfurnished\b/.test(t)) f.furnishing = 'Unfurnished'
  else if (/\bfurnished\b/.test(t)) f.furnishing = 'Furnished'

  if (/\b(student|students|college|university|hostel|pg)\b/.test(t)) f.category = 'student'
  else if (/\b(professional|working|job|office|co-?living)\b/.test(t)) f.category = 'professional'
  else if (/\b(family|families|kids|children)\b/.test(t)) f.category = 'family'
  else if (/\b(individual|single|solo|studio|alone)\b/.test(t)) f.category = 'individual'

  const type = PROPERTY_TYPES.find((p) => t.includes(` ${p.toLowerCase()} `) || t.includes(` ${p.toLowerCase()}s `))
  if (type) f.propertyType = type

  const amenities = AMENITIES.filter((a) => t.includes(a.toLowerCase()) || (a === 'WiFi' && /wi-?fi/.test(t)) || (a === 'Meals included' && /\bmeals?\b/.test(t)))
  if (amenities.length) f.amenities = amenities

  const place = [...places].sort((a, b) => b.length - a.length).find((c) => t.includes(` ${c.toLowerCase()} `) || t.includes(` ${c.toLowerCase()},`) || t.includes(` ${c.toLowerCase()}.`))
  if (place) f.q = place

  return f
}

// Turns Gemini's JSON text into a safe filter object (whitelisted values only).
export function sanitizeFilters(raw) {
  const f = {}
  if (!raw || typeof raw !== 'object') return f
  const place = [raw.locality, raw.city].filter((x) => typeof x === 'string' && x.trim()).join(' ').trim()
  if (place) f.q = place
  const rent = Number(raw.maxRent)
  if (rent >= 1000) f.maxRent = Math.min(rent, MAX_RENT)
  if (CATEGORIES.some((c) => c.value === raw.category)) f.category = raw.category
  const bd = Number(raw.bedrooms)
  if (bd >= 1) f.bedrooms = Math.min(4, Math.floor(bd))
  const fur = FURNISHING.find((x) => x.toLowerCase() === String(raw.furnishing || '').toLowerCase())
  if (fur) f.furnishing = fur
  if (Array.isArray(raw.amenities)) {
    const am = raw.amenities.map((a) => AMENITIES.find((x) => x.toLowerCase() === String(a).toLowerCase())).filter(Boolean)
    if (am.length) f.amenities = am
  }
  return f
}

export function parseJsonLoose(text) {
  try {
    const clean = String(text).replace(/```json|```/g, '').trim()
    const start = clean.search(/[\[{]/)
    return JSON.parse(start > 0 ? clean.slice(start) : clean)
  } catch { return null }
}

export function describeFilters(f) {
  const out = []
  if (f.q) out.push(f.q)
  if (f.bedrooms) out.push(`${f.bedrooms}+ bed`)
  if (f.maxRent) out.push(`≤ ₹${f.maxRent.toLocaleString('en-IN')}`)
  if (f.furnishing) out.push(f.furnishing)
  if (f.category) out.push(CATEGORIES.find((c) => c.value === f.category)?.label || f.category)
  if (f.propertyType) out.push(f.propertyType)
  ;(f.amenities || []).forEach((a) => out.push(a))
  return out
}

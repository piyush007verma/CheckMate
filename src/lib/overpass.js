// Free, keyless nearby-places lookup using OpenStreetMap data via the Overpass API.
// Gives real names, kinds and coordinates (and phone/website when mapped). It does NOT contain rent or availability.
// Results are cached for 24h per city+radius to respect the Overpass usage policy.
import { readJSON, writeJSON } from './localStore.js'

// Public Overpass servers. They are often overloaded (timeouts / 504), so requests are "hedged":
// the first server starts immediately, the next ones start a couple of seconds later only if nothing
// has answered yet, and as soon as one succeeds the rest are cancelled.
const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
]
const CLIENT_TIMEOUT = 20000 // per server
const STAGGER_MS = 2500 // delay before starting each additional server
const PASSES = 2
const BACKOFF_MS = 2000
const MAX_RADIUS_KM = 8
const TTL = 24 * 60 * 60 * 1000

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Deliberately light: tag filters are cheap on Overpass, case-insensitive regex over every named
// object is NOT (that was causing the 15 s timeouts and 504s). Names are matched case-sensitively
// on nodes/ways only, with a short fixed list of words.
export const buildQuery = (lat, lon, radius) => `[out:json][timeout:20];
(
  nwr["tourism"~"^(hostel|guest_house)$"](around:${radius},${lat},${lon});
  nwr["building"="dormitory"](around:${radius},${lat},${lon});
  nwr["amenity"="student_accommodation"](around:${radius},${lat},${lon});
  node["name"~"PG|Paying Guest|Hostel|hostel|Co-living|Coliving"](around:${radius},${lat},${lon});
  way["name"~"PG|Paying Guest|Hostel|hostel|Co-living|Coliving"](around:${radius},${lat},${lon});
);
out center tags 120;`

function kindOf(tags) {
  if (tags.tourism === 'hostel') return 'Hostel'
  if (tags.tourism === 'guest_house') return 'Guest house'
  if (tags.tourism === 'apartment') return 'Serviced apartment'
  if (tags.building === 'dormitory' || tags.amenity === 'student_accommodation') return 'Dormitory'
  if (/co-?living/i.test(tags.name || '')) return 'Co-living'
  return 'PG / hostel'
}

// Turns raw Overpass elements into clean place objects. Unnamed or coordinate-less elements are dropped.
export function normalize(elements = []) {
  const seen = new Set()
  return elements.map((el) => {
    const t = el.tags || {}
    const latitude = el.lat ?? el.center?.lat
    const longitude = el.lon ?? el.center?.lon
    if (!t.name || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
    const address = [t['addr:housenumber'], t['addr:street'], t['addr:suburb'] || t['addr:neighbourhood'], t['addr:city']].filter(Boolean).join(', ')
    return {
      id: `osm-${el.type}-${el.id}`, name: t.name, kind: kindOf(t), latitude, longitude, address,
      phone: t.phone || t['contact:phone'] || '', website: t.website || t['contact:website'] || '',
      osmUrl: `https://www.openstreetmap.org/${el.type}/${el.id}`,
    }
  }).filter((p) => p && !seen.has(p.id) && seen.add(p.id))
}

// Turns any low-level failure into a message that is safe to show to the user.
function friendlyMessage(e) {
  const m = String(e?.message || '')
  if (/\b(429|502|503|504)\b/.test(m) || e?.name === 'AbortError' || /runtime error|Unexpected Overpass|timed out/i.test(m)) {
    return 'The free map data service is busy right now. Please tap Refresh again in a minute.'
  }
  if (/Failed to fetch|NetworkError|Load failed/i.test(m)) {
    return 'Could not reach the map data service. Check your internet connection and try again.'
  }
  return 'Could not load nearby stays right now. Please try again shortly.'
}

async function tryServer(url, body, ctl) {
  const timer = setTimeout(() => ctl.abort(), CLIENT_TIMEOUT)
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: ctl.signal,
    })
    if (!res.ok) throw new Error(`Overpass responded ${res.status}`)
    const text = await res.text()
    let data
    try { data = JSON.parse(text) } catch { throw new Error('Unexpected Overpass response') } // HTML error page etc.
    if (!Array.isArray(data.elements)) throw new Error('Unexpected Overpass response') // e.g. a "runtime error" body
    // A 200 with a runtime-error remark and nothing in it is a failure, not "no results".
    if (data.remark && /runtime error|timed out|out of memory/i.test(data.remark) && data.elements.length === 0) {
      throw new Error('Unexpected Overpass response')
    }
    return data
  } finally {
    clearTimeout(timer)
  }
}

// One pass over all servers, staggered. Resolves with the first good response and cancels the others.
async function raceServers(body) {
  let settled = false
  const ctls = []
  const runs = ENDPOINTS.map(async (url, i) => {
    await sleep(i * STAGGER_MS)
    if (settled) throw new Error('skipped')
    const ctl = new AbortController()
    ctls.push(ctl)
    return tryServer(url, body, ctl)
  })
  try {
    return await Promise.any(runs)
  } catch (agg) {
    const real = (agg?.errors || []).filter((e) => e?.message !== 'skipped')
    throw real[real.length - 1] || agg
  } finally {
    settled = true
    ctls.forEach((c) => c.abort())
  }
}

// Returns { places, cached, stale }. Throws only if there is no cache to fall back on.
export async function fetchNearby(city, [lat, lon], radiusKm) {
  const km = Math.min(Number(radiusKm) || 5, MAX_RADIUS_KM)
  const key = `rentnest_osm_${city}_${radiusKm}`
  const hit = readJSON(key, null)
  if (hit && Date.now() - hit.at < TTL) return { places: hit.places, cached: true }
  try {
    const body = `data=${encodeURIComponent(buildQuery(lat, lon, km * 1000))}`
    let json = null, lastErr = null
    for (let pass = 0; pass < PASSES && !json; pass++) {
      try {
        json = await raceServers(body)
      } catch (e) {
        lastErr = e
        if (pass < PASSES - 1) await sleep(BACKOFF_MS)
      }
    }
    if (!json) throw lastErr || new Error('No Overpass server reachable')
    const places = normalize(json.elements)
    writeJSON(key, { at: Date.now(), places })
    return { places, cached: false }
  } catch (e) {
    if (hit) return { places: hit.places, cached: true, stale: true }
    throw new Error(friendlyMessage(e))
  }
}

export const googleMapsUrl = (p) => `https://www.google.com/maps/search/?api=1&query=${p.latitude},${p.longitude}`
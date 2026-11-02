import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import { Search, LocateFixed } from 'lucide-react'
import { defaultIcon, OSM_URL, OSM_ATTR } from './PropertyMap.jsx'

const ok = (n) => Number.isFinite(Number(n))

function ClickToPin({ onPick }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) })
  return null
}

// Moves the map when `target` changes (city change, search result, GPS). zoom optional.
function FlyTo({ target }) {
  const map = useMap()
  useEffect(() => {
    map.invalidateSize()
    if (target) map.flyTo([target.lat, target.lng], target.zoom ?? map.getZoom(), { duration: 0.6 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.lat, target?.lng, target?.zoom, map])
  return null
}

// Owner picks the exact spot: click the map, drag the pin, search a place, or use GPS.
// value: { lat, lng } | null (null = nothing pinned yet). center: [lat, lng] used to frame the map (e.g. the chosen city).
export default function LocationPicker({ value, center, onChange }) {
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [fly, setFly] = useState(null)
  const pin = value && ok(value.lat) && ok(value.lng) ? { lat: Number(value.lat), lng: Number(value.lng) } : null
  const start = pin ? [pin.lat, pin.lng] : center

  // Re-frame when the city (center) changes and nothing is pinned yet.
  useEffect(() => { if (!pin && center) setFly({ lat: center[0], lng: center[1], zoom: 13 }) }, [center?.[0], center?.[1]]) // eslint-disable-line react-hooks/exhaustive-deps

  const choose = (lat, lng, zoom) => { setMsg(''); onChange({ lat: Math.round(lat * 1e6) / 1e6, lng: Math.round(lng * 1e6) / 1e6 }); if (zoom) setFly({ lat, lng, zoom }) }

  const search = async (e) => {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    setBusy(true); setMsg('')
    try {
      // One user-initiated request per search to the public OSM Nominatim service (no autocomplete, per its usage policy).
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=in&q=${encodeURIComponent(q)}`
      const res = await fetch(url, { headers: { Accept: 'application/json' } })
      const data = res.ok ? await res.json() : []
      if (data[0]) choose(Number(data[0].lat), Number(data[0].lon), 17)
      else setMsg('No match found. Try a landmark or click the map instead.')
    } catch { setMsg('Search is unavailable right now. Click the map to place the pin.') }
    setBusy(false)
  }

  const locate = () => {
    if (!navigator.geolocation) return setMsg('Your browser does not support location access.')
    setBusy(true); setMsg('')
    navigator.geolocation.getCurrentPosition(
      (pos) => { choose(pos.coords.latitude, pos.coords.longitude, 17); setBusy(false) },
      () => { setMsg('Could not get your location. Allow location access or click the map.'); setBusy(false) },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  return (
    <div className="locpick">
      <form className="locpick__bar" onSubmit={search} role="search">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search a place or landmark, e.g. Chitkara University" aria-label="Search a place on the map" />
        <button className="btn btn--ghost" type="submit" disabled={busy}><Search size={16} /> Search</button>
        <button className="btn btn--ghost" type="button" onClick={locate} disabled={busy}><LocateFixed size={16} /> Use my location</button>
      </form>
      <div className="locpick__map">
        <MapContainer center={start} zoom={pin ? 16 : 13} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
          <TileLayer url={OSM_URL} attribution={OSM_ATTR} maxZoom={19} />
          <ClickToPin onPick={(lat, lng) => choose(lat, lng)} />
          <FlyTo target={fly} />
          {pin && (
            <Marker
              position={[pin.lat, pin.lng]}
              icon={defaultIcon}
              draggable
              eventHandlers={{ dragend: (e) => { const ll = e.target.getLatLng(); choose(ll.lat, ll.lng) } }}
            />
          )}
        </MapContainer>
      </div>
      <p className={`locpick__status ${pin ? 'is-set' : 'muted'}`} role="status">
        {pin ? `Pinned at ${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)}. Drag the pin or click elsewhere to adjust.` : 'Click the map to drop a pin on your property’s exact location.'}
      </p>
      {msg && <p className="warn" role="alert">{msg}</p>}
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'
import { X } from 'lucide-react'
import SafeImage from '../../components/SafeImage.jsx'
import { formatINR, categoryLabel } from '../../data/properties.js'

// Vite does not resolve Leaflet's default icon paths, so set them explicitly.
export const defaultIcon = L.icon({
  iconUrl, iconRetinaUrl, shadowUrl,
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
})
export const activeIcon = L.icon({
  iconUrl, iconRetinaUrl, shadowUrl,
  iconSize: [32, 52], iconAnchor: [16, 52], popupAnchor: [1, -42], shadowSize: [52, 52],
  className: 'pmap__marker--active',
})

const hasCoords = (p) => Number.isFinite(Number(p.latitude)) && Number.isFinite(Number(p.longitude))
export const OSM_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
export const OSM_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

// Fits the view to the markers whenever the set of results changes; also fixes sizing after show/hide.
export function FitBounds({ points }) {
  const map = useMap()
  const key = points.map((p) => p.id).join('|')
  useEffect(() => {
    map.invalidateSize()
    if (points.length === 0) return
    if (points.length === 1) { map.setView([points[0].latitude, points[0].longitude], 14); return }
    map.fitBounds(points.map((p) => [Number(p.latitude), Number(p.longitude)]), { padding: [48, 48], maxZoom: 14 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, map])
  return null
}

// properties: list to plot. single: small, non-interactive-card map for the detail page.
export default function PropertyMap({ properties, single = false, height = 560 }) {
  const points = useMemo(() => properties.filter(hasCoords), [properties])
  const [selectedId, setSelectedId] = useState(null)
  const selected = points.find((p) => p.id === selectedId) || null
  const missing = properties.length - points.length

  if (points.length === 0) {
    return (
      <div className="pmap pmap--empty card" style={{ height: single ? 280 : 260 }}>
        <p className="muted">No map locations to show for these results.</p>
      </div>
    )
  }

  return (
    <div className={`pmap ${single ? 'pmap--single' : ''}`} style={{ height: single ? 320 : height }}>
      <MapContainer center={[points[0].latitude, points[0].longitude]} zoom={single ? 14 : 10} scrollWheelZoom={!single} style={{ height: '100%', width: '100%' }}>
        <TileLayer url={OSM_URL} attribution={OSM_ATTR} maxZoom={19} />
        <FitBounds points={points} />
        {points.map((p) => (
          <Marker
            key={p.id}
            position={[Number(p.latitude), Number(p.longitude)]}
            icon={p.id === selectedId ? activeIcon : defaultIcon}
            title={p.title}
            eventHandlers={single ? {} : { click: () => setSelectedId(p.id) }}
          />
        ))}
      </MapContainer>

      {!single && selected && (
        <article className="pmap__card" aria-live="polite">
          <button className="icon-btn pmap__close" onClick={() => setSelectedId(null)} aria-label="Close property card"><X size={16} /></button>
          <Link to={`/properties/${selected.id}`} className="pmap__cardlink">
            <div className="pmap__thumb"><SafeImage src={selected.images?.[0]} alt={selected.title} /></div>
            <div className="pmap__info">
              <span className="chip">{categoryLabel(selected.category)}</span>
              <h3 className="pmap__title">{selected.title}</h3>
              <p className="muted pmap__loc">{selected.locality}, {selected.city}</p>
              <p className="pmap__price"><strong>{formatINR(selected.monthly_rent)}</strong> <span className="muted">/ month</span></p>
              <span className="link-btn">View details</span>
            </div>
          </Link>
        </article>
      )}
      {!single && !selected && <p className="pmap__hint">Select a marker to preview a property{missing > 0 ? ` · ${missing} without location` : ''}</p>}
    </div>
  )
}

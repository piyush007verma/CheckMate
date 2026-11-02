import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import { X, ExternalLink } from 'lucide-react'
import { defaultIcon, activeIcon, FitBounds, OSM_URL, OSM_ATTR } from '../maps/PropertyMap.jsx'
import { googleMapsUrl } from '../../lib/overpass.js'

function FlyTo({ place }) {
  const map = useMap()
  useEffect(() => { if (place) map.flyTo([place.latitude, place.longitude], Math.max(map.getZoom(), 15), { duration: .6 }) }, [place, map])
  return null
}

export default function NearbyMap({ places, selectedId, onSelect, center, height = 520 }) {
  const selected = places.find((p) => p.id === selectedId) || null
  return (
    <div className="pmap" style={{ height }}>
      <MapContainer center={center} zoom={12} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
        <TileLayer url={OSM_URL} attribution={OSM_ATTR} maxZoom={19} />
        <FitBounds points={places.length ? places : [{ id: 'c', latitude: center[0], longitude: center[1] }]} />
        <FlyTo place={selected} />
        {places.map((p) => (
          <Marker key={p.id} position={[p.latitude, p.longitude]} icon={p.id === selectedId ? activeIcon : defaultIcon} title={p.name} eventHandlers={{ click: () => onSelect(p.id) }} />
        ))}
      </MapContainer>
      {selected && (
        <article className="pmap__card" aria-live="polite">
          <button className="icon-btn pmap__close" onClick={() => onSelect(null)} aria-label="Close place card"><X size={16} /></button>
          <div className="pmap__cardlink">
            <div className="pmap__info">
              <span className="chip">{selected.kind}</span>
              <h3 className="pmap__title">{selected.name}</h3>
              <p className="muted pmap__loc">{selected.address || 'Address not listed'}</p>
              <a className="link-btn" href={googleMapsUrl(selected)} target="_blank" rel="noreferrer">Open in Google Maps <ExternalLink size={12} /></a>
            </div>
          </div>
        </article>
      )}
    </div>
  )
}

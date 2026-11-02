import { lazy, Suspense } from 'react'
import ErrorBoundary from '../../components/ErrorBoundary.jsx'

const PropertyMap = lazy(() => import('./PropertyMap.jsx'))

// Loads Leaflet only when a map is shown, and keeps map failures from breaking the page.
export default function LazyMap(props) {
  return (
    <ErrorBoundary title="The map could not load">
      <Suspense fallback={<div className="pmap pmap--empty card" style={{ height: props.single ? 320 : 400 }}><p className="muted" role="status">Loading map…</p></div>}>
        <PropertyMap {...props} />
      </Suspense>
    </ErrorBoundary>
  )
}

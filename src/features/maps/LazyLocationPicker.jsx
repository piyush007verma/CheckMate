import { lazy, Suspense } from 'react'
import ErrorBoundary from '../../components/ErrorBoundary.jsx'

const LocationPicker = lazy(() => import('./LocationPicker.jsx'))

export default function LazyLocationPicker(props) {
  return (
    <ErrorBoundary title="The location map could not load">
      <Suspense fallback={<div className="locpick__map pmap--empty card"><p className="muted" role="status">Loading map…</p></div>}>
        <LocationPicker {...props} />
      </Suspense>
    </ErrorBoundary>
  )
}

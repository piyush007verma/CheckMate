import { useState } from 'react'
import { Home } from 'lucide-react'

// Image with a graceful fallback if the remote URL fails.
export default function SafeImage({ src, alt = '', className = '' }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) {
    return <div className={`img-fallback ${className}`} role="img" aria-label={alt}><Home size={28} /></div>
  }
  return <img src={src} alt={alt} className={className} loading="lazy" onError={() => setFailed(true)} />
}

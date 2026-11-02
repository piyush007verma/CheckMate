import { Link } from 'react-router-dom'
import { Scale, X } from 'lucide-react'
import { useCompare } from '../hooks/useStoredList.js'

export default function CompareBar() {
  const { list, clear } = useCompare()
  if (list.length === 0) return null
  return (
    <div className="comparebar" role="region" aria-label="Compare tray">
      <Scale size={18} />
      <span>{list.length} selected (max 3)</span>
      <Link to="/compare" className={`btn btn--primary ${list.length < 2 ? 'is-disabled' : ''}`} aria-disabled={list.length < 2} onClick={(e) => list.length < 2 && e.preventDefault()}>
        {list.length < 2 ? 'Pick 2 to compare' : 'Compare'}
      </Link>
      <button className="icon-btn" onClick={clear} aria-label="Clear compare list"><X size={16} /></button>
    </div>
  )
}

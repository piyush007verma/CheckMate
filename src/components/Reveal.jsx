import { useEffect, useState } from 'react'
import { useInView, prefersReducedMotion } from '../hooks/useInView.js'

// Fades/slides/zooms its children in when scrolled into view. variant: up | zoom | left | right | pop.
export default function Reveal({ as: Tag = 'div', variant = 'up', delay = 0, className = '', children, ...rest }) {
  const [ref, inView] = useInView()
  return (
    <Tag ref={ref} className={`reveal reveal--${variant} ${inView ? 'is-in' : ''} ${className}`.trim()} style={{ '--d': `${delay}ms` }} {...rest}>
      {children}
    </Tag>
  )
}

// Number that counts up when it scrolls into view.
export function CountUp({ to, suffix = '', duration = 1500 }) {
  const [ref, inView] = useInView({ threshold: 0.5 })
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!inView) return undefined
    if (prefersReducedMotion()) { setN(to); return undefined }
    let raf, t0
    const step = (t) => {
      t0 = t0 ?? t
      const k = Math.min(1, (t - t0) / duration)
      setN(Math.round(to * (1 - Math.pow(1 - k, 3))))
      if (k < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [inView, to, duration])
  return <span ref={ref}>{n.toLocaleString('en-IN')}{suffix}</span>
}

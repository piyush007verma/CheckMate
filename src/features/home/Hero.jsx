import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, MapPin, Wallet, Sparkles, GraduationCap, ArrowRight } from 'lucide-react'
import SafeImage from '../../components/SafeImage.jsx'
import { CountUp } from '../../components/Reveal.jsx'
import { DEMO_PROPERTIES, formatINR } from '../../data/properties.js'
import { UNIVERSITIES } from '../../data/universities.js'
import { useProperties } from '../../hooks/useProperties.js'

const BUDGETS = [
  { label: 'Any budget', value: '' },
  { label: 'Up to ₹10,000', value: 10000 },
  { label: 'Up to ₹20,000', value: 20000 },
  { label: 'Up to ₹30,000', value: 30000 },
  { label: 'Up to ₹50,000', value: 50000 },
]

export default function Hero() {
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [max, setMax] = useState('')
  const root = useRef(null)
  const { properties } = useProperties()
  const stats = useMemo(() => ({
    homes: properties.length,
    cities: new Set(properties.map((p) => p.city)).size,
    unis: UNIVERSITIES.length,
  }), [properties])

  // Light parallax: the collage drifts at different speeds while you scroll past the hero.
  useEffect(() => {
    const el = root.current
    if (!el || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined
    let raf = 0
    const update = () => { raf = 0; el.style.setProperty('--sy', String(Math.min(window.scrollY, 700))) }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf) }
  }, [])

  const go = (e) => {
    e.preventDefault()
    const sp = new URLSearchParams()
    if (q.trim()) sp.set('q', q.trim())
    if (max) sp.set('max', max)
    nav(`/properties?${sp.toString()}`)
  }
  const pics = [DEMO_PROPERTIES[3], DEMO_PROPERTIES[6], DEMO_PROPERTIES[0]]

  return (
    <section className="hero" ref={root}>
      <div className="hero__blob hero__blob--1" aria-hidden="true" />
      <div className="hero__blob hero__blob--2" aria-hidden="true" />
      <div className="hero__blob hero__blob--3" aria-hidden="true" />
      <div className="container hero__inner">
        <div className="hero__copy">
          <Link to="/properties?university=cu" className="hero__pill hero__in" style={{ '--n': 0 }}>
            <span className="hero__dot" /> <GraduationCap size={15} /> New: PGs near CU, Chitkara, LPU, Thapar &amp; more <ArrowRight size={14} />
          </Link>
          <h1 className="hero__title">
            <span className="hero__line"><span style={{ '--n': 1 }}>Find a place that</span></span>
            <span className="hero__line"><span className="hero__grad" style={{ '--n': 2 }}>fits how you live.</span></span>
          </h1>
          <p className="lead muted hero__in" style={{ '--n': 3 }}>PGs, flats, family homes and shared living across Punjab, Chandigarh, Haryana and beyond. Real rent and deposit shown upfront, and you can chat with owners directly.</p>
          <form className="herosearch hero__in" style={{ '--n': 4 }} onSubmit={go}>
            <label className="herosearch__field">
              <MapPin size={18} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="City, locality or university" aria-label="City or locality" />
            </label>
            <label className="herosearch__field">
              <Wallet size={18} />
              <select value={max} onChange={(e) => setMax(e.target.value)} aria-label="Budget">
                {BUDGETS.map((b) => <option key={b.label} value={b.value}>{b.label}</option>)}
              </select>
            </label>
            <button className="btn btn--primary herosearch__btn" type="submit"><Search size={18} /> Search</button>
          </form>
          <dl className="herostats hero__in" style={{ '--n': 5 }}>
            <div><dt>Homes &amp; PGs</dt><dd><CountUp to={stats.homes} suffix="+" /></dd></div>
            <div><dt>Cities</dt><dd><CountUp to={stats.cities} /></dd></div>
            <div><dt>Universities covered</dt><dd><CountUp to={stats.unis} /></dd></div>
          </dl>
        </div>
        <div className="hero__collage" aria-hidden="true">
          <div className="hero__tile hero__tile--a" style={{ '--k': -0.07 }}><SafeImage src={pics[0].images[0]} className="hero__img" /></div>
          <div className="hero__tile hero__tile--b" style={{ '--k': -0.14 }}><SafeImage src={pics[1].images[0]} className="hero__img" /></div>
          <div className="hero__tile hero__tile--c" style={{ '--k': -0.03 }}><SafeImage src={pics[2].images[0]} className="hero__img" /></div>
          <div className="hero__float hero__float--1"><Sparkles size={16} /> <span><strong>{pics[2].locality}, {pics[2].city}</strong><small>{formatINR(pics[2].monthly_rent)} / month</small></span></div>
          <div className="hero__float hero__float--2"><span className="hero__ok" /> <span><strong>Chat with owners</strong><small>Ask before you visit</small></span></div>
        </div>
      </div>
    </section>
  )
}

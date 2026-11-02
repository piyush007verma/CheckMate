import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Receipt, Users, MapPinned, Sparkles, GraduationCap, ArrowUpRight, Search, MessageCircle, KeyRound, MapPin } from 'lucide-react'
import PropertyCard from '../../components/PropertyCard.jsx'
import Reveal from '../../components/Reveal.jsx'
import { useProperties } from '../../hooks/useProperties.js'
import { UNIVERSITIES, distanceToUniversity, PG_TYPES } from '../../data/universities.js'
import { CITY_COORDS, formatINR } from '../../data/properties.js'

export function Marquee() {
  const items = [...Object.keys(CITY_COORDS).slice(0, 12).map((c) => ({ t: c, u: false })), ...UNIVERSITIES.map((u) => ({ t: u.short, u: true }))]
  const row = (hidden) => (
    <ul className="marquee__row" aria-hidden={hidden || undefined}>
      {items.map((x) => <li key={x.t}>{x.u ? <GraduationCap size={15} /> : <MapPin size={15} />} {x.t}</li>)}
    </ul>
  )
  return (
    <div className="marquee" aria-label="Cities and universities we cover">
      <div className="marquee__track">{row(false)}{row(true)}</div>
    </div>
  )
}

export function Featured() {
  const { properties } = useProperties()
  const items = [...properties].filter((p) => p.available).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 6)
  return (
    <section className="container section">
      <Reveal className="sectionhead">
        <div>
          <span className="eyebrow">Fresh on RentNest</span>
          <h2 className="h2">Featured rentals</h2>
        </div>
        <Link to="/properties" className="btn btn--ghost">View all <ArrowUpRight size={16} /></Link>
      </Reveal>
      <div className="grid">
        {items.map((p, i) => <Reveal key={p.id} variant="pop" delay={(i % 3) * 110 + Math.floor(i / 3) * 60}><PropertyCard property={p} /></Reveal>)}
      </div>
    </section>
  )
}

// One tile per university: how many PGs/hostels sit within 5 km and the cheapest rent.
export function UniversityShowcase() {
  const { properties } = useProperties()
  const tiles = useMemo(() => UNIVERSITIES.slice(0, 8).map((u) => {
    const near = properties.filter((p) => PG_TYPES.includes(p.property_type) && p.available && (distanceToUniversity(p, u) ?? 99) <= 5)
    return { u, count: near.length, min: near.length ? Math.min(...near.map((p) => p.monthly_rent)) : null }
  }), [properties])
  return (
    <section className="container section">
      <Reveal>
        <span className="eyebrow">Student housing</span>
        <h2 className="h2">PGs near top universities</h2>
        <p className="lead muted">Pick your campus and see PGs and hostels within walking or short-ride distance, nearest first.</p>
      </Reveal>
      <div className="unigrid">
        {tiles.map(({ u, count, min }, i) => (
          <Reveal key={u.id} variant="pop" delay={(i % 4) * 90 + Math.floor(i / 4) * 80}>
            <Link to={`/properties?university=${u.id}`} className="unitile">
              <span className="unitile__icon"><GraduationCap size={22} /></span>
              <strong className="unitile__name">{u.short}</strong>
              <span className="muted unitile__city">{u.city}</span>
              <span className="unitile__meta">{count} PG{count === 1 ? '' : 's'} within 5 km{min ? ` · from ${formatINR(min)}` : ''}</span>
              <ArrowUpRight className="unitile__arrow" size={18} />
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

const STEPS = [
  { icon: Search, title: 'Search & filter', text: 'Filter by budget, who it is for, or distance from your university.' },
  { icon: MessageCircle, title: 'Chat with the owner', text: 'Send an enquiry and ask about visits, food and availability in one thread.' },
  { icon: KeyRound, title: 'Visit & move in', text: 'Check the exact pin on the map, then settle in with the deposit clear upfront.' },
]

export function HowItWorks() {
  return (
    <section className="container section">
      <Reveal><span className="eyebrow">Simple by design</span><h2 className="h2">How RentNest works</h2></Reveal>
      <div className="steps">
        {STEPS.map(({ icon: Icon, title, text }, i) => (
          <Reveal key={title} variant="up" delay={i * 140} className="step">
            <span className="step__num">{i + 1}</span>
            <span className="step__icon"><Icon size={22} /></span>
            <h3 className="h4">{title}</h3>
            <p className="muted">{text}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

export function SharedPromo() {
  const people = ['AK', 'SM', 'RD', 'NP']
  return (
    <section className="container section">
      <Reveal variant="zoom" className="promo">
        <div>
          <span className="eyebrow">Shared living</span>
          <h2 className="h2">Share a home, split the rent</h2>
          <p className="lead">Tell us your budget, locality and lifestyle. We score how well you match with other people looking for a shared home.</p>
          <Link to="/shared-living" className="btn btn--primary">Find a roommate</Link>
        </div>
        <div className="promo__avatars" aria-hidden="true">
          {people.map((p, i) => <span key={p} className="avatar" style={{ '--i': i }}>{p}</span>)}
        </div>
      </Reveal>
    </section>
  )
}

const BENEFITS = [
  { icon: Receipt, title: 'Clear pricing', text: 'Monthly rent and security deposit are shown on every listing.' },
  { icon: Users, title: 'Shared living built in', text: 'Rentals and roommate matching live in one place.' },
  { icon: MapPinned, title: 'Exact map locations', text: 'Owners pin the precise spot, so you know where you are going.' },
  { icon: Sparkles, title: 'Smart suggestions', text: 'Describe what you want in plain words and get ranked results.' },
]

export function Benefits() {
  return (
    <section className="container section">
      <Reveal><h2 className="h2">Why RentNest</h2></Reveal>
      <div className="benefits">
        {BENEFITS.map(({ icon: Icon, title, text }, i) => (
          <Reveal key={title} variant="up" delay={i * 100} className="benefit">
            <span className="benefit__icon"><Icon size={20} /></span>
            <h3 className="h4">{title}</h3>
            <p className="muted">{text}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

export function OwnerCta() {
  return (
    <section className="container section">
      <Reveal variant="zoom" className="ownercta">
        <div>
          <h2 className="h2">Own a property? List it on RentNest.</h2>
          <p>Pin the exact location, add photos, set your rent and chat with interested tenants from one dashboard.</p>
        </div>
        <Link to="/owner" className="btn btn--primary ownercta__btn">List your property</Link>
      </Reveal>
    </section>
  )
}

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { GraduationCap, Briefcase, Users, User } from 'lucide-react'
import Reveal from '../../components/Reveal.jsx'
import PropertyCard from '../../components/PropertyCard.jsx'
import { useProperties } from '../../hooks/useProperties.js'

const AUDIENCES = [
  { value: 'student', label: 'Students', icon: GraduationCap, title: 'Close to campus, easy on the budget', blurb: 'PGs, hostels and shared rooms with meals, study desks and fast WiFi.' },
  { value: 'professional', label: 'Professionals', icon: Briefcase, title: 'Move in with just a suitcase', blurb: 'Furnished flats and co-living near tech parks and metro lines.' },
  { value: 'family', label: 'Families', icon: Users, title: 'Room to settle in', blurb: 'Houses and apartments near schools, parks and hospitals.' },
  { value: 'individual', label: 'Individuals', icon: User, title: 'A space that is just yours', blurb: 'Studios and private rooms with the privacy you want.' },
]

export default function AudienceTabs() {
  const [active, setActive] = useState('student')
  const { properties } = useProperties()
  const a = AUDIENCES.find((x) => x.value === active)
  const items = properties.filter((p) => p.category === active && p.available).slice(0, 3)

  return (
    <section className="container section">
      <Reveal><span className="eyebrow">Find your fit</span><h2 className="h2">Homes for every stage of life</h2></Reveal>
      <div className="tabs" role="tablist">
        {AUDIENCES.map(({ value, label, icon: Icon }) => (
          <button key={value} role="tab" aria-selected={active === value} className={`tab ${active === value ? 'is-on' : ''}`} onClick={() => setActive(value)}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>
      <Reveal className="audience">
        <div className="audience__intro" key={active}>
          <h3 className="h3">{a.title}</h3>
          <p className="muted">{a.blurb}</p>
          <Link to={`/properties?category=${active}`} className="btn btn--ghost">See all for {a.label.toLowerCase()}</Link>
        </div>
        <div className="grid grid--3">
          {items.map((p, i) => <Reveal key={`${active}-${p.id}`} variant="pop" delay={i * 120}><PropertyCard property={p} /></Reveal>)}
        </div>
      </Reveal>
    </section>
  )
}

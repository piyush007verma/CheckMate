import Hero from '../features/home/Hero.jsx'
import AudienceTabs from '../features/home/AudienceTabs.jsx'
import { Marquee, Featured, UniversityShowcase, HowItWorks, SharedPromo, Benefits, OwnerCta } from '../features/home/Sections.jsx'

export default function Home() {
  return (
    <>
      <Hero />
      <Marquee />
      <AudienceTabs />
      <Featured />
      <UniversityShowcase />
      <HowItWorks />
      <SharedPromo />
      <Benefits />
      <OwnerCta />
    </>
  )
}

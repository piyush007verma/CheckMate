import { Link } from 'react-router-dom'
import { useCurrentUser } from '../hooks/useCurrentUser.js'
import { useProperties } from '../hooks/useProperties.js'
import { ProfileCard, SavedProperties, SentEnquiries, OwnerSummary } from '../features/dashboard/DashboardSections.jsx'

export default function Dashboard() {
  const user = useCurrentUser()
  const { properties } = useProperties()
  if (!user) return null // RequireAuth redirects; this is only a guard
  return (
    <section className="container section dash">
      <ProfileCard user={user} />
      <SavedProperties properties={properties} />
      <SentEnquiries user={user} />
      <OwnerSummary user={user} properties={properties} />
      <p className="muted small">Looking for a flatmate? <Link to="/shared-living" className="link-btn">Create your roommate profile</Link></p>
    </section>
  )
}

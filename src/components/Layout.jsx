import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from './Navbar.jsx'
import Footer from './Footer.jsx'
import CompareBar from './CompareBar.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'
import ScrollProgress from './ScrollProgress.jsx'
import FavoritesSync from '../lib/FavoritesSync.jsx'

export default function Layout() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <ScrollProgress />
      <Navbar />
      <main className="page" id="main" tabIndex={-1}><ErrorBoundary><Outlet /></ErrorBoundary></main>
      <FavoritesSync />
      <Footer />
      <CompareBar />
    </>
  )
}

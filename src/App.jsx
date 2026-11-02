import { Routes, Route } from 'react-router-dom'
import RequireAuth from './components/RequireAuth.jsx'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import Properties from './pages/Properties.jsx'
import PropertyDetail from './pages/PropertyDetail.jsx'
import SharedLiving from './pages/SharedLiving.jsx'
import OwnerPortal from './pages/OwnerPortal.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Compare from './pages/Compare.jsx'
import Nearby from './pages/Nearby.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import NotFound from './pages/NotFound.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/properties" element={<Properties />} />
        <Route path="/properties/:id" element={<PropertyDetail />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/nearby" element={<Nearby />} />
        <Route path="/shared-living" element={<SharedLiving />} />
        <Route path="/owner" element={<RequireAuth><OwnerPortal /></RequireAuth>} />
        <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

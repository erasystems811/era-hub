import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/auth'
import { Layout } from './components/Layout'
import { Login } from './pages/Login'
import { Home } from './pages/Home'

// ERA Patient
import { Hospitals }    from './pages/patient/Hospitals'
import { HospitalDetail } from './pages/patient/HospitalDetail'
import { Analytics }    from './pages/patient/Analytics'
import { Support }      from './pages/patient/Support'
import { AutomationLog } from './pages/patient/AutomationLog'
import { CRM }          from './pages/patient/CRM'

// ERA Comms
import { Sessions }    from './pages/comms/Sessions'
import { Businesses }  from './pages/comms/Businesses'
import { Onboarding }  from './pages/comms/Onboarding'
import { Plans }       from './pages/comms/Plans'
import { Billing }     from './pages/comms/Billing'
import { CommsSettings } from './pages/comms/CommsSettings'

function ProtectedApp() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />

        {/* ERA Patient */}
        <Route path="/patient" element={<Navigate to="/patient/hospitals" replace />} />
        <Route path="/patient/hospitals" element={<Hospitals />} />
        <Route path="/patient/hospitals/:id" element={<HospitalDetail />} />
        <Route path="/patient/analytics" element={<Analytics />} />
        <Route path="/patient/support" element={<Support />} />
        <Route path="/patient/automation" element={<AutomationLog />} />
        <Route path="/patient/crm" element={<CRM />} />

        {/* ERA Comms */}
        <Route path="/comms" element={<Navigate to="/comms/sessions" replace />} />
        <Route path="/comms/sessions" element={<Sessions />} />
        <Route path="/comms/businesses" element={<Businesses />} />
        <Route path="/comms/onboarding" element={<Onboarding />} />
        <Route path="/comms/plans" element={<Plans />} />
        <Route path="/comms/billing" element={<Billing />} />
        <Route path="/comms/settings" element={<CommsSettings />} />

        {/* Future */}
        <Route path="/connect" element={
          <div className="max-w-md mx-auto mt-16 text-center">
            <div className="text-4xl mb-4">⚡</div>
            <h1 className="page-title mb-2">ERA Connect</h1>
            <p className="caption">This product is coming soon. Check back later.</p>
          </div>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <ProtectedApp /> : <Login />
}

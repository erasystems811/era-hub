import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/auth'
import { Layout } from './components/Layout'
import { Login } from './pages/Login'
import { Home } from './pages/Home'

// ERA Patient
import { PatientHome }      from './pages/patient/PatientHome'
import { Hospitals }        from './pages/patient/Hospitals'
import { HospitalDetail }   from './pages/patient/HospitalDetail'
import { Analytics }        from './pages/patient/Analytics'
import { Support }          from './pages/patient/Support'
import { AutomationLog }    from './pages/patient/AutomationLog'
import { CRM }              from './pages/patient/CRM'
import { Usage }            from './pages/patient/Usage'
import { Announcements }    from './pages/patient/Announcements'
import { SystemFeedback }   from './pages/patient/SystemFeedback'
import { PatientAnalytics } from './pages/patient/PatientAnalytics'
import { KnowledgeBase }    from './pages/patient/KnowledgeBase'
import { DemoSessions }     from './pages/patient/DemoSessions'
import { Docs }             from './pages/patient/Docs'

// ERA Comms
import { CommsHome }      from './pages/comms/CommsHome'
import { CommsDashboard } from './pages/comms/CommsDashboard'
import { Sessions }       from './pages/comms/Sessions'
import { Businesses }     from './pages/comms/Businesses'
import { Requests }       from './pages/comms/Requests'
import { Onboarding }     from './pages/comms/Onboarding'
import { Plans }          from './pages/comms/Plans'
import { Billing }        from './pages/comms/Billing'
import { CommsSettings }  from './pages/comms/CommsSettings'
import { EventLog }       from './pages/comms/EventLog'
import { Alerts }         from './pages/comms/Alerts'
import { AuditTrail }     from './pages/comms/AuditTrail'
import { Investigation }  from './pages/comms/Investigation'

function ProtectedApp() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />

        {/* ERA Patient */}
        <Route path="/patient" element={<PatientHome />} />
        <Route path="/patient/hospitals" element={<Hospitals />} />
        <Route path="/patient/hospitals/:id" element={<HospitalDetail />} />
        <Route path="/patient/analytics" element={<Analytics />} />
        <Route path="/patient/support" element={<Support />} />
        <Route path="/patient/automation" element={<AutomationLog />} />
        <Route path="/patient/crm" element={<CRM />} />
        <Route path="/patient/usage" element={<Usage />} />
        <Route path="/patient/announcements" element={<Announcements />} />
        <Route path="/patient/feedback" element={<SystemFeedback />} />
        <Route path="/patient/patient-analytics" element={<PatientAnalytics />} />
        <Route path="/patient/knowledge-base" element={<KnowledgeBase />} />
        <Route path="/patient/demo-sessions" element={<DemoSessions />} />
        <Route path="/patient/docs" element={<Docs />} />

        {/* ERA Comms */}
        <Route path="/comms"              element={<CommsHome />} />
        <Route path="/comms/dashboard"    element={<CommsDashboard />} />
        <Route path="/comms/sessions"     element={<Sessions />} />
        <Route path="/comms/businesses"   element={<Businesses />} />
        <Route path="/comms/requests"     element={<Requests />} />
        <Route path="/comms/onboarding"   element={<Onboarding />} />
        <Route path="/comms/plans"        element={<Plans />} />
        <Route path="/comms/billing"      element={<Billing />} />
        <Route path="/comms/settings"     element={<CommsSettings />} />
        <Route path="/comms/event-log"    element={<EventLog />} />
        <Route path="/comms/alerts"       element={<Alerts />} />
        <Route path="/comms/audit"        element={<AuditTrail />} />
        <Route path="/comms/investigate"  element={<Investigation />} />

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

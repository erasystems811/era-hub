import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/auth'
import { Layout } from './components/Layout'
import { ErrorBoundary } from './components/ErrorBoundary'
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
import { DemoSessions }     from './pages/patient/DemoSessions'
import { Docs }             from './pages/patient/Docs'
import { AutomationTests }  from './pages/patient/AutomationTests'

// Public (no auth required)
import { AIAgentSignup }   from './pages/public/AIAgentSignup'
import { DeveloperSignup } from './pages/public/DeveloperSignup'

// Business Owner Panel
import { BizLogin }           from './pages/business-panel/BizLogin'
import { BizLayout }          from './pages/business-panel/BizLayout'
import { BizDashboard }       from './pages/business-panel/BizDashboard'
import { KnowledgeBaseModule } from './pages/business-panel/KnowledgeBaseModule'
import { AutoGreetModule }    from './pages/business-panel/AutoGreetModule'
import { BusinessHoursModule } from './pages/business-panel/BusinessHoursModule'
import { ScenariosModule }    from './pages/business-panel/ScenariosModule'
import { HandoffModule }      from './pages/business-panel/HandoffModule'
import { VoiceNotesModule }   from './pages/business-panel/VoiceNotesModule'
import { InboxModule }        from './pages/business-panel/InboxModule'
import { AnalyticsModule }    from './pages/business-panel/AnalyticsModule'
import { BizSettingsPage }    from './pages/business-panel/BizSettingsPage'

// ERA Connect
import { ConnectHome }           from './pages/connect/ConnectHome'
import { ConnectInstances }      from './pages/connect/ConnectInstances'
import { ConnectEvents }         from './pages/connect/ConnectEvents'
import { ConnectInstanceDetail } from './pages/connect/ConnectInstanceDetail'

// ERA Comms
import { CommsDashboard } from './pages/comms/CommsDashboard'
import { Sessions }       from './pages/comms/Sessions'
import { Businesses }     from './pages/comms/Businesses'
import { Requests }       from './pages/comms/Requests'
import { Plans }          from './pages/comms/Plans'
import { Billing }        from './pages/comms/Billing'
import { CommsSettings }  from './pages/comms/CommsSettings'
import { EventLog }       from './pages/comms/EventLog'
import { Alerts }         from './pages/comms/Alerts'
import { AuditTrail }     from './pages/comms/AuditTrail'
import { Investigation }   from './pages/comms/Investigation'
import { ConnectSession }  from './pages/comms/ConnectSession'
import { BillingDetail }  from './pages/comms/BillingDetail'
import { AIEngine }       from './pages/comms/AIEngine'
import { AIClientConfig } from './pages/comms/AIClientConfig'
import { AILogs }         from './pages/comms/AILogs'
import { AITemplates }    from './pages/comms/AITemplates'
import { EmailOverview }  from './pages/comms/EmailOverview'
import { EmailTemplates } from './pages/comms/EmailTemplates'
import { EmailCampaigns } from './pages/comms/EmailCampaigns'
import { EmailContacts }  from './pages/comms/EmailContacts'
import { EmailDomains }   from './pages/comms/EmailDomains'
import { VoiceComingSoon } from './pages/comms/VoiceComingSoon'

function ProtectedApp() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />

        {/* ERA Patient */}
        <Route path="/patient" element={<PatientHome />} />
        <Route path="/patient/hospitals" element={<Hospitals />} />
        <Route path="/patient/hospitals/:id" element={<ErrorBoundary><HospitalDetail /></ErrorBoundary>} />
        <Route path="/patient/analytics" element={<Analytics />} />
        <Route path="/patient/support" element={<Support />} />
        <Route path="/patient/automation" element={<AutomationLog />} />
        <Route path="/patient/crm" element={<CRM />} />
        <Route path="/patient/usage" element={<Usage />} />
        <Route path="/patient/announcements" element={<Announcements />} />
        <Route path="/patient/feedback" element={<SystemFeedback />} />
        <Route path="/patient/patient-analytics" element={<PatientAnalytics />} />
        <Route path="/patient/demo-sessions" element={<DemoSessions />} />
        <Route path="/patient/docs" element={<Docs />} />
        <Route path="/patient/automation-tests" element={<AutomationTests />} />

        {/* ERA Comms */}
        <Route path="/comms"              element={<Navigate to="/comms/dashboard" replace />} />
        <Route path="/comms/dashboard"    element={<CommsDashboard />} />
        <Route path="/comms/sessions"     element={<Sessions />} />
        <Route path="/comms/businesses"   element={<Businesses />} />
        <Route path="/comms/requests"     element={<Requests />} />
        <Route path="/comms/plans"        element={<Plans />} />
        <Route path="/comms/billing"              element={<Billing />} />
        <Route path="/comms/billing/:clientId"   element={<BillingDetail />} />
        <Route path="/comms/settings"     element={<CommsSettings />} />
        <Route path="/comms/event-log"    element={<EventLog />} />
        <Route path="/comms/alerts"       element={<Alerts />} />
        <Route path="/comms/audit"        element={<AuditTrail />} />
        <Route path="/comms/investigate"          element={<Investigation />} />
        <Route path="/comms/connect-session"      element={<ConnectSession />} />
        <Route path="/comms/ai-engine"            element={<AIEngine />} />
        <Route path="/comms/ai-config/:clientId"  element={<AIClientConfig />} />
        <Route path="/comms/ai-logs"              element={<AILogs />} />
        <Route path="/comms/ai-templates"         element={<AITemplates />} />
        <Route path="/comms/email"               element={<EmailOverview />} />
        <Route path="/comms/email/templates"     element={<EmailTemplates />} />
        <Route path="/comms/email/campaigns"     element={<EmailCampaigns />} />
        <Route path="/comms/email/contacts"      element={<EmailContacts />} />
        <Route path="/comms/email/domains"       element={<EmailDomains />} />
        <Route path="/comms/voice"               element={<VoiceComingSoon />} />

        {/* ERA Connect */}
        <Route path="/connect"                    element={<ConnectHome />} />
        <Route path="/connect/instances"          element={<ConnectInstances />} />
        <Route path="/connect/instances/:id"      element={<ConnectInstanceDetail />} />
        <Route path="/connect/events"             element={<ConnectEvents />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

function BizApp() {
  return (
    <BizLayout>
      <Routes>
        <Route path="/biz/dashboard"      element={<BizDashboard />} />
        <Route path="/biz/knowledge-base" element={<KnowledgeBaseModule />} />
        <Route path="/biz/auto-greet"     element={<AutoGreetModule />} />
        <Route path="/biz/hours"          element={<BusinessHoursModule />} />
        <Route path="/biz/scenarios"      element={<ScenariosModule />} />
        <Route path="/biz/handoff"        element={<HandoffModule />} />
        <Route path="/biz/voice-notes"    element={<VoiceNotesModule />} />
        <Route path="/biz/inbox"          element={<InboxModule />} />
        <Route path="/biz/analytics"      element={<AnalyticsModule />} />
        <Route path="/biz/settings"       element={<BizSettingsPage />} />
        <Route path="*"                   element={<Navigate to="/biz/dashboard" replace />} />
      </Routes>
    </BizLayout>
  )
}

export default function App() {
  const { isAuthenticated } = useAuth()

  const path = window.location.pathname

  // Public routes — no auth required
  if (path === '/apply/ai-agent')  return <AIAgentSignup />
  if (path === '/apply/developer') return <DeveloperSignup />

  // Business owner panel — has its own auth
  if (path === '/biz/login') return <BizLogin />
  if (path.startsWith('/biz/'))   return <BizApp />

  return isAuthenticated ? <ProtectedApp /> : <Login />
}

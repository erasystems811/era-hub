import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './contexts/auth'
import { Layout } from './components/Layout'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ToastProvider } from './components/Toast'
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
import { RevealKey }       from './pages/RevealKey'

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
import { BizSettingsPage }        from './pages/business-panel/BizSettingsPage'
import { BizEmailPage }          from './pages/business-panel/BizEmailPage'
import { WhatsAppConnectModule } from './pages/business-panel/WhatsAppConnectModule'
import { AutoReplyModule }       from './pages/business-panel/AutoReplyModule'
import { AutomationsModule }     from './pages/business-panel/AutomationsModule'

// ERA Core
import { CoreChat }     from './pages/core/CoreChat'
import { CoreMemory }   from './pages/core/CoreMemory'
import { CoreImport }   from './pages/core/CoreImport'
import { CoreSettings } from './pages/core/CoreSettings'

// ERA Connect
import { ConnectHome }           from './pages/connect/ConnectHome'
import { ConnectInstances }      from './pages/connect/ConnectInstances'
import { ConnectEvents }         from './pages/connect/ConnectEvents'
import { ConnectInstanceDetail } from './pages/connect/ConnectInstanceDetail'
import { ConnectSandbox }        from './pages/connect/ConnectSandbox'

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
import { EmailOverview }    from './pages/comms/EmailOverview'
import { EmailTemplates }   from './pages/comms/EmailTemplates'
import { EmailCampaigns }   from './pages/comms/EmailCampaigns'
import { EmailContacts }    from './pages/comms/EmailContacts'
import { EmailDomains }     from './pages/comms/EmailDomains'
import { EmailAutomations } from './pages/comms/EmailAutomations'
import { VoiceComingSoon } from './pages/comms/VoiceComingSoon'
import { Broadcasts }     from './pages/comms/Broadcasts'
import { Automations }    from './pages/comms/Automations'
import { Moderation }     from './pages/comms/Moderation'
import { Revenue }        from './pages/comms/Revenue'
import { OptOuts }        from './pages/comms/OptOuts'
import { AIReplyConfig }  from './pages/comms/AIReplyConfig'

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
        <Route path="/comms/email/automations"  element={<EmailAutomations />} />
        <Route path="/comms/email/domains"       element={<EmailDomains />} />
        <Route path="/comms/broadcasts"           element={<Broadcasts />} />
        <Route path="/comms/automations"          element={<Automations />} />
        <Route path="/comms/moderation"           element={<Moderation />} />
        <Route path="/comms/revenue"              element={<Revenue />} />
        <Route path="/comms/optouts"              element={<OptOuts />} />
        <Route path="/comms/ai-engine"            element={<AIReplyConfig />} />
        <Route path="/comms/voice"               element={<VoiceComingSoon />} />

        {/* ERA Core */}
        <Route path="/core" element={<Navigate to="/core/chat" replace />} />
        <Route path="/core/chat"   element={<CoreChat />} />
        <Route path="/core/memory" element={<CoreMemory />} />
        <Route path="/core/import"    element={<CoreImport />} />
        <Route path="/core/settings"  element={<CoreSettings />} />

        {/* ERA Connect */}
        <Route path="/connect"                    element={<ConnectHome />} />
        <Route path="/connect/instances"          element={<ConnectInstances />} />
        <Route path="/connect/instances/:id"      element={<ConnectInstanceDetail />} />
        <Route path="/connect/events"             element={<ConnectEvents />} />
        <Route path="/connect/sandbox"            element={<ConnectSandbox />} />

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
        <Route path="/biz/settings"         element={<BizSettingsPage />} />
        <Route path="/biz/email"          element={<BizEmailPage />} />
        <Route path="/biz/connect"        element={<WhatsAppConnectModule />} />
        <Route path="/biz/auto-reply"     element={<AutoReplyModule />} />
        <Route path="/biz/automations"    element={<AutomationsModule />} />
        <Route path="*"                   element={<Navigate to="/biz/dashboard" replace />} />
      </Routes>
    </BizLayout>
  )
}

export default function App() {
  const { isAuthenticated } = useAuth()
  const { pathname: path } = useLocation()

  // Public routes — no auth required
  if (path.startsWith('/apply')) {
    if (path === '/apply/developer') return <DeveloperSignup />
    return <AIAgentSignup />
  }
  if (path.startsWith('/reveal-key/')) return <RevealKey />

  // Business owner panel — has its own auth
  if (path === '/biz/login') return <BizLogin />
  if (path.startsWith('/biz/'))   return <BizApp />

  // Operator hub — secret path only. Anyone who isn't already authenticated
  // and tries any other URL just gets sent to the biz login. No hint that
  // an operator hub exists.
  if (path.startsWith('/era-sys')) {
    return (
      <ToastProvider>
        {isAuthenticated ? <ProtectedApp /> : <Login />}
      </ToastProvider>
    )
  }

  // Everything else (including /) → biz login
  if (!isAuthenticated) return <Navigate to="/biz/login" replace />

  // Authenticated operator hitting a non-/era-sys path → send to hub home
  return (
    <ToastProvider>
      <ProtectedApp />
    </ToastProvider>
  )
}

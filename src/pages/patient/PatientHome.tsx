import { useNavigate } from 'react-router-dom'
import {
  BarChart2, Building2, TrendingUp, Bell, FlaskConical,
  Headphones, Star, Kanban, Activity, Database, MonitorPlay, BookOpen,
  ArrowRight,
} from 'lucide-react'

const FEATURES = [
  {
    icon: BarChart2,
    label: 'Analytics',
    sub: 'Platform overview & system health',
    href: '/patient/analytics',
    badge: null,
  },
  {
    icon: Building2,
    label: 'Hospitals',
    sub: 'Account registry & management',
    href: '/patient/hospitals',
    badge: null,
  },
  {
    icon: TrendingUp,
    label: 'Usage',
    sub: 'Hospital consumption & history',
    href: '/patient/usage',
    badge: 'Live',
  },
  {
    icon: Bell,
    label: 'Announcements',
    sub: 'Push notices to hospitals',
    href: '/patient/announcements',
    badge: null,
  },
  {
    icon: FlaskConical,
    label: 'Automation Log',
    sub: 'Email & SMS workflow runs',
    href: '/patient/automation',
    badge: 'Live',
  },
  {
    icon: Headphones,
    label: 'Support',
    sub: 'Hospital tickets & escalations',
    href: '/patient/support',
    badge: null,
  },
  {
    icon: Star,
    label: 'System Feedback',
    sub: 'Hospital staff ratings',
    href: '/patient/feedback',
    badge: null,
  },
  {
    icon: Kanban,
    label: 'Sales CRM',
    sub: 'Pipeline, leads & prospects',
    href: '/patient/crm',
    badge: null,
  },
  {
    icon: Activity,
    label: 'Patient Analytics',
    sub: 'ERA Patient app metrics',
    href: '/patient/patient-analytics',
    badge: null,
  },
  {
    icon: Database,
    label: 'Knowledge Base',
    sub: 'RAG document management',
    href: '/patient/knowledge-base',
    badge: null,
  },
  {
    icon: MonitorPlay,
    label: 'Demo Sessions',
    sub: 'Prospect demo tracking',
    href: '/patient/demo-sessions',
    badge: null,
  },
  {
    icon: BookOpen,
    label: 'Docs & Settings',
    sub: 'Platform docs & configuration',
    href: '/patient/docs',
    badge: null,
  },
]

export function PatientHome() {
  const navigate = useNavigate()

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #5AADA2, #38877C)' }}>
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#4AA89D]/60">Era Systems</p>
            <h1 className="text-2xl font-bold text-foreground leading-tight">ERA Patient</h1>
          </div>
        </div>
        <p className="text-sm text-muted-foreground max-w-lg">
          Hospital management, patient pipelines, clinical automation, and platform intelligence.
        </p>
      </div>

      {/* Feature card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {FEATURES.map(({ icon: Icon, label, sub, href, badge }) => (
          <button
            key={href}
            onClick={() => navigate(href)}
            className="group relative flex items-start gap-4 p-5 rounded-2xl border text-left transition-all duration-150 hover:-translate-y-0.5"
            style={{
              background: 'hsl(262 22% 9%)',
              borderColor: 'rgba(74,168,157,0.12)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(74,168,157,0.35)'
              ;(e.currentTarget as HTMLElement).style.background = 'hsl(262 22% 11%)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(74,168,157,0.12)'
              ;(e.currentTarget as HTMLElement).style.background = 'hsl(262 22% 9%)'
            }}
          >
            {/* Icon */}
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all"
              style={{ background: 'rgba(74,168,157,0.1)' }}>
              <Icon className="w-4.5 h-4.5 text-[#4AA89D]" style={{ width: 18, height: 18 }} />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-semibold text-foreground group-hover:text-white transition-colors">{label}</p>
                {badge && (
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full flex items-center gap-1"
                    style={{ background: 'rgba(74,168,157,0.12)', color: '#4AA89D' }}>
                    <span className="w-1 h-1 rounded-full bg-[#CC7896] inline-block" />
                    {badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{sub}</p>
            </div>

            {/* Arrow */}
            <ArrowRight className="w-4 h-4 shrink-0 text-muted-foreground/20 group-hover:text-[#4AA89D]/60 transition-all mt-0.5 group-hover:translate-x-0.5" />
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-10 pt-5 border-t" style={{ borderColor: 'rgba(74,168,157,0.1)' }}>
        <p className="text-xs text-muted-foreground/25 tracking-[0.3em] uppercase text-center">
          ERA Patient · Hospital Intelligence Platform
        </p>
      </div>
    </div>
  )
}

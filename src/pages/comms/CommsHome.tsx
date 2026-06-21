import { useNavigate } from 'react-router-dom'
import {
  Smartphone, Users, Layers, CreditCard, Settings, ArrowRight,
  MessageSquare, Radio, ClipboardList, ScrollText, ShieldAlert,
  BookOpen, Search,
} from 'lucide-react'

const FEATURES = [
  { icon: Radio,         label: 'Dashboard',   sub: 'Live platform view',           href: '/comms/dashboard',   badge: 'Live' },
  { icon: Smartphone,    label: 'Sessions',    sub: 'WhatsApp connection management', href: '/comms/sessions',   badge: 'Live' },
  { icon: Users,         label: 'Businesses',  sub: 'Client accounts & onboarding',  href: '/comms/businesses', badge: null },
  { icon: ClipboardList, label: 'Requests',    sub: 'Onboarding approval queue',     href: '/comms/requests',   badge: null },
  { icon: Layers,        label: 'Plans',       sub: 'Subscription tiers & pricing',  href: '/comms/plans',      badge: null },
  { icon: CreditCard,    label: 'Billing',     sub: 'Revenue tracking & consumption', href: '/comms/billing',   badge: null },
  { icon: ScrollText,    label: 'Event Log',   sub: 'Full searchable activity history', href: '/comms/event-log', badge: null },
  { icon: ShieldAlert,   label: 'Alerts',      sub: 'Platform issues & notifications', href: '/comms/alerts',   badge: null },
  { icon: BookOpen,      label: 'Audit Trail', sub: 'Who did what and when',         href: '/comms/audit',      badge: null },
  { icon: Search,        label: 'Investigate', sub: 'Search any business or number', href: '/comms/investigate', badge: null },
  { icon: Settings,      label: 'Settings',    sub: 'API keys & configuration',      href: '/comms/settings',   badge: null },
]

export function CommsHome() {
  const navigate = useNavigate()

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #BF7C93, #9E6278)' }}>
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#BF7C93]/60">Era Systems</p>
            <h1 className="text-2xl font-bold text-foreground leading-tight">ERA Comms</h1>
          </div>
        </div>
        <p className="text-sm text-muted-foreground max-w-lg">
          WhatsApp messaging infrastructure, session management, billing, and delivery operations.
        </p>
      </div>

      {/* Feature card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {FEATURES.map(({ icon: Icon, label, sub, href, badge }) => (
          <button
            key={href}
            onClick={() => navigate(href)}
            className="group relative flex items-start gap-4 p-5 rounded-2xl border text-left transition-all duration-150 hover:-translate-y-0.5"
            style={{
              background: 'hsl(330 20% 9%)',
              borderColor: 'rgba(191,124,147,0.12)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(191,124,147,0.35)'
              ;(e.currentTarget as HTMLElement).style.background = 'hsl(330 20% 11%)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(191,124,147,0.12)'
              ;(e.currentTarget as HTMLElement).style.background = 'hsl(330 20% 9%)'
            }}
          >
            {/* Icon */}
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(191,124,147,0.1)' }}>
              <Icon className="w-4.5 h-4.5" style={{ width: 18, height: 18, color: '#BF7C93' }} />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-semibold text-foreground group-hover:text-white transition-colors">{label}</p>
                {badge && (
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full flex items-center gap-1"
                    style={{ background: 'rgba(191,124,147,0.12)', color: '#BF7C93' }}>
                    <span className="w-1 h-1 rounded-full bg-[#CC7896] inline-block" />
                    {badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{sub}</p>
            </div>

            {/* Arrow */}
            <ArrowRight className="w-4 h-4 shrink-0 text-muted-foreground/20 group-hover:text-[#BF7C93]/60 transition-all mt-0.5 group-hover:translate-x-0.5" />
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-10 pt-5 border-t" style={{ borderColor: 'rgba(191,124,147,0.1)' }}>
        <p className="text-xs text-muted-foreground/25 tracking-[0.3em] uppercase text-center">
          ERA Comms · WhatsApp Messaging Infrastructure
        </p>
      </div>
    </div>
  )
}

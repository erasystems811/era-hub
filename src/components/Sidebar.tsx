import { NavLink, useLocation } from 'react-router-dom'
import {
  Home, Building2, MessageSquare, Users, BarChart2, Headphones,
  Zap, Briefcase, Smartphone, CreditCard, Settings,
  ChevronDown, ChevronRight, Layers, LayoutDashboard,
  GitPullRequest, Mail, Activity, Bot, Phone,
  Brain, Upload,
} from 'lucide-react'
import { cn } from '../lib/utils'
import { useState, useEffect } from 'react'

interface NavItem {
  path: string
  label: string
  icon: JSX.Element
  children?: NavItem[]
  accent?: 'pink' | 'teal'
  badge?: string
}

const NAV: NavItem[] = [
  { path: '/', label: 'Home', icon: <Home className="w-4 h-4" />, accent: 'pink' },

  {
    path: '/core',
    label: 'ERA Core',
    icon: <Brain className="w-4 h-4" />,
    accent: 'pink',
    children: [
      { path: '/core/chat',   label: 'Chat',   icon: <MessageSquare className="w-4 h-4" />, accent: 'pink' },
      { path: '/core/memory', label: 'Memory', icon: <Brain className="w-4 h-4" />,         accent: 'pink' },
      { path: '/core/import', label: 'Import',  icon: <Upload className="w-4 h-4" />,        accent: 'pink' },
    ],
  },

  {
    path: '/patient',
    label: 'ERA Patient',
    icon: <Building2 className="w-4 h-4" />,
    accent: 'teal',
    children: [
      { path: '/patient/hospitals',  label: 'Hospitals',      icon: <Building2 className="w-4 h-4" />, accent: 'teal' },
      { path: '/patient/analytics',  label: 'Analytics',      icon: <BarChart2 className="w-4 h-4" />, accent: 'teal' },
      { path: '/patient/support',    label: 'Support',        icon: <Headphones className="w-4 h-4" />, accent: 'teal' },
      { path: '/patient/automation', label: 'Automation Log', icon: <Zap className="w-4 h-4" />, accent: 'teal' },
      { path: '/patient/crm',        label: 'Sales CRM',      icon: <Briefcase className="w-4 h-4" />, accent: 'teal' },
    ],
  },

  {
    path: '/comms',
    label: 'ERA Comms',
    icon: <MessageSquare className="w-4 h-4" />,
    accent: 'pink',
    children: [
      { path: '/comms/dashboard',   label: 'Dashboard',      icon: <LayoutDashboard className="w-4 h-4" />, accent: 'pink' },
      { path: '/comms/businesses',  label: 'Businesses',     icon: <Users className="w-4 h-4" />,           accent: 'pink' },
      { path: '/comms/sessions',    label: 'Sessions',       icon: <Smartphone className="w-4 h-4" />,      accent: 'pink' },
      { path: '/comms/requests',    label: 'Requests',       icon: <GitPullRequest className="w-4 h-4" />,  accent: 'pink' },
      { path: '/comms/alerts',      label: 'Monitoring',     icon: <Activity className="w-4 h-4" />,        accent: 'pink' },
      { path: '/comms/ai-engine',   label: 'AI Engine',      icon: <Bot className="w-4 h-4" />,             accent: 'pink' },
      { path: '/comms/email',       label: 'Email',          icon: <Mail className="w-4 h-4" />,            accent: 'pink' },
      { path: '/comms/plans',       label: 'Plans',          icon: <Layers className="w-4 h-4" />,          accent: 'pink' },
      { path: '/comms/billing',     label: 'Billing',        icon: <CreditCard className="w-4 h-4" />,      accent: 'pink' },
      { path: '/comms/settings',    label: 'Settings',       icon: <Settings className="w-4 h-4" />,        accent: 'pink' },
      { path: '/comms/voice',       label: 'Voice',          icon: <Phone className="w-4 h-4" />,           accent: 'pink', badge: 'Soon' },
    ],
  },
]

const ACCENT = {
  pink: { bg: 'rgba(196,40,111,0.15)', text: '#C4286F', bar: '#C4286F' },
  teal: { bg: 'rgba(13,148,136,0.15)', text: '#0D9488', bar: '#0D9488' },
}

function NavGroup({ item }: { item: NavItem }) {
  const { pathname } = useLocation()
  const isActive = pathname.startsWith(item.path) && item.path !== '/'
  const [open, setOpen] = useState(isActive)
  const accent = ACCENT[item.accent ?? 'pink']

  useEffect(() => { if (isActive) setOpen(true) }, [isActive])

  if (!item.children) {
    return (
      <NavLink to={item.path} end={item.path === '/'} className="block rounded-xl overflow-hidden">
        {({ isActive: active }) => (
          <div
            className="flex items-center gap-3 px-3 py-2.5 text-sm transition-all duration-150 relative"
            style={active ? { background: accent.bg, color: accent.text } : { color: 'rgba(255,255,255,0.55)' }}
          >
            {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full" style={{ background: accent.bar }} />}
            <span style={active ? { color: accent.text } : {}}>{item.icon}</span>
            <span className={active ? 'font-semibold' : 'font-medium'}>{item.label}</span>
          </div>
        )}
      </NavLink>
    )
  }

  return (
    <div>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
        style={isActive ? { color: accent.text } : { color: 'rgba(255,255,255,0.55)' }}
      >
        {item.icon}
        <span className="flex-1 text-left">{item.label}</span>
        <span className="opacity-50">
          {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </span>
      </button>

      {open && (
        <div className="ml-4 pl-3 mt-0.5 space-y-0.5" style={{ borderLeft: '1px solid rgba(255,255,255,0.10)' }}>
          {item.children.map(child => {
            const childAccent = ACCENT[child.accent ?? 'pink']
            return (
              <NavLink key={child.path} to={child.path} className="block rounded-xl overflow-hidden">
                {({ isActive: active }) => (
                  <div
                    className="flex items-center gap-2.5 px-3 py-2 text-sm transition-all duration-150 relative"
                    style={active ? { background: childAccent.bg, color: childAccent.text } : { color: 'rgba(255,255,255,0.45)' }}
                  >
                    {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r-full" style={{ background: childAccent.bar }} />}
                    <span style={active ? { color: childAccent.text } : {}}>{child.icon}</span>
                    <span className={`flex-1 ${active ? 'font-semibold' : ''}`}>{child.label}</span>
                    {child.badge && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-white/10 text-muted-foreground/60 leading-none">
                        {child.badge}
                      </span>
                    )}
                  </div>
                )}
              </NavLink>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function Sidebar() {
  return (
    <aside
      className="fixed left-0 top-0 h-full w-60 flex flex-col z-20"
      style={{ background: '#0F172A', borderRight: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Logo */}
      <div className="px-5 pt-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(196,40,111,0.20)', border: '1px solid rgba(196,40,111,0.30)' }}
          >
            <img src="/erahub4.png" alt="ERA" className="w-5 h-5 object-contain" />
          </div>
          <div>
            <div className="text-sm font-bold text-white leading-tight tracking-tight">ERA Systems</div>
            <div className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>Operator Hub</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {NAV.map(item => <NavGroup key={item.path} item={item} />)}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3.5" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-teal" />
          <p className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.30)' }}>
            All systems operational
          </p>
        </div>
      </div>
    </aside>
  )
}

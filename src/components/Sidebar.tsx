import { NavLink, useLocation } from 'react-router-dom'
import {
  Home, Building2, MessageSquare, Users, BarChart2, Headphones,
  Zap, Briefcase, Smartphone, CreditCard, Settings, ChevronDown,
  ChevronRight, Layers,
} from 'lucide-react'
import { cn } from '../lib/utils'
import { useState, useEffect } from 'react'

interface NavItem {
  path: string
  label: string
  icon: JSX.Element
  children?: NavItem[]
}

const NAV: NavItem[] = [
  { path: '/', label: 'Home', icon: <Home className="w-4 h-4" /> },
  {
    path: '/patient',
    label: 'ERA Patient',
    icon: <Building2 className="w-4 h-4" />,
    children: [
      { path: '/patient/hospitals',  label: 'Hospitals',      icon: <Building2 className="w-4 h-4" /> },
      { path: '/patient/analytics',  label: 'Analytics',      icon: <BarChart2 className="w-4 h-4" /> },
      { path: '/patient/support',    label: 'Support',        icon: <Headphones className="w-4 h-4" /> },
      { path: '/patient/automation', label: 'Automation Log', icon: <Zap className="w-4 h-4" /> },
      { path: '/patient/crm',        label: 'Sales CRM',      icon: <Briefcase className="w-4 h-4" /> },
    ],
  },
  {
    path: '/comms',
    label: 'ERA Comms',
    icon: <MessageSquare className="w-4 h-4" />,
    children: [
      { path: '/comms/sessions',   label: 'Sessions',       icon: <Smartphone className="w-4 h-4" /> },
      { path: '/comms/businesses', label: 'Businesses',     icon: <Users className="w-4 h-4" /> },
      { path: '/comms/plans',      label: 'Plans',          icon: <Layers className="w-4 h-4" /> },
      { path: '/comms/billing',    label: 'Billing & Usage',icon: <CreditCard className="w-4 h-4" /> },
      { path: '/comms/settings',   label: 'Settings',       icon: <Settings className="w-4 h-4" /> },
    ],
  },
]

function NavGroup({ item }: { item: NavItem }) {
  const { pathname } = useLocation()
  const isActive = pathname.startsWith(item.path) && item.path !== '/'
  const [open, setOpen] = useState(isActive)

  useEffect(() => { if (isActive) setOpen(true) }, [isActive])

  if (!item.children) {
    return (
      <NavLink
        to={item.path}
        end={item.path === '/'}
        className={({ isActive }) => cn(
          'flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all duration-150',
          isActive
            ? 'bg-white/20 text-white font-semibold'
            : 'text-white/65 hover:bg-white/10 hover:text-white',
        )}
      >
        {item.icon}
        {item.label}
      </NavLink>
    )
  }

  return (
    <div>
      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all duration-150',
          isActive ? 'text-white font-medium' : 'text-white/65 hover:bg-white/10 hover:text-white',
        )}
      >
        {item.icon}
        <span className="flex-1 text-left">{item.label}</span>
        {open
          ? <ChevronDown className="w-3.5 h-3.5 opacity-50" />
          : <ChevronRight className="w-3.5 h-3.5 opacity-50" />}
      </button>

      {open && (
        <div className="ml-3 mt-0.5 pl-3 border-l border-white/20 space-y-0.5">
          {item.children.map(child => (
            <NavLink
              key={child.path}
              to={child.path}
              className={({ isActive }) => cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all duration-150',
                isActive
                  ? 'bg-white/22 text-white font-semibold'
                  : 'text-white/60 hover:bg-white/10 hover:text-white',
              )}
            >
              {child.icon}
              {child.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}

export function Sidebar() {
  return (
    <aside
      className="fixed left-0 top-0 h-full w-56 flex flex-col z-20"
      style={{
        background: 'linear-gradient(180deg, #B5226A 0%, #9A1A58 100%)',
        borderRight: '1px solid rgba(255,255,255,0.10)',
      }}
    >
      {/* Logo */}
      <div className="px-5 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
        <div className="flex items-center gap-2.5">
          <img src="/erahub4.png" alt="ERA" className="w-8 h-8 rounded-xl shrink-0" />
          <div>
            <div className="text-sm font-semibold text-white leading-tight">ERA Systems</div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>Operator Hub</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV.map(item => <NavGroup key={item.path} item={item} />)}

        {/* Coming soon */}
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm cursor-not-allowed select-none mt-2"
          style={{ color: 'rgba(255,255,255,0.30)' }}>
          <Zap className="w-4 h-4" />
          ERA Connect
          <span className="ml-auto text-[10px] bg-white/15 text-white/60 rounded-full px-1.5 py-0.5 font-medium">Soon</span>
        </div>
      </nav>

      {/* Footer */}
      <div className="px-4 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.10)' }}>
        <p className="text-[10px] text-center" style={{ color: 'rgba(255,255,255,0.35)' }}>ERA Systems · Operator</p>
      </div>
    </aside>
  )
}

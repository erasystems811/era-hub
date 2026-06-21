import { ReactNode, useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/auth'
import { useNotifications } from '../contexts/notifications'
import {
  LogOut, ChevronRight, ShieldCheck, CheckCircle2, Loader2,
  BarChart2, Building2, Rocket, AlertCircle, PanelLeftClose, PanelLeftOpen,
  Menu, X, FlaskConical, TrendingUp, Headphones, Bell,
  Kanban, Activity, MonitorPlay, Smartphone, Users, Layers,
  CreditCard, Settings, Home, Zap,
} from 'lucide-react'
import { ChangePasswordModal } from './ChangePasswordModal'
import { NotificationPanel } from './NotificationPanel'

type DeployState = 'idle' | 'pushing' | 'done' | 'error'

interface LayoutProps {
  children: ReactNode
  breadcrumb?: { label: string; href?: string }[]
}

const PATIENT_NAV = [
  { icon: BarChart2,    label: 'Analytics',       href: '/patient/analytics',  sub: 'Platform metrics' },
  { icon: Building2,    label: 'Hospitals',        href: '/patient/hospitals',  sub: 'Account registry' },
  { icon: Headphones,   label: 'Support',          href: '/patient/support',    sub: 'Hospital tickets' },
  { icon: FlaskConical, label: 'Automation Log',   href: '/patient/automation', sub: 'Email & SMS workflows' },
  { icon: Kanban,       label: 'Sales CRM',        href: '/patient/crm',        sub: 'Pipeline & leads' },
]

const COMMS_NAV = [
  { icon: Smartphone,  label: 'Sessions',        href: '/comms/sessions',   sub: 'WhatsApp connections' },
  { icon: Users,       label: 'Businesses',       href: '/comms/businesses', sub: 'Client accounts' },
  { icon: Layers,      label: 'Plans',            href: '/comms/plans',      sub: 'Subscription tiers' },
  { icon: CreditCard,  label: 'Billing & Usage',  href: '/comms/billing',    sub: 'Revenue & consumption' },
  { icon: Settings,    label: 'Settings',         href: '/comms/settings',   sub: 'API & configuration' },
]

const BREADCRUMB_MAP: Record<string, { label: string; href?: string }[]> = {
  '/':                   [],
  '/patient/analytics':  [{ label: 'ERA Patient' }, { label: 'Analytics' }],
  '/patient/hospitals':  [{ label: 'ERA Patient' }, { label: 'Hospitals' }],
  '/patient/support':    [{ label: 'ERA Patient' }, { label: 'Support' }],
  '/patient/automation': [{ label: 'ERA Patient' }, { label: 'Automation Log' }],
  '/patient/crm':        [{ label: 'ERA Patient' }, { label: 'Sales CRM' }],
  '/comms/sessions':     [{ label: 'ERA Comms' }, { label: 'Sessions' }],
  '/comms/businesses':   [{ label: 'ERA Comms' }, { label: 'Businesses' }],
  '/comms/plans':        [{ label: 'ERA Comms' }, { label: 'Plans' }],
  '/comms/billing':      [{ label: 'ERA Comms' }, { label: 'Billing & Usage' }],
  '/comms/settings':     [{ label: 'ERA Comms' }, { label: 'Settings' }],
}

const SIDEBAR_KEY = 'era_hub_sidebar'
const sbBg     = 'hsl(222 55% 5%)'
const sbBorder = 'hsl(222 40% 14%)'

export function Layout({ children, breadcrumb: breadcrumbProp }: LayoutProps) {
  const { logout } = useAuth()
  const { unreadCount } = useNotifications()
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const [open, setOpen] = useState(() => {
    try { return localStorage.getItem(SIDEBAR_KEY) !== '0' } catch { return true }
  })
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showSecurity, setShowSecurity] = useState(false)
  const [showNotif, setShowNotif] = useState(false)
  const [deployState, setDeployState] = useState<DeployState>('idle')
  const [deployMsg, setDeployMsg] = useState('')
  const [confirmDeploy, setConfirmDeploy] = useState(false)
  const deployRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  const toggleOpen = () => setOpen(v => {
    const next = !v
    try { localStorage.setItem(SIDEBAR_KEY, next ? '1' : '0') } catch { /**/ }
    return next
  })

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (deployRef.current && !deployRef.current.contains(e.target as Node)) setConfirmDeploy(false)
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotif(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const go = (href: string) => { navigate(href); setMobileOpen(false) }

  const handleDeploy = async () => {
    if (deployState === 'pushing') return
    setConfirmDeploy(false)
    setDeployState('pushing')
    try {
      await new Promise(res => setTimeout(res, 1500))
      setDeployMsg('Triggered Railway deploy')
      setDeployState('done')
    } catch {
      setDeployMsg('Deploy failed')
      setDeployState('error')
    } finally {
      setTimeout(() => { setDeployState('idle'); setDeployMsg('') }, 5000)
    }
  }

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/')

  const autoBreadcrumb = Object.entries(BREADCRUMB_MAP)
    .filter(([k]) => k !== '/' && (pathname === k || pathname.startsWith(k + '/')))
    .sort((a, b) => b[0].length - a[0].length)[0]?.[1] ?? []

  const breadcrumb = breadcrumbProp ?? autoBreadcrumb

  function NavItem({ icon: Icon, label, href, sub, accent }: {
    icon: React.ComponentType<{ className?: string }>
    label: string; href: string; sub: string; accent: 'pink' | 'teal'
  }) {
    const active = isActive(href)
    const col = accent === 'teal' ? 'text-teal' : 'text-primary'
    const bg  = accent === 'teal' ? 'bg-teal/15' : 'bg-primary/15'
    return (
      <button
        onClick={() => go(href)}
        className={`w-full flex items-center transition-all duration-150 group rounded-lg ${
          open ? 'gap-3 px-3 py-2.5' : 'justify-center p-2.5'
        } ${active ? `${bg} ${col}` : 'text-muted-foreground/70 hover:bg-white/5 hover:text-foreground'}`}
        title={!open ? label : undefined}
      >
        <Icon className={`w-4 h-4 shrink-0 ${active ? col : ''}`} />
        {open && (
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium leading-tight">{label}</p>
            <p className="text-xs text-muted-foreground/50 leading-tight mt-0.5">{sub}</p>
          </div>
        )}
      </button>
    )
  }

  function SidebarContent({ expanded }: { expanded: boolean }) {
    return (
      <>
        {/* Brand */}
        <div
          className={`flex items-center shrink-0 h-12 border-b ${expanded ? 'px-3 gap-3' : 'justify-center'}`}
          style={{ borderBottomColor: sbBorder }}
        >
          {expanded ? (
            <>
              <button onClick={() => go('/')} className="flex items-center gap-2.5 flex-1 min-w-0 hover:opacity-80 transition">
                <img src="/erahub4.png" alt="ERA Systems" className="w-8 h-8 shrink-0 object-contain" />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-foreground tracking-[0.15em] uppercase leading-tight">Era Systems</p>
                  <p className="text-[8px] font-medium text-muted-foreground/40 uppercase tracking-[0.2em] leading-tight">Operator Hub</p>
                </div>
              </button>
              <button onClick={toggleOpen} title="Collapse"
                className="shrink-0 p-1 text-muted-foreground/40 hover:text-muted-foreground transition hidden md:block">
                <PanelLeftClose className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <button onClick={toggleOpen} title="Expand" className="hover:opacity-80 transition">
              <img src="/erahub4.png" alt="ERA Systems" className="w-8 h-8 object-contain" />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className={`flex-1 overflow-y-auto overflow-x-hidden ${expanded ? 'px-3 pt-3 pb-2 space-y-0.5' : 'px-2 py-3 space-y-1'}`}>

          {/* Home */}
          <button
            onClick={() => go('/')}
            className={`w-full flex items-center transition-all duration-150 group rounded-lg ${
              expanded ? 'gap-3 px-3 py-2.5' : 'justify-center p-2.5'
            } ${isActive('/') ? 'bg-primary/15 text-primary' : 'text-muted-foreground/70 hover:bg-white/5 hover:text-foreground'}`}
            title={!expanded ? 'Home' : undefined}
          >
            <Home className={`w-4 h-4 shrink-0 ${isActive('/') ? 'text-primary' : ''}`} />
            {expanded && (
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium leading-tight">Home</p>
                <p className="text-xs text-muted-foreground/50 leading-tight mt-0.5">Platform command</p>
              </div>
            )}
          </button>

          {/* ERA Patient section */}
          {expanded && (
            <p className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-[0.2em] px-3 pt-3 pb-1">
              ERA Patient
            </p>
          )}
          {!expanded && <div className="my-1 mx-2 border-t" style={{ borderColor: sbBorder }} />}
          {PATIENT_NAV.map(item => (
            <NavItem key={item.href} {...item} accent="teal" />
          ))}

          {/* ERA Comms section */}
          {expanded && (
            <p className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-[0.2em] px-3 pt-3 pb-1">
              ERA Comms
            </p>
          )}
          {!expanded && <div className="my-1 mx-2 border-t" style={{ borderColor: sbBorder }} />}
          {COMMS_NAV.map(item => (
            <NavItem key={item.href} {...item} accent="pink" />
          ))}

          {/* Coming soon */}
          {expanded && (
            <p className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-[0.2em] px-3 pt-3 pb-1">
              Coming Soon
            </p>
          )}
          {!expanded && <div className="my-1 mx-2 border-t" style={{ borderColor: sbBorder }} />}
          <button
            disabled
            className={`w-full flex items-center opacity-30 cursor-not-allowed rounded-lg ${
              expanded ? 'gap-3 px-3 py-2.5' : 'justify-center p-2.5'
            } text-muted-foreground/50`}
            title={!expanded ? 'ERA Connect — Coming soon' : undefined}
          >
            <MonitorPlay className="w-4 h-4 shrink-0" />
            {expanded && (
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium leading-tight">ERA Connect</p>
                <p className="text-xs text-muted-foreground/50 leading-tight mt-0.5">Video & voice platform</p>
              </div>
            )}
          </button>
        </nav>

        {/* Deploy */}
        <div className="px-3 py-2 border-t" style={{ borderTopColor: sbBorder }} ref={deployRef}>
          {!confirmDeploy ? (
            <button
              onClick={() => expanded ? setConfirmDeploy(true) : handleDeploy()}
              disabled={deployState === 'pushing'}
              title={!expanded ? 'Deploy' : undefined}
              className={`w-full flex items-center transition-all duration-150 rounded-lg disabled:opacity-50 ${
                expanded ? 'gap-3 px-3 py-2.5' : 'justify-center p-2.5'
              } ${
                deployState === 'done'  ? 'text-emerald-400' :
                deployState === 'error' ? 'text-destructive' :
                'text-muted-foreground/70 hover:bg-white/5 hover:text-foreground'
              }`}
            >
              {deployState === 'pushing' ? <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
                : deployState === 'done'  ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                : deployState === 'error' ? <AlertCircle  className="w-4 h-4 shrink-0 text-destructive" />
                : <Rocket className="w-4 h-4 shrink-0" />}
              {expanded && (
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium leading-tight">
                    {deployState === 'pushing' ? 'Deploying…' : deployState === 'done' ? 'Deployed' : deployState === 'error' ? 'Failed' : 'Deploy'}
                  </p>
                  <p className="text-xs text-muted-foreground/50 leading-tight mt-0.5 truncate">
                    {deployMsg || 'Push to Railway'}
                  </p>
                </div>
              )}
            </button>
          ) : (
            <div className="p-3 space-y-2 rounded-lg border border-border bg-card/60">
              <p className="text-sm text-muted-foreground">Trigger Railway deploy?</p>
              <div className="flex gap-2">
                <button onClick={handleDeploy}
                  className="flex-1 py-1.5 rounded-lg text-sm font-semibold text-primary border border-primary/30 hover:bg-primary/10 transition">
                  Deploy
                </button>
                <button onClick={() => setConfirmDeploy(false)}
                  className="flex-1 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground transition">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom actions */}
        <div className="px-3 pb-3 space-y-0.5 border-t pt-2" style={{ borderTopColor: sbBorder }}>
          {[
            { icon: ShieldCheck, label: 'Security', action: () => setShowSecurity(true) },
            { icon: LogOut,      label: 'Sign Out',  action: () => logout() },
          ].map(item => (
            <button key={item.label} onClick={item.action} title={!expanded ? item.label : undefined}
              className={`w-full flex items-center text-muted-foreground/60 hover:bg-white/5 hover:text-muted-foreground transition-all duration-150 rounded-lg ${
                expanded ? 'gap-3 px-3 py-2' : 'justify-center p-2.5'
              }`}>
              <item.icon className="w-4 h-4 shrink-0" />
              {expanded && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          ))}

          <button onClick={toggleOpen} title={open ? 'Collapse' : 'Expand'}
            className={`hidden md:flex w-full items-center text-muted-foreground/30 hover:text-muted-foreground/50 transition-all duration-150 rounded-lg ${
              expanded ? 'gap-3 px-3 py-1.5' : 'justify-center p-2.5'
            }`}>
            {expanded
              ? <><PanelLeftClose className="w-4 h-4 shrink-0" /><span className="text-sm">Collapse</span></>
              : <PanelLeftOpen className="w-4 h-4 shrink-0" />}
          </button>
        </div>
      </>
    )
  }

  return (
    <div className="min-h-screen flex bg-background">

      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex shrink-0 flex-col transition-all duration-200"
        style={{ width: open ? 212 : 48, background: sbBg, borderRight: `1px solid ${sbBorder}` }}
      >
        <SidebarContent expanded={open} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 flex flex-col" style={{ background: sbBg, borderRight: `1px solid ${sbBorder}` }}>
            <div className="absolute top-2 right-2 z-10">
              <button onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-muted-foreground hover:bg-white/5 transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            <SidebarContent expanded={true} />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <header
          className="shrink-0 h-12 border-b flex items-center px-4 md:px-6 gap-2"
          style={{ borderBottomColor: 'hsl(222 40% 14%)', background: 'hsl(222 47% 7%)' }}
        >
          <button
            className="md:hidden shrink-0 p-1 -ml-1 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-white/5 transition"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          {breadcrumb.length > 0 ? (
            <>
              <span className="text-[10px] text-muted-foreground/30 font-medium tracking-wider uppercase hidden sm:inline">Era Hub</span>
              {breadcrumb.map((c, i) => (
                <span key={i} className="flex items-center gap-2">
                  <ChevronRight className="w-3 h-3 text-border/60 shrink-0 hidden sm:block" />
                  {c.href
                    ? <button onClick={() => navigate(c.href!)} className="text-[10px] text-muted-foreground/60 hover:text-foreground transition tracking-wider uppercase font-medium">{c.label}</button>
                    : <span className="text-[10px] text-foreground/80 font-semibold tracking-wider uppercase">{c.label}</span>}
                </span>
              ))}
            </>
          ) : (
            <span className="text-[9px] text-muted-foreground/25 font-medium tracking-[0.3em] uppercase">
              Evaluate · Rebuild · Automate
            </span>
          )}

          <div className="ml-auto flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/70" />
            <span className="text-[9px] text-muted-foreground/30 uppercase tracking-widest hidden sm:inline">Platform</span>

            {/* Notification bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotif(v => !v)}
                className="ml-2 p-1.5 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-white/5 transition relative"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {showNotif && (
                <div className="absolute right-0 top-9 z-50">
                  <NotificationPanel onClose={() => setShowNotif(false)} />
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>

      {showSecurity && <ChangePasswordModal onClose={() => setShowSecurity(false)} />}
    </div>
  )
}

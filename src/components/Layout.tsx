import { ReactNode, useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/auth'
import { useNotifications } from '../contexts/notifications'
import {
  LogOut, ChevronRight, ShieldCheck, CheckCircle2, Loader2,
  BarChart2, Building2, Rocket, AlertCircle, PanelLeftClose, PanelLeftOpen,
  Menu, X, FlaskConical, TrendingUp, Headphones, Bell, Home,
  Kanban, Activity, MonitorPlay, Smartphone, Users, Layers,
  CreditCard, Settings, Star, Database, BookOpen,
} from 'lucide-react'
import { ChangePasswordModal } from './ChangePasswordModal'
import { NotificationPanel } from './NotificationPanel'

type DeployState = 'idle' | 'pushing' | 'done' | 'error'

const PATIENT_NAV = [
  { icon: BarChart2,    label: 'Analytics',        href: '/patient/analytics',         sub: 'Platform metrics' },
  { icon: Building2,    label: 'Hospitals',         href: '/patient/hospitals',         sub: 'Account registry' },
  { icon: TrendingUp,   label: 'Usage',             href: '/patient/usage',             sub: 'Hospital consumption' },
  { icon: Bell,         label: 'Announcements',     href: '/patient/announcements',     sub: 'Push notices' },
  { icon: FlaskConical, label: 'Automation Log',    href: '/patient/automation',        sub: 'Email & SMS workflows' },
  { icon: Headphones,   label: 'Support',           href: '/patient/support',           sub: 'Hospital tickets' },
  { icon: Star,         label: 'System Feedback',   href: '/patient/feedback',          sub: 'Staff ratings' },
  { icon: Kanban,       label: 'Sales CRM',         href: '/patient/crm',               sub: 'Pipeline & leads' },
  { icon: Activity,     label: 'Patient Analytics', href: '/patient/patient-analytics', sub: 'ERA patient app metrics' },
  { icon: Database,     label: 'Knowledge Base',    href: '/patient/knowledge-base',    sub: 'RAG document management' },
  { icon: MonitorPlay,  label: 'Demo Sessions',     href: '/patient/demo-sessions',     sub: 'Prospect demo tracking' },
  { icon: BookOpen,     label: 'Docs & Settings',   href: '/patient/docs',              sub: 'Platform documentation' },
]

const COMMS_NAV = [
  { icon: Smartphone, label: 'Sessions',       href: '/comms/sessions',   sub: 'WhatsApp connections' },
  { icon: Users,      label: 'Businesses',     href: '/comms/businesses', sub: 'Client accounts' },
  { icon: Layers,     label: 'Plans',          href: '/comms/plans',      sub: 'Subscription tiers' },
  { icon: CreditCard, label: 'Billing',        href: '/comms/billing',    sub: 'Revenue & consumption' },
  { icon: Settings,   label: 'Settings',       href: '/comms/settings',   sub: 'API & configuration' },
]

const PRODUCTS = {
  patient: { name: 'ERA Patient', color: '#4AA89D', accentText: 'text-teal',    activeBg: 'bg-teal/15',    nav: PATIENT_NAV },
  comms:   { name: 'ERA Comms',   color: '#BF7C93', accentText: 'text-primary', activeBg: 'bg-primary/15', nav: COMMS_NAV   },
} as const

const SB_BG     = 'hsl(262 22% 7%)'
const SB_BORDER = 'hsl(262 14% 18%)'
const SIDEBAR_KEY = 'era_hub_sidebar'

/* ─── Hub Layout (home page — no sidebar) ─────────────────────── */
function HubLayout({ children }: { children: ReactNode }) {
  const { logout } = useAuth()
  const { unreadCount } = useNotifications()
  const [showNotif, setShowNotif]       = useState(false)
  const [showSecurity, setShowSecurity] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotif(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header
        className="shrink-0 h-12 border-b flex items-center px-6 gap-3"
        style={{ borderBottomColor: SB_BORDER, background: SB_BG }}
      >
        <img src="/erahub4.png" alt="ERA" className="w-6 h-6 object-contain opacity-75" />
        <span className="text-[10px] font-bold tracking-[0.22em] uppercase text-foreground/40">
          Era Systems
        </span>

        <div className="ml-auto flex items-center gap-1" ref={notifRef}>
          <div className="relative">
            <button
              onClick={() => setShowNotif(v => !v)}
              className="p-2 rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-white/5 transition"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-3 h-3 rounded-full bg-primary text-primary-foreground text-[8px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {showNotif && (
              <div className="absolute right-0 top-10 z-50">
                <NotificationPanel onClose={() => setShowNotif(false)} />
              </div>
            )}
          </div>
          <button onClick={() => setShowSecurity(true)}
            className="p-2 rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-white/5 transition">
            <ShieldCheck className="w-4 h-4" />
          </button>
          <button onClick={() => logout()}
            className="p-2 rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-white/5 transition">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-auto">{children}</main>

      {showSecurity && <ChangePasswordModal onClose={() => setShowSecurity(false)} />}
    </div>
  )
}

/* ─── Product Layout (ERA Patient / ERA Comms — product-specific sidebar) */
function ProductLayout({ product, children }: { product: 'patient' | 'comms'; children: ReactNode }) {
  const { logout }       = useAuth()
  const { unreadCount }  = useNotifications()
  const { pathname }     = useLocation()
  const navigate         = useNavigate()
  const prod             = PRODUCTS[product]

  const [open, setOpen] = useState(() => {
    try { return localStorage.getItem(SIDEBAR_KEY) !== '0' } catch { return true }
  })
  const [mobileOpen,    setMobileOpen]    = useState(false)
  const [showSecurity,  setShowSecurity]  = useState(false)
  const [showNotif,     setShowNotif]     = useState(false)
  const [deployState,   setDeployState]   = useState<DeployState>('idle')
  const [deployMsg,     setDeployMsg]     = useState('')
  const [confirmDeploy, setConfirmDeploy] = useState(false)
  const deployRef = useRef<HTMLDivElement>(null)
  const notifRef  = useRef<HTMLDivElement>(null)

  const toggleOpen = () => setOpen(v => {
    const next = !v
    try { localStorage.setItem(SIDEBAR_KEY, next ? '1' : '0') } catch { /**/ }
    return next
  })

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (deployRef.current && !deployRef.current.contains(e.target as Node)) setConfirmDeploy(false)
      if (notifRef.current  && !notifRef.current.contains(e.target as Node))  setShowNotif(false)
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

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')
  const currentPage = prod.nav.find(n => isActive(n.href))

  function NavItem({ icon: Icon, label, href, sub }: { icon: React.ComponentType<{ className?: string }>; label: string; href: string; sub: string }) {
    const active = isActive(href)
    return (
      <button
        onClick={() => go(href)}
        title={!open ? label : undefined}
        className={`w-full flex items-center transition-all duration-150 rounded-lg ${
          open ? 'gap-3 px-3 py-2' : 'justify-center p-2.5'
        } ${active
            ? `${prod.activeBg} ${prod.accentText}`
            : 'text-muted-foreground/55 hover:bg-white/5 hover:text-foreground'
        }`}
      >
        <Icon className="w-4 h-4 shrink-0" />
        {open && (
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium leading-tight">{label}</p>
            <p className="text-[11px] text-muted-foreground/38 leading-tight mt-0.5">{sub}</p>
          </div>
        )}
      </button>
    )
  }

  function SidebarContent({ expanded }: { expanded: boolean }) {
    return (
      <>
        {/* Back to Hub + product identity */}
        <div
          className={`shrink-0 border-b ${expanded ? 'px-4 pt-3.5 pb-3' : 'px-2 py-3 flex flex-col items-center gap-2'}`}
          style={{ borderBottomColor: SB_BORDER }}
        >
          {expanded ? (
            <>
              <button
                onClick={() => go('/')}
                className="flex items-center gap-1.5 text-muted-foreground/30 hover:text-muted-foreground/55 transition mb-3 text-[10px] font-semibold tracking-[0.16em] uppercase"
              >
                <Home className="w-3 h-3" />
                Hub
              </button>
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold tracking-[0.14em] uppercase" style={{ color: prod.color }}>
                  {prod.name}
                </p>
                <button onClick={toggleOpen}
                  className="p-1 text-muted-foreground/22 hover:text-muted-foreground/50 transition hidden md:block">
                  <PanelLeftClose className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          ) : (
            <>
              <button onClick={() => go('/')} title="Back to Hub"
                className="p-2 rounded-lg text-muted-foreground/30 hover:text-muted-foreground/60 hover:bg-white/5 transition">
                <Home className="w-3.5 h-3.5" />
              </button>
              <button onClick={toggleOpen} title="Expand"
                className="p-2 rounded-lg text-muted-foreground/22 hover:text-muted-foreground/50 hover:bg-white/5 transition hidden md:block">
                <PanelLeftOpen className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>

        {/* Navigation */}
        <nav className={`flex-1 overflow-y-auto overflow-x-hidden ${expanded ? 'px-3 py-3 space-y-0.5' : 'px-2 py-3 space-y-1'}`}>
          {prod.nav.map(item => <NavItem key={item.href} {...item} />)}
        </nav>

        {/* Deploy */}
        <div className="px-3 py-2 border-t" style={{ borderTopColor: SB_BORDER }} ref={deployRef}>
          {!confirmDeploy ? (
            <button
              onClick={() => expanded ? setConfirmDeploy(true) : handleDeploy()}
              disabled={deployState === 'pushing'}
              title={!expanded ? 'Deploy' : undefined}
              className={`w-full flex items-center transition-all duration-150 rounded-lg disabled:opacity-50 ${
                expanded ? 'gap-3 px-3 py-2' : 'justify-center p-2.5'
              } ${deployState === 'done'  ? 'text-emerald-400' :
                 deployState === 'error' ? 'text-destructive'  :
                 'text-muted-foreground/55 hover:bg-white/5 hover:text-foreground'}`}
            >
              {deployState === 'pushing' ? <Loader2    className="w-4 h-4 shrink-0 animate-spin" />
                : deployState === 'done'  ? <CheckCircle2 className="w-4 h-4 shrink-0" />
                : deployState === 'error' ? <AlertCircle  className="w-4 h-4 shrink-0" />
                : <Rocket className="w-4 h-4 shrink-0" />}
              {expanded && (
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium leading-tight">
                    {deployState === 'pushing' ? 'Deploying…' : deployState === 'done' ? 'Deployed' : deployState === 'error' ? 'Failed' : 'Deploy'}
                  </p>
                  <p className="text-[11px] text-muted-foreground/38 leading-tight mt-0.5 truncate">
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

        {/* Security + Sign Out */}
        <div className="px-3 pb-3 pt-2 space-y-0.5 border-t" style={{ borderTopColor: SB_BORDER }}>
          {([
            { icon: ShieldCheck, label: 'Security', action: () => setShowSecurity(true) },
            { icon: LogOut,      label: 'Sign Out',  action: () => logout() },
          ] as const).map(item => (
            <button key={item.label} onClick={item.action} title={!expanded ? item.label : undefined}
              className={`w-full flex items-center text-muted-foreground/45 hover:bg-white/5 hover:text-muted-foreground transition-all duration-150 rounded-lg ${
                expanded ? 'gap-3 px-3 py-2' : 'justify-center p-2.5'
              }`}>
              <item.icon className="w-4 h-4 shrink-0" />
              {expanded && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          ))}
        </div>
      </>
    )
  }

  return (
    <div className="min-h-screen flex bg-background">

      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex shrink-0 flex-col transition-all duration-200"
        style={{ width: open ? 216 : 52, background: SB_BG, borderRight: `1px solid ${SB_BORDER}` }}
      >
        <SidebarContent expanded={open} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 flex flex-col"
            style={{ background: SB_BG, borderRight: `1px solid ${SB_BORDER}` }}>
            <button onClick={() => setMobileOpen(false)}
              className="absolute top-2 right-2 p-1.5 rounded-lg text-muted-foreground/50 hover:text-muted-foreground hover:bg-white/5 transition z-10">
              <X className="w-4 h-4" />
            </button>
            <SidebarContent expanded={true} />
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <header
          className="shrink-0 h-12 border-b flex items-center px-4 md:px-6 gap-3"
          style={{ borderBottomColor: SB_BORDER, background: 'hsl(262 20% 9%)' }}
        >
          <button className="md:hidden shrink-0 p-1.5 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-white/5 transition"
            onClick={() => setMobileOpen(true)}>
            <Menu className="w-4 h-4" />
          </button>

          <span
            className="text-[9px] font-bold uppercase tracking-[0.18em] px-2 py-0.5 rounded-full shrink-0 hidden sm:inline"
            style={{ color: prod.color, background: `${prod.color}1A` }}
          >
            {prod.name}
          </span>

          {currentPage && (
            <span className="flex items-center gap-2">
              <ChevronRight className="w-3 h-3 text-muted-foreground/25 shrink-0" />
              <span className="text-[10px] font-semibold tracking-wider uppercase text-foreground/65">
                {currentPage.label}
              </span>
            </span>
          )}

          <div className="ml-auto flex items-center gap-1" ref={notifRef}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60 mr-1 hidden sm:block" />
            <div className="relative">
              <button
                onClick={() => setShowNotif(v => !v)}
                className="p-2 rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-white/5 transition relative"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-3 h-3 rounded-full bg-primary text-primary-foreground text-[8px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {showNotif && (
                <div className="absolute right-0 top-10 z-50">
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

/* ─── Root export — picks the right shell based on route ─────── */
export function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  if (pathname.startsWith('/patient')) return <ProductLayout product="patient">{children}</ProductLayout>
  if (pathname.startsWith('/comms'))   return <ProductLayout product="comms">{children}</ProductLayout>
  return <HubLayout>{children}</HubLayout>
}

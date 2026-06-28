import { useEffect, useState } from 'react'
import { useNavigate, useLocation, NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Book, MessageSquare, Clock, Zap, Users,
  Mic, Inbox, BarChart2, Settings, LogOut, ChevronLeft, ChevronRight, Mail,
  Smartphone, Bot,
} from 'lucide-react'
import { bizApi, clearBizToken, type BizProfile, type ModuleConfig } from './business-api'

interface NavItem {
  icon: typeof LayoutDashboard
  label: string
  href: string
  moduleKey?: keyof ModuleConfig
}

const NAV_ALWAYS: NavItem[] = [
  { icon: LayoutDashboard, label: 'Overview',        href: '/biz/dashboard'  },
  { icon: Smartphone,      label: 'Connect WhatsApp', href: '/biz/connect'    },
  { icon: Bot,             label: 'Auto-Reply',       href: '/biz/auto-reply' },
  { icon: Settings,        label: 'Settings',         href: '/biz/settings'   },
]

const NAV_MODULES: NavItem[] = [
  { icon: Book,         label: 'Knowledge Base', href: '/biz/knowledge-base', moduleKey: 'knowledgeBase'     },
  { icon: MessageSquare,label: 'Auto Greet',     href: '/biz/auto-greet',     moduleKey: 'autoGreet'         },
  { icon: Clock,        label: 'Business Hours', href: '/biz/hours',          moduleKey: 'businessHours'     },
  { icon: Zap,          label: 'Scenarios',      href: '/biz/scenarios',      moduleKey: 'scenarios'         },
  { icon: Users,        label: 'Handoff Rules',  href: '/biz/handoff',        moduleKey: 'humanHandoff'      },
  { icon: Mic,          label: 'Voice Notes',    href: '/biz/voice-notes',    moduleKey: 'voiceNotes'        },
  { icon: Inbox,        label: 'Inbox',          href: '/biz/inbox',          moduleKey: 'conversationInbox' },
  { icon: BarChart2,    label: 'Analytics',      href: '/biz/analytics',      moduleKey: 'analytics'         },
  { icon: Mail,         label: 'Email',          href: '/biz/email',          moduleKey: 'emailCampaigns'    },
  { icon: Zap,          label: 'Automations',    href: '/biz/automations',    moduleKey: 'automations'       },
]

interface Props { children: React.ReactNode }

export function BizLayout({ children }: Props) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const [profile, setProfile]   = useState<BizProfile | null>(null)
  const [loading, setLoading]   = useState(true)
  const [collapsed, setCollapsed] = useState(false)

  const checkStatus = (isInitial = false) => {
    const token = localStorage.getItem('era_biz_token')
    if (!token) { navigate('/biz/login', { replace: true }); return }
    bizApi.getProfile()
      .then(p => { setProfile(p) })
      .catch(() => { clearBizToken(); navigate('/biz/login', { replace: true }) })
      .finally(() => { if (isInitial) setLoading(false) })
  }

  // Re-check status on every page navigation
  useEffect(() => { checkStatus() }, [location.pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    checkStatus(true)

    // Re-check every 60 s — kicks suspended accounts out within a minute
    const interval = setInterval(() => checkStatus(), 60_000)

    // Re-check immediately when the user switches back to this tab
    const onFocus = () => checkStatus()
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) checkStatus()
    })

    // Any 403 from any page clears the token and fires this event → navigate immediately
    const onLogout = () => navigate('/biz/login', { replace: true })
    window.addEventListener('biz:logout', onLogout)

    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('biz:logout', onLogout)
    }
  }, [navigate]) // eslint-disable-line react-hooks/exhaustive-deps

  function logout() {
    clearBizToken()
    navigate('/biz/login', { replace: true })
  }

  const mc = profile?.moduleConfig
  const visibleModuleNav = mc
    ? NAV_MODULES.filter(n => !n.moduleKey || mc[n.moduleKey])
    : []

  const usage   = profile?.usage
  const used    = usage?.monthlyMessages ?? 0
  const limit   = usage?.monthlyLimit ?? null
  const pct     = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0
  const barColor = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#22c55e'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'hsl(262 22% 6%)' }}>
        <div className="w-6 h-6 rounded-full border-2 border-[#BF7C93]/30 border-t-[#BF7C93] animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen" style={{ background: 'hsl(262 22% 6%)' }}>
      {/* Sidebar */}
      <aside
        className="flex flex-col shrink-0 border-r transition-all duration-200"
        style={{
          width: collapsed ? 60 : 200,
          background: 'hsl(262 20% 8%)',
          borderColor: 'rgba(191,124,147,0.08)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-14 px-3 border-b" style={{ borderColor: 'rgba(191,124,147,0.08)' }}>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">{profile?.name ?? 'Business'}</p>
              <span className="inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full mt-0.5"
                style={{ background: 'rgba(191,124,147,0.12)', color: '#BF7C93' }}>
                {profile?.planName ?? 'Plan'}
              </span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(c => !c)}
            className="ml-auto text-muted-foreground/40 hover:text-foreground transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 space-y-0.5 overflow-y-auto">
          {[...NAV_ALWAYS, ...visibleModuleNav].map(({ icon: Icon, label, href }) => {
            const active = location.pathname === href
            return (
              <NavLink
                key={href}
                to={href}
                className={`flex items-center gap-3 px-3 py-2 mx-1.5 rounded-lg text-xs font-medium transition-all ${
                  active
                    ? 'text-[#BF7C93] bg-[#BF7C93]/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`}
                title={collapsed ? label : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span className="truncate">{label}</span>}
              </NavLink>
            )
          })}
        </nav>

        {/* Sign out */}
        <div className="p-3 border-t" style={{ borderColor: 'rgba(191,124,147,0.08)' }}>
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground/60 hover:text-red-400 hover:bg-red-500/8 transition-all"
            title={collapsed ? 'Sign out' : undefined}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && 'Sign out'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header
          className="h-14 flex items-center justify-between px-6 border-b shrink-0"
          style={{ background: 'hsl(262 20% 8%)', borderColor: 'rgba(191,124,147,0.08)' }}
        >
          <p className="text-sm font-semibold text-foreground">{profile?.name}</p>

          <div className="flex items-center gap-4">
            {/* Usage bar */}
            {limit !== null && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground hidden sm:block">
                  {used.toLocaleString()} / {limit.toLocaleString()} msgs
                </span>
                <div className="w-24 h-1.5 rounded-full bg-white/8 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: barColor }}
                  />
                </div>
                <span className="text-xs font-semibold" style={{ color: barColor }}>{pct}%</span>
              </div>
            )}
            <button
              onClick={logout}
              className="text-xs text-muted-foreground/50 hover:text-red-400 transition-colors"
            >
              Sign out
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

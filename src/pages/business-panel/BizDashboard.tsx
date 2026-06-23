import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Book, MessageSquare, Clock, Zap, Users, Mic, Inbox, BarChart2, Mail,
} from 'lucide-react'
import { bizApi, type BizProfile, type ModuleConfig } from './business-api'

type ModuleKey = keyof ModuleConfig

interface ModuleDef {
  key: ModuleKey
  icon: typeof Book
  label: string
  desc: string
  href: string
}

const MODULES: ModuleDef[] = [
  { key: 'knowledgeBase',     icon: Book,         label: 'Knowledge Base', desc: 'What your AI knows about your business',    href: '/biz/knowledge-base' },
  { key: 'autoGreet',         icon: MessageSquare,label: 'Auto Greet',     desc: 'First message when customer starts chat',   href: '/biz/auto-greet'    },
  { key: 'businessHours',     icon: Clock,        label: 'Business Hours', desc: 'When your AI is active',                    href: '/biz/hours'         },
  { key: 'scenarios',         icon: Zap,          label: 'Scenarios',      desc: 'Automated response flows',                  href: '/biz/scenarios'     },
  { key: 'humanHandoff',      icon: Users,        label: 'Human Handoff',  desc: 'When AI escalates to a person',             href: '/biz/handoff'       },
  { key: 'voiceNotes',        icon: Mic,          label: 'Voice Notes',    desc: 'Handle voice messages from customers',       href: '/biz/voice-notes'   },
  { key: 'conversationInbox', icon: Inbox,        label: 'Inbox',           desc: 'Monitor and join live chats',               href: '/biz/inbox'         },
  { key: 'analytics',         icon: BarChart2,    label: 'Analytics',       desc: 'See your performance stats',                href: '/biz/analytics'     },
  { key: 'emailCampaigns',    icon: Mail,         label: 'Email Campaigns', desc: 'Send bulk emails to your customers',         href: '/biz/email'         },
]

// Tailwind-safe toggle component
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={e => { e.stopPropagation(); onChange(!on) }}
      className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-[#BF7C93]/40 focus:ring-offset-2 focus:ring-offset-transparent"
      style={{ background: on ? '#BF7C93' : 'rgba(255,255,255,0.12)' }}
    >
      <span
        className="pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform"
        style={{ transform: on ? 'translateX(16px)' : 'translateX(0)' }}
      />
    </button>
  )
}

export function BizDashboard() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<BizProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<ModuleKey | null>(null)

  useEffect(() => {
    bizApi.getProfile()
      .then(p => setProfile(p))
      .finally(() => setLoading(false))
  }, [])

  async function handleToggle(key: ModuleKey, val: boolean) {
    if (!profile || toggling) return
    setToggling(key)
    const prev = profile
    const next = { ...profile, moduleConfig: { ...profile.moduleConfig, [key]: val } }
    setProfile(next)
    try {
      const updated = await bizApi.updateModuleConfig({ [key]: val })
      setProfile(updated)
    } catch {
      setProfile(prev)
    } finally {
      setToggling(null)
    }
  }

  const mc     = profile?.moduleConfig
  const usage  = profile?.usage
  const used   = usage?.monthlyMessages ?? 0
  const limit  = usage?.monthlyLimit ?? null
  const pct    = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0
  const barColor = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#22c55e'

  const activeModules = mc ? MODULES.filter(m => mc[m.key]) : []

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 rounded-full border-2 border-[#BF7C93]/30 border-t-[#BF7C93] animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-7">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back{profile?.name ? `, ${profile.name}` : ''}
          </h1>
          {profile?.planName && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full"
              style={{ background: 'rgba(191,124,147,0.12)', color: '#BF7C93' }}>
              {profile.planName}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">Manage your AI modules and configuration below.</p>
      </div>

      {/* Usage bar */}
      {limit !== null && (
        <div
          className="mb-8 p-4 rounded-xl border"
          style={{ background: 'hsl(262 20% 10%)', borderColor: 'rgba(255,255,255,0.07)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-foreground">Monthly Messages</p>
            <p className="text-sm" style={{ color: barColor }}>
              {used.toLocaleString()} / {limit.toLocaleString()}
              <span className="text-muted-foreground ml-1">({pct}%)</span>
            </p>
          </div>
          <div className="h-2 rounded-full bg-white/8 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: barColor }}
            />
          </div>
        </div>
      )}

      {/* Module grid */}
      <div className="mb-8">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">
          Your Modules
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {MODULES.map(({ key, icon: Icon, label, desc, href }) => {
            const on = mc?.[key] ?? false
            return (
              <div
                key={key}
                onClick={() => on && navigate(href)}
                className={`relative p-4 rounded-xl border transition-all duration-150 ${
                  on ? 'cursor-pointer hover:-translate-y-0.5' : 'opacity-50 cursor-default'
                }`}
                style={{
                  background: 'hsl(262 20% 10%)',
                  borderColor: on ? 'rgba(191,124,147,0.30)' : 'rgba(255,255,255,0.06)',
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: on ? 'rgba(191,124,147,0.12)' : 'rgba(255,255,255,0.06)' }}
                  >
                    <Icon className="w-4 h-4" style={{ color: on ? '#BF7C93' : undefined }} />
                  </div>
                  <Toggle
                    on={on}
                    onChange={val => handleToggle(key, val)}
                  />
                </div>
                <p className="text-sm font-semibold text-foreground mb-0.5">{label}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Quick links to active modules */}
      {activeModules.length > 0 && (
        <div>
          <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">
            Active modules
          </h2>
          <div className="flex flex-wrap gap-2">
            {activeModules.map(m => (
              <button
                key={m.key}
                onClick={() => navigate(m.href)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:bg-[#BF7C93]/15"
                style={{
                  background: 'rgba(191,124,147,0.08)',
                  color: '#BF7C93',
                  border: '1px solid rgba(191,124,147,0.20)',
                }}
              >
                <m.icon className="w-3 h-3" />
                {m.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

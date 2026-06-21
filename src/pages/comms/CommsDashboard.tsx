import { useEffect, useState, useCallback } from 'react'
import {
  Wifi, WifiOff, AlertTriangle, MessageSquare, MessageCircle,
  Bot, Users, XCircle, RefreshCw, CheckCircle2, Loader2,
  Activity, Zap, Radio,
} from 'lucide-react'
import { eventsApi, LiveSnapshot, PlatformAlert, PlatformEvent } from '../../lib/events-api'

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function fmt(n: number | undefined) {
  return (n ?? 0).toLocaleString()
}

function HealthDot({ ok, pulse }: { ok: boolean; pulse?: boolean }) {
  return (
    <span className={`w-2 h-2 rounded-full shrink-0 ${ok ? 'bg-teal' : 'bg-red-400'} ${pulse ? 'animate-pulse' : ''}`} />
  )
}

function StatCard({
  label, value, color, icon: Icon, dot, loading, sub,
}: {
  label: string
  value: string | number
  color: string
  icon: React.ComponentType<{ className?: string }>
  dot: 'green' | 'amber' | 'red'
  loading: boolean
  sub?: string
}) {
  const dotColor = dot === 'green' ? 'bg-teal' : dot === 'amber' ? 'bg-amber-400' : 'bg-red-400'
  return (
    <div className="rounded-xl border border-white/07 bg-card p-5 flex flex-col justify-between min-h-[110px]">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-white/05">
            <Icon className={`w-3.5 h-3.5 ${color}`} />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">{label}</p>
        </div>
        <span className={`w-2 h-2 rounded-full shrink-0 mt-0.5 animate-pulse ${dotColor}`} />
      </div>
      {loading
        ? <div className="h-9 w-16 bg-white/05 animate-pulse rounded-lg" />
        : (
          <div>
            <p className={`text-3xl font-bold tabular-nums leading-none ${color}`}>{fmt(value as number)}</p>
            {sub && <p className="text-[11px] text-muted-foreground mt-1.5">{sub}</p>}
          </div>
        )}
    </div>
  )
}

function formatEventType(t: string) {
  return t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function eventIcon(type: string) {
  if (type.includes('session'))  return <Wifi className="w-3.5 h-3.5 text-teal/70" />
  if (type.includes('message'))  return <MessageSquare className="w-3.5 h-3.5 text-blue-400/70" />
  if (type.includes('ai') || type.includes('scenario') || type.includes('kb')) return <Bot className="w-3.5 h-3.5 text-primary/70" />
  if (type.includes('handoff'))  return <Users className="w-3.5 h-3.5 text-amber-400/70" />
  if (type.includes('voice') || type.includes('transcri')) return <Radio className="w-3.5 h-3.5 text-purple-400/70" />
  if (type.includes('error') || type.includes('failed'))   return <XCircle className="w-3.5 h-3.5 text-red-400/70" />
  if (type.includes('key'))      return <Zap className="w-3.5 h-3.5 text-amber-400/70" />
  if (type.includes('business') || type.includes('plan')) return <Activity className="w-3.5 h-3.5 text-muted-foreground/50" />
  return <MessageCircle className="w-3.5 h-3.5 text-muted-foreground/40" />
}

export function CommsDashboard() {
  const [snap,    setSnap]    = useState<LiveSnapshot | null>(null)
  const [alerts,  setAlerts]  = useState<PlatformAlert[]>([])
  const [events,  setEvents]  = useState<PlatformEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [resolving, setResolving] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    setError(null)
    try {
      const [s, a, e] = await Promise.allSettled([
        eventsApi.liveSnapshot(),
        eventsApi.listAlerts(false),
        eventsApi.listEvents({ limit: 15 }),
      ])
      if (s.status === 'fulfilled') setSnap(s.value)
      if (a.status === 'fulfilled') setAlerts((a.value ?? []).filter(al => al.severity === 'critical' || al.severity === 'warning'))
      if (e.status === 'fulfilled') setEvents(e.value ?? [])
      setLastUpdated(new Date())
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      if (!msg.toLowerCase().includes('not found') && !msg.includes('404')) {
        setError(msg || 'Failed to load dashboard')
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void fetchAll()
    const id = setInterval(() => void fetchAll(true), 10_000)
    return () => clearInterval(id)
  }, [fetchAll])

  const resolveAlert = async (id: string) => {
    setResolving(id)
    try {
      await eventsApi.resolveAlert(id)
      setAlerts(prev => prev.filter(a => a.id !== id))
    } finally { setResolving(null) }
  }

  const sessions = snap?.sessions
  const messages = snap?.messages
  const ai       = snap?.ai

  const STATS = [
    { label: 'Connected',        value: sessions?.connected    ?? 0, color: 'text-teal',      icon: Wifi,           dot: 'green' as const, sub: `of ${sessions?.total ?? 0} total` },
    { label: 'Disconnected',     value: sessions?.disconnected ?? 0, color: 'text-red-400',   icon: WifiOff,        dot: sessions?.disconnected ? 'red' as const : 'green' as const },
    { label: 'Session warnings', value: sessions?.warning      ?? 0, color: 'text-amber-400', icon: AlertTriangle,  dot: sessions?.warning ? 'amber' as const : 'green' as const },
    { label: 'Messages / hour',  value: messages?.lastHour     ?? 0, color: 'text-foreground', icon: MessageSquare, dot: 'green' as const, sub: `${messages?.processing ?? 0} processing` },
    { label: 'Messages today',   value: messages?.today        ?? 0, color: 'text-foreground', icon: MessageCircle, dot: 'green' as const },
    { label: 'AI active',        value: ai?.activeConversations ?? 0, color: 'text-primary',  icon: Bot,            dot: 'green' as const, sub: `${ai?.handoffsInProgress ?? 0} handoffs · ${ai?.errorsLastHour ?? 0} errors` },
  ]

  if (error) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
      <XCircle className="w-8 h-8 text-red-400/60" />
      <p className="text-sm font-medium text-foreground">Failed to load dashboard</p>
      <p className="text-xs text-muted-foreground">{error}</p>
      <button className="btn-primary text-sm mt-1" onClick={() => void fetchAll()}>Retry</button>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Live Dashboard</h1>
          <p className="caption mt-0.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse inline-block" />
            Real-time platform status · auto-refreshes every 10s
          </p>
        </div>
        <button
          onClick={() => void fetchAll(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/07 bg-card text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/05 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {STATS.map(s => (
          <StatCard key={s.label} {...s} loading={loading} />
        ))}
      </div>

      {/* Two column section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Active issues */}
        <div className="rounded-xl border border-white/07 bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-white/06 flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Active issues</p>
            {!loading && alerts.length > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/12 text-red-400">
                {alerts.length} open
              </span>
            )}
          </div>
          <div className="divide-y divide-white/05">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="px-5 py-3.5 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-white/05 animate-pulse" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-white/05 animate-pulse rounded w-3/4" />
                    <div className="h-2.5 bg-white/05 animate-pulse rounded w-1/2" />
                  </div>
                </div>
              ))
            ) : alerts.length === 0 ? (
              <div className="px-5 py-10 flex flex-col items-center gap-2 text-center">
                <CheckCircle2 className="w-6 h-6 text-teal/50" />
                <p className="text-sm font-medium text-foreground">All systems healthy</p>
                <p className="text-xs text-muted-foreground">No active issues</p>
              </div>
            ) : alerts.map(a => (
              <div key={a.id} className="px-5 py-3.5 flex items-start gap-3">
                <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${a.severity === 'critical' ? 'bg-red-400 animate-pulse' : 'bg-amber-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground font-medium truncate">{a.message}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {a.businessName ?? 'System'} · {timeAgo(a.createdAt)}
                  </p>
                </div>
                <button
                  onClick={() => void resolveAlert(a.id)}
                  disabled={resolving === a.id}
                  className="shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-lg border border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/05 transition disabled:opacity-50"
                >
                  {resolving === a.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Resolve'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="rounded-xl border border-white/07 bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-white/06">
            <p className="text-sm font-semibold text-foreground">Recent activity</p>
          </div>
          <div className="divide-y divide-white/05 max-h-[360px] overflow-y-auto">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="px-5 py-3 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white/05 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-white/05 animate-pulse rounded w-2/3" />
                    <div className="h-2.5 bg-white/05 animate-pulse rounded w-1/3" />
                  </div>
                  <div className="h-2.5 w-10 bg-white/05 animate-pulse rounded" />
                </div>
              ))
            ) : events.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm text-muted-foreground">No recent activity</p>
              </div>
            ) : events.map(ev => (
              <div key={ev.id} className="px-5 py-3 flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-white/05 flex items-center justify-center shrink-0">
                  {eventIcon(ev.eventType)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground font-medium truncate">{formatEventType(ev.eventType)}</p>
                  <p className="text-xs text-muted-foreground truncate">{ev.businessName ?? 'System'}</p>
                </div>
                <p className="text-[11px] text-muted-foreground/60 shrink-0 tabular-nums">{timeAgo(ev.createdAt)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      {lastUpdated && (
        <p className="text-[11px] text-muted-foreground/40 text-center tabular-nums">
          Last updated {lastUpdated.toLocaleTimeString()}
        </p>
      )}
    </div>
  )
}

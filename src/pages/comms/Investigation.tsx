import { useState } from 'react'
import {
  Search, Loader2, AlertCircle, Activity, FileText, Bell,
  Clock, CheckCircle2, XCircle, Info,
} from 'lucide-react'
import { eventsApi, PlatformEvent, AuditEntry, PlatformAlert, EventSeverity } from '../../lib/events-api'

type InvestigationTab = 'events' | 'audit' | 'alerts'

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function fmtDt(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

function fmtEventType(t: string) {
  return t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function SeverityDot({ s }: { s: EventSeverity }) {
  return (
    <span className={`w-2 h-2 rounded-full shrink-0 inline-block ${
      s === 'critical' ? 'bg-red-400' : s === 'warning' ? 'bg-amber-400' : 'bg-white/30'
    }`} />
  )
}

function SeverityBadge({ s }: { s: EventSeverity }) {
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
      s === 'critical' ? 'bg-red-500/15 text-red-400' :
      s === 'warning'  ? 'bg-amber-500/15 text-amber-400' :
      'bg-white/07 text-muted-foreground'
    }`}>{s}</span>
  )
}

function ActorAvatar({ actor }: { actor: AuditEntry['actor'] }) {
  const cfg = {
    operator: { label: 'OP', bg: 'bg-primary/20 text-primary' },
    business: { label: 'BS', bg: 'bg-teal/20 text-teal' },
    system:   { label: 'SY', bg: 'bg-white/10 text-muted-foreground' },
    ai:       { label: 'AI', bg: 'bg-purple-500/20 text-purple-400' },
  }[actor]
  return (
    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-bold shrink-0 ${cfg.bg}`}>
      {cfg.label}
    </div>
  )
}

export function Investigation() {
  const [query, setQuery]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState<string | null>(null)
  const [result, setResult] = useState<{
    events: PlatformEvent[]
    audit:  AuditEntry[]
    alerts: PlatformAlert[]
  } | null>(null)
  const [tab, setTab] = useState<InvestigationTab>('events')

  const run = async (q = query) => {
    if (!q.trim()) return
    setLoading(true); setError(null); setResult(null)
    try {
      const data = await eventsApi.investigate(q.trim())
      setResult(data)
      setTab('events')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Investigation failed')
    } finally {
      setLoading(false)
    }
  }

  const activeAlerts = result?.alerts.filter(a => !a.resolved) ?? []
  const mostRecent   = result?.events[0]?.createdAt ?? result?.audit[0]?.createdAt ?? null
  const businessName = result?.events.find(e => e.businessName)?.businessName
    ?? result?.alerts.find(a => a.businessName)?.businessName
    ?? null

  const TABS = [
    { id: 'events' as const, label: 'Events',  icon: Activity, count: result?.events.length ?? 0 },
    { id: 'audit'  as const, label: 'Audit',   icon: FileText, count: result?.audit.length  ?? 0 },
    { id: 'alerts' as const, label: 'Alerts',  icon: Bell,     count: result?.alerts.length ?? 0 },
  ]

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="page-title">Investigation</h1>
        <p className="caption mt-0.5">Search any business, phone number, or email to see its full history</p>
      </div>

      {/* Search bar */}
      <div className="flex gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40" />
          <input
            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-card border border-white/07 text-foreground text-base placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
            placeholder="Search business name, phone number, or email…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') void run() }}
          />
        </div>
        <button
          onClick={() => void run()}
          disabled={loading || !query.trim()}
          className="px-6 py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {loading ? 'Searching…' : 'Investigate'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3 flex items-center gap-3 mb-6">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Empty state — no search yet */}
      {!result && !loading && !error && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/04 flex items-center justify-center">
            <Search className="w-8 h-8 text-muted-foreground/20" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-foreground mb-1">Investigate any business or number</p>
            <p className="text-sm text-muted-foreground">Enter a business name, phone number, or email to see its full history</p>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="rounded-xl border border-white/07 bg-card p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/07" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-white/07 rounded w-1/3" />
                  <div className="h-3 bg-white/05 rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <>
          {/* Summary banner */}
          <div className="rounded-xl border border-white/07 bg-card p-4 mb-5 flex flex-wrap items-center gap-x-6 gap-y-2">
            {businessName && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-0.5">Business</p>
                <p className="text-sm font-semibold text-foreground">{businessName}</p>
              </div>
            )}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-0.5">Total events</p>
              <p className="text-sm font-semibold text-foreground tabular-nums">{result.events.length}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-0.5">Active alerts</p>
              <p className={`text-sm font-semibold tabular-nums ${activeAlerts.length > 0 ? 'text-red-400' : 'text-teal'}`}>
                {activeAlerts.length}
              </p>
            </div>
            {mostRecent && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-0.5">Last activity</p>
                <p className="text-sm font-semibold text-foreground">{timeAgo(mostRecent)}</p>
              </div>
            )}
            {activeAlerts.length > 0 && (
              <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                <span className="text-xs font-semibold text-red-400">{activeAlerts.length} active issue{activeAlerts.length !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-4">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  tab === t.id ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-white/06'
                }`}>
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  tab === t.id ? 'bg-primary/20 text-primary' : 'bg-white/08 text-muted-foreground'
                }`}>{t.count}</span>
              </button>
            ))}
          </div>

          {/* Events tab */}
          {tab === 'events' && (
            <div className="rounded-2xl border border-white/07 bg-card overflow-hidden">
              {result.events.length === 0 ? (
                <div className="py-12 text-center">
                  <Activity className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No events found</p>
                </div>
              ) : (
                <div className="divide-y divide-white/05">
                  {result.events.map(e => (
                    <div key={e.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
                      <SeverityDot s={e.severity} />
                      <div className="w-36 shrink-0">
                        <p className="text-[10px] font-mono text-muted-foreground/50">{fmtDt(e.createdAt)}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{fmtEventType(e.eventType)}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{e.detail}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <SeverityBadge s={e.severity} />
                        <p className="text-[10px] text-muted-foreground/40 mt-1">{timeAgo(e.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Audit tab */}
          {tab === 'audit' && (
            <div className="space-y-2">
              {result.audit.length === 0 ? (
                <div className="rounded-2xl border border-white/07 bg-card py-12 text-center">
                  <FileText className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No audit entries found</p>
                </div>
              ) : (
                result.audit.map((a, i) => (
                  <div key={a.id} className="relative flex gap-4">
                    {i < result.audit.length - 1 && (
                      <div className="absolute left-4 top-10 bottom-0 w-px bg-white/07" />
                    )}
                    <ActorAvatar actor={a.actor} />
                    <div className="flex-1 min-w-0 rounded-xl border border-white/07 bg-card p-4 mb-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wide mb-0.5">{a.actorLabel}</p>
                          <p className="text-sm font-semibold text-foreground">{a.action}</p>
                          {a.target && <p className="text-xs text-muted-foreground mt-0.5">→ {a.target}</p>}
                          {a.detail && <p className="text-xs text-muted-foreground/50 mt-1">{a.detail}</p>}
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-xs text-muted-foreground/50" title={fmtDt(a.createdAt)}>{timeAgo(a.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Alerts tab */}
          {tab === 'alerts' && (
            <div className="space-y-3">
              {result.alerts.length === 0 ? (
                <div className="rounded-2xl border border-white/07 bg-card py-12 text-center">
                  <Bell className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No alerts found</p>
                </div>
              ) : (
                result.alerts.map(a => (
                  <div key={a.id}
                    className={`rounded-xl border bg-card p-4 border-l-2 ${
                      a.severity === 'critical' ? 'border-red-500/20 border-l-red-500' :
                      a.severity === 'warning'  ? 'border-amber-500/20 border-l-amber-500' :
                      'border-white/07 border-l-white/20'
                    }`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <SeverityBadge s={a.severity} />
                          {a.resolved
                            ? <span className="flex items-center gap-1 text-[10px] text-teal"><CheckCircle2 className="w-3 h-3" /> Resolved</span>
                            : <span className="flex items-center gap-1 text-[10px] text-red-400"><XCircle className="w-3 h-3" /> Active</span>
                          }
                        </div>
                        <p className="text-sm font-semibold text-foreground">{a.message}</p>
                        {a.businessName && <p className="text-xs text-muted-foreground mt-0.5">{a.businessName}</p>}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs text-muted-foreground/50" title={fmtDt(a.createdAt)}>{timeAgo(a.createdAt)}</p>
                        {a.resolvedAt && (
                          <p className="text-[10px] text-teal/60 mt-1">resolved {timeAgo(a.resolvedAt)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

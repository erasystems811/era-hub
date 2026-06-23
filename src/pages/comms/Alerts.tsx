import { useEffect, useState, useCallback } from 'react'
import { CheckCircle2, AlertTriangle, AlertCircle, Loader2, RefreshCw, ShieldCheck } from 'lucide-react'
import { eventsApi, PlatformAlert } from '../../lib/events-api'
import { MonitoringTabs } from '../../components/MonitoringTabs'

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

type Tab = 'active' | 'resolved'

function SeverityBadge({ severity }: { severity: string }) {
  if (severity === 'critical') return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-500/15 text-red-400">
      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse inline-block" /> Critical
    </span>
  )
  if (severity === 'warning') return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" /> Warning
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/08 text-muted-foreground">
      Info
    </span>
  )
}

function AlertCard({ alert, onResolve, resolving }: {
  alert: PlatformAlert
  onResolve?: () => void
  resolving?: boolean
}) {
  const isCritical = alert.severity === 'critical'
  const isWarning  = alert.severity === 'warning'
  const borderCol  = isCritical ? 'border-l-red-500/60' : isWarning ? 'border-l-amber-500/60' : 'border-l-white/20'

  return (
    <div className={`relative rounded-xl border border-white/07 bg-card overflow-hidden ${alert.resolved ? 'opacity-60' : ''}`}>
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${isCritical ? 'bg-red-500/70' : isWarning ? 'bg-amber-500/70' : 'bg-white/20'} ${borderCol}`} />
      <div className="pl-5 pr-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <SeverityBadge severity={alert.severity} />
              {alert.businessName && (
                <span className="text-xs text-muted-foreground font-medium">{alert.businessName}</span>
              )}
              {alert.sessionId && (
                <span className="text-[10px] font-mono text-muted-foreground/40">
                  session:{alert.sessionId.slice(0, 8)}…
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-foreground leading-snug">{alert.message}</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {alert.resolved
                ? `Resolved ${alert.resolvedAt ? timeAgo(alert.resolvedAt) : ''}`
                : `Raised ${timeAgo(alert.createdAt)}`}
            </p>
          </div>

          {onResolve && !alert.resolved && (
            <button
              onClick={onResolve}
              disabled={resolving}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/07 disabled:opacity-40 transition"
            >
              {resolving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
              Resolve
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export function Alerts() {
  const [tab, setTab]           = useState<Tab>('active')
  const [active, setActive]     = useState<PlatformAlert[]>([])
  const [resolved, setResolved] = useState<PlatformAlert[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [resolving, setResolving] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const fetchAlerts = useCallback(async () => {
    setError(null)
    try {
      const [a, r] = await Promise.allSettled([
        eventsApi.listAlerts(false),
        eventsApi.listAlerts(true),
      ])
      if (a.status === 'fulfilled') setActive(a.value)
      if (r.status === 'fulfilled') setResolved(r.value.slice(0, 50))
      setLastRefresh(new Date())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load alerts')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    void fetchAlerts()
    const interval = setInterval(() => { if (tab === 'active') void fetchAlerts() }, 30_000)
    return () => clearInterval(interval)
  }, [fetchAlerts, tab])

  const resolve = async (id: string) => {
    setResolving(id)
    try {
      await eventsApi.resolveAlert(id)
      await fetchAlerts()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to resolve alert')
    } finally { setResolving(null) }
  }

  const critical = active.filter(a => a.severity === 'critical')
  const warnings = active.filter(a => a.severity === 'warning')
  const info     = active.filter(a => a.severity === 'info')

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="page-title">Monitoring</h1>
          <p className="caption mt-0.5">
            {loading ? 'Loading…' : `${active.length} active alert${active.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={() => void fetchAlerts()}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/07 text-xs text-muted-foreground hover:text-foreground hover:bg-white/05 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      <MonitoringTabs />

      {/* Tabs */}
      <div className="flex gap-1 mb-5 p-1 rounded-xl bg-white/[0.04] border border-white/06 w-fit">
        {(['active', 'resolved'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
              tab === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}>
            {t}
            {t === 'active' && active.length > 0 && (
              <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                critical.length > 0 ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
              }`}>{active.length}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-white/[0.03] animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center">
          <p className="text-sm font-medium text-foreground mb-1">Failed to load alerts</p>
          <p className="text-xs text-muted-foreground mb-3">{error}</p>
          <button onClick={() => void fetchAlerts()} className="btn-secondary text-sm">Try again</button>
        </div>
      ) : tab === 'active' ? (
        active.length === 0 ? (
          <div className="rounded-2xl border border-white/07 bg-card flex flex-col items-center justify-center py-20 gap-4">
            <div className="relative">
              <ShieldCheck className="w-12 h-12 text-teal/40" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-teal animate-pulse" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground text-lg">All systems healthy</p>
              <p className="caption mt-1">ERA Comms is operating normally</p>
            </div>
            <p className="text-[10px] text-muted-foreground/30 uppercase tracking-wider">
              Last checked {timeAgo(lastRefresh.toISOString())}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {critical.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-400/80">
                    Critical — {critical.length}
                  </p>
                </div>
                <div className="space-y-2">
                  {critical.map(a => (
                    <AlertCard key={a.id} alert={a}
                      onResolve={() => void resolve(a.id)}
                      resolving={resolving === a.id} />
                  ))}
                </div>
              </div>
            )}
            {warnings.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-400/80">
                    Warning — {warnings.length}
                  </p>
                </div>
                <div className="space-y-2">
                  {warnings.map(a => (
                    <AlertCard key={a.id} alert={a}
                      onResolve={() => void resolve(a.id)}
                      resolving={resolving === a.id} />
                  ))}
                </div>
              </div>
            )}
            {info.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground/50 mb-3">Info — {info.length}</p>
                <div className="space-y-2">
                  {info.map(a => (
                    <AlertCard key={a.id} alert={a}
                      onResolve={() => void resolve(a.id)}
                      resolving={resolving === a.id} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      ) : (
        resolved.length === 0 ? (
          <div className="rounded-xl border border-white/07 bg-card flex flex-col items-center justify-center py-16 gap-3">
            <CheckCircle2 className="w-8 h-8 text-muted-foreground/20" />
            <p className="font-semibold text-foreground">No resolved alerts</p>
            <p className="caption text-sm">Resolved alerts will appear here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {resolved.map(a => <AlertCard key={a.id} alert={a} />)}
          </div>
        )
      )}
    </div>
  )
}

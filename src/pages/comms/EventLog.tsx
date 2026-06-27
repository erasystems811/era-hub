import { useEffect, useState, useCallback } from 'react'
import { Search, Download, ChevronLeft, ChevronRight, Loader2, FileText, X, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'
import { eventsApi, PlatformEvent, EventSeverity } from '../../lib/events-api'
import { MonitoringTabs } from '../../components/MonitoringTabs'

const PAGE_SIZE = 50

type EventGroup =
  | 'all' | 'sessions' | 'messages' | 'ai' | 'handoffs'
  | 'voice' | 'business' | 'keys' | 'billing' | 'errors'

const EVENT_GROUPS: Record<EventGroup, string[]> = {
  all:      [],
  sessions: ['session_connected','session_disconnected','session_reconnected','session_otp_sent','session_otp_verified','session_created','session_deleted'],
  messages: ['message_received','message_sent','message_failed','message_queued','broadcast_completed','broadcast_message_failed','automation_triggered','automation_message_sent','automation_message_failed'],
  ai:       ['scenario_triggered','kb_queried','ai_response_generated','ai_error'],
  handoffs: ['handoff_triggered','human_took_over','handoff_resolved','returned_to_ai'],
  voice:    ['voice_note_received','transcription_done','transcription_failed'],
  business: ['business_created','business_updated','business_suspended','business_unsuspended','business_deleted','plan_changed','plan_created','plan_updated','plan_deleted','request_submitted','request_approved','request_rejected','moderation_triggered'],
  keys:     ['api_key_generated','api_key_viewed','api_key_expired','api_key_revoked'],
  billing:  ['usage_recorded','limit_reached','limit_warning','invoice_generated','payment_received','payment_failed'],
  errors:   ['error','ai_error','message_failed','transcription_failed','broadcast_message_failed'],
}

function formatEventType(t: string) {
  return t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function fmtDatetime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function SeverityBadge({ severity }: { severity: EventSeverity }) {
  const styles = {
    critical: 'bg-red-500/12 text-red-400 border-red-500/20',
    warning:  'bg-amber-500/12 text-amber-400 border-amber-500/20',
    info:     'bg-white/06 text-muted-foreground border-white/08',
  }
  return (
    <span className={`inline-flex text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${styles[severity]}`}>
      {severity}
    </span>
  )
}

function exportCsv(events: PlatformEvent[]) {
  const headers = ['Time', 'Business', 'Event', 'Severity', 'Detail']
  const rows = events.map(e => [
    fmtDatetime(e.createdAt),
    e.businessName ?? 'System',
    formatEventType(e.eventType),
    e.severity,
    e.detail,
  ])
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a'); a.href = url
  a.download = `era-comms-events-${new Date().toISOString().slice(0, 10)}.csv`
  a.click(); URL.revokeObjectURL(url)
}

function Skeleton() {
  return (
    <div className="divide-y divide-white/05">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="grid grid-cols-[160px_1fr_160px_90px_1fr_24px] gap-4 px-5 py-3.5 items-center">
          {Array.from({ length: 5 }).map((__, j) => (
            <div key={j} className="h-3 bg-white/05 animate-pulse rounded" style={{ width: `${60 + Math.random() * 40}%` }} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function EventLog() {
  const [events,   setEvents]   = useState<PlatformEvent[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)
  const [page,     setPage]     = useState(0)
  const [expanded, setExpanded] = useState<string | null>(null)

  const [search,   setSearch]   = useState('')
  const [severity, setSeverity] = useState<EventSeverity | 'all'>('all')
  const [group,    setGroup]    = useState<EventGroup>('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate,   setToDate]   = useState('')

  const hasFilters = search || severity !== 'all' || group !== 'all' || fromDate || toDate

  const fetch = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const data = await eventsApi.listEvents({
        severity: severity !== 'all' ? severity : undefined,
        from:     fromDate || undefined,
        to:       toDate   || undefined,
        limit:    500,
      })
      setEvents(data ?? [])
      setPage(0)
    } catch (e) {
      const msg = e instanceof Error ? e.message : ''
      // 404 = endpoint not yet live — show empty state, not error
      if (msg.toLowerCase().includes('not found') || msg.includes('404')) {
        setEvents([])
      } else {
        setError(msg || 'Failed to load events')
      }
    } finally { setLoading(false) }
  }, [severity, fromDate, toDate])

  useEffect(() => { void fetch() }, [fetch])

  const clearFilters = () => {
    setSearch(''); setSeverity('all'); setGroup('all'); setFromDate(''); setToDate('')
  }

  // Client-side filtering for search + group (fast, no extra API call)
  const filtered = events.filter(e => {
    if (group !== 'all' && !EVENT_GROUPS[group].includes(e.eventType)) return false
    if (search) {
      const q = search.toLowerCase()
      if (
        !(e.businessName ?? '').toLowerCase().includes(q) &&
        !e.detail.toLowerCase().includes(q) &&
        !e.eventType.toLowerCase().includes(q)
      ) return false
    }
    return true
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated  = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const INPUT = "px-3 py-2 rounded-xl bg-[hsl(262_20%_11%)] border border-white/[0.09] text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="page-title">Monitoring</h1>
          <p className="caption mt-0.5">
            {loading ? 'Loading…' : `${filtered.length.toLocaleString()} event${filtered.length !== 1 ? 's' : ''}${hasFilters ? ' matching filters' : ' total'}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void fetch()}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-white/07 bg-card text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-white/05 transition disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button
            onClick={() => exportCsv(filtered)}
            disabled={loading || filtered.length === 0}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-white/07 bg-card text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-white/05 transition disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      <MonitoringTabs />

      {/* Filters */}
      <div className="rounded-xl border border-white/07 bg-card p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
            <input
              className={`${INPUT} pl-9 w-full`}
              placeholder="Search business, event, or detail…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0) }}
            />
          </div>

          {/* Severity */}
          <select className={INPUT} value={severity} onChange={e => { setSeverity(e.target.value as EventSeverity | 'all'); setPage(0) }}>
            <option value="all">All severities</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>

          {/* Group */}
          <select className={INPUT} value={group} onChange={e => { setGroup(e.target.value as EventGroup); setPage(0) }}>
            <option value="all">All event types</option>
            <option value="sessions">Sessions</option>
            <option value="messages">Messages</option>
            <option value="ai">AI</option>
            <option value="handoffs">Handoffs</option>
            <option value="voice">Voice</option>
            <option value="business">Business</option>
            <option value="keys">API Keys</option>
            <option value="billing">Billing</option>
            <option value="errors">Errors</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <input type="date" className={`${INPUT} text-xs`} value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(0) }} />
          <span className="text-muted-foreground/40 text-xs">to</span>
          <input type="date" className={`${INPUT} text-xs`} value={toDate}   onChange={e => { setToDate(e.target.value);   setPage(0) }} />
          {hasFilters && (
            <button onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/05 border border-white/07 transition">
              <X className="w-3 h-3" /> Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/05 px-4 py-3 text-sm text-red-400 flex items-center justify-between">
          {error}
          <button onClick={() => void fetch()} className="text-xs underline">Retry</button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-white/07 bg-card overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-[160px_1fr_160px_90px_1fr_24px] gap-4 px-5 py-3 border-b border-white/07 bg-white/[0.02]">
          {['Time', 'Business', 'Event', 'Severity', 'Detail', ''].map(h => (
            <p key={h} className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{h}</p>
          ))}
        </div>

        {loading ? <Skeleton /> : paginated.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <FileText className="w-8 h-8 text-muted-foreground/20" />
            <p className="text-sm font-medium text-foreground">No events found</p>
            <p className="text-xs text-muted-foreground">{hasFilters ? 'Try adjusting your filters' : 'Events will appear here as activity occurs'}</p>
          </div>
        ) : (
          <div className="divide-y divide-white/04">
            {paginated.map(ev => (
              <div key={ev.id}>
                <button
                  className="w-full grid grid-cols-[160px_1fr_160px_90px_1fr_24px] gap-4 px-5 py-3 hover:bg-white/[0.018] transition-colors items-center text-left"
                  onClick={() => setExpanded(e => e === ev.id ? null : ev.id)}>
                  {/* Time */}
                  <p className="text-[11px] font-mono text-muted-foreground/70 tabular-nums leading-tight">{fmtDatetime(ev.createdAt)}</p>

                  {/* Business */}
                  <div className="flex items-center gap-2 min-w-0">
                    {ev.businessName ? (
                      <>
                        <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                          {ev.businessName[0]?.toUpperCase()}
                        </div>
                        <p className="text-sm text-foreground font-medium truncate">{ev.businessName}</p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">System</p>
                    )}
                  </div>

                  {/* Event */}
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      ev.severity === 'critical' ? 'bg-red-400' :
                      ev.severity === 'warning'  ? 'bg-amber-400' : 'bg-teal/60'
                    }`} />
                    <p className="text-xs text-foreground font-medium truncate">{formatEventType(ev.eventType)}</p>
                  </div>

                  {/* Severity */}
                  <div><SeverityBadge severity={ev.severity} /></div>

                  {/* Detail */}
                  <p className="text-xs text-muted-foreground truncate">{ev.detail}</p>

                  {/* Expand */}
                  <div className="text-muted-foreground/30">
                    {expanded === ev.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </div>
                </button>

                {expanded === ev.id && (
                  <div className="px-5 pb-4 bg-black/20 border-t border-white/05">
                    <p className="text-xs text-white/70 py-3 leading-relaxed">{ev.detail}</p>
                    {ev.metadata && Object.keys(ev.metadata).length > 0 && (
                      <pre className="text-[10px] text-muted-foreground/60 bg-black/30 rounded-lg p-3 overflow-x-auto">
                        {JSON.stringify(ev.metadata, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="px-5 py-3 border-t border-white/06 flex items-center justify-between">
            <p className="text-xs text-muted-foreground tabular-nums">
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length.toLocaleString()}
            </p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => p - 1)} disabled={page === 0}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/07 transition disabled:opacity-30">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="flex items-center px-3 text-xs text-muted-foreground tabular-nums">
                {page + 1} / {totalPages}
              </span>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/07 transition disabled:opacity-30">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Showing count when no pagination */}
      {!loading && totalPages <= 1 && filtered.length > 0 && (
        <p className="text-xs text-muted-foreground/40 text-center tabular-nums">
          {loading ? <Loader2 className="w-3 h-3 animate-spin inline" /> : `Showing all ${filtered.length} events`}
        </p>
      )}
    </div>
  )
}

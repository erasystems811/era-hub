import { useState, useEffect } from 'react'
import { Bot, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { commsApi, type Client } from '../../lib/comms-api'
import { eventsApi, type PlatformEvent } from '../../lib/events-api'
import { AIEngineTabs } from '../../components/AIEngineTabs'

const INPUT = 'px-3.5 py-2 rounded-xl bg-[hsl(262_20%_11%)] border border-white/[0.10] text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all'

function maskPhone(phone: string) {
  if (phone.length <= 7) return phone
  return phone.slice(0, 7) + '***'
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const AI_TYPES = new Set(['ai_response_generated', 'ai_error', 'scenario_triggered', 'kb_queried'])

export function AILogs() {
  const nav = useNavigate()
  const [clients, setClients]   = useState<Client[]>([])
  const [events, setEvents]     = useState<PlatformEvent[]>([])
  const [loading, setLoading]   = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const [clientFilter, setClientFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch]             = useState('')
  const [fromDate, setFromDate]         = useState('')
  const [toDate, setToDate]             = useState('')

  useEffect(() => {
    commsApi.listClients().then(setClients).catch(() => null)
    eventsApi.listEvents({ limit: 200 })
      .then(all => setEvents(all.filter(e => AI_TYPES.has(e.eventType))))
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [])

  const filtered = events.filter(e => {
    if (clientFilter && e.businessId !== clientFilter) return false
    if (statusFilter === 'failed'    && e.eventType !== 'ai_error')          return false
    if (statusFilter === 'success'   && e.eventType === 'ai_error')          return false
    if (statusFilter === 'escalated' && e.eventType !== 'scenario_triggered') return false
    if (search) {
      const q = search.toLowerCase()
      if (!e.detail.toLowerCase().includes(q) && !(e.businessName ?? '').toLowerCase().includes(q)) return false
    }
    if (fromDate && new Date(e.createdAt) < new Date(fromDate)) return false
    if (toDate   && new Date(e.createdAt) > new Date(toDate))   return false
    return true
  })

  function rowStatus(e: PlatformEvent): { label: string; cls: string } {
    if (e.eventType === 'ai_error')           return { label: 'Failed',    cls: 'bg-red-500/10 text-red-400' }
    if (e.eventType === 'scenario_triggered') return { label: 'Escalated', cls: 'bg-amber-500/10 text-amber-400' }
    return { label: 'Success', cls: 'bg-emerald-500/10 text-emerald-400' }
  }

  return (
    <div className="max-w-5xl space-y-6">
      <AIEngineTabs />
      <div>
        <h1 className="page-title">AI Logs</h1>
        <p className="caption mt-0.5">Every conversation the AI has handled</p>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl border border-primary/20 bg-primary/5">
        <Bot className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        <div>
          <p className="text-sm text-foreground">AI conversation logs are captured in the Event Log.</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            The table below shows AI-related events. For full conversation transcripts, filter by type{' '}
            <code className="text-primary font-mono text-[11px]">ai_response_generated</code>{' '}
            in the{' '}
            <button onClick={() => nav('/comms/event-log')} className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors">
              Event Log
            </button>.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={clientFilter} onChange={e => setClientFilter(e.target.value)} className={INPUT}>
          <option value="">All businesses</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={INPUT}>
          <option value="all">All statuses</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
          <option value="escalated">Escalated</option>
        </select>
        <input
          type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
          className={INPUT}
        />
        <input
          type="date" value={toDate} onChange={e => setToDate(e.target.value)}
          className={INPUT}
        />
        <input
          type="search" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)}
          className={`${INPUT} flex-1 min-w-[160px]`}
        />
        <button
          onClick={() => nav('/comms/event-log')}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-white/10 text-sm text-muted-foreground hover:text-foreground hover:border-white/20 transition-all"
        >
          <ExternalLink className="w-3.5 h-3.5" /> Full Event Log
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/[0.07] bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[680px]">
            <thead>
              <tr className="border-b border-white/[0.07]">
                {['Time', 'Business', 'Event Type', 'Detail', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/60">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/[0.04]">
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-3 bg-white/06 rounded animate-pulse w-20" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Bot className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No AI events found</p>
                    <p className="text-xs text-muted-foreground/50 mt-1">Try adjusting the filters above</p>
                  </td>
                </tr>
              ) : (
                filtered.map(evt => {
                  const status = rowStatus(evt)
                  const expanded = expandedId === evt.id
                  return (
                    <>
                      <tr
                        key={evt.id}
                        className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors cursor-pointer"
                        onClick={() => setExpandedId(expanded ? null : evt.id)}
                      >
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap" title={evt.createdAt}>
                          {timeAgo(evt.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-foreground">{evt.businessName ?? '—'}</td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{evt.eventType}</td>
                        <td className="px-4 py-3 text-muted-foreground max-w-[220px] truncate">{evt.detail}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full ${status.cls}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {expanded
                            ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                            : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                        </td>
                      </tr>
                      {expanded && (
                        <tr key={`${evt.id}-exp`} className="border-b border-white/[0.04] bg-white/[0.015]">
                          <td colSpan={6} className="px-6 py-4">
                            <div className="space-y-3">
                              <div className="flex gap-6 text-xs text-muted-foreground">
                                <span><span className="text-foreground font-medium">Event ID:</span> {evt.id}</span>
                                <span><span className="text-foreground font-medium">Business ID:</span> {evt.businessId ?? '—'}</span>
                                <span><span className="text-foreground font-medium">Session:</span> {evt.sessionId ?? '—'}</span>
                                <span><span className="text-foreground font-medium">Severity:</span> {evt.severity}</span>
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Detail</p>
                                <p className="text-sm text-foreground">{evt.detail}</p>
                              </div>
                              {Object.keys(evt.metadata).length > 0 && (
                                <div>
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Metadata</p>
                                  <pre className="text-xs text-muted-foreground bg-[hsl(262_20%_6%)] rounded-lg p-3 overflow-x-auto">
                                    {JSON.stringify(evt.metadata, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-white/[0.07] text-xs text-muted-foreground">
          {filtered.length} events
        </div>
      </div>
    </div>
  )
}

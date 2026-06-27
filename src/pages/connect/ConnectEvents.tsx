import { useEffect, useState, useCallback } from 'react'
import {
  Loader2, AlertTriangle, RefreshCw, CheckCircle2, XCircle,
  AlertCircle, Heart, Users, Activity, Zap, Power, PowerOff,
  Settings, FlaskConical,
} from 'lucide-react'
import { connectApi, ConnectEvent, ConnectInstance } from '../../lib/connect-api'

function timeStr(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

function EventIcon({ type, status }: { type: string; status: string }) {
  if (status === 'error')               return <XCircle      className="w-3.5 h-3.5 text-red-400" />
  if (status === 'warning')             return <AlertCircle  className="w-3.5 h-3.5 text-amber-400" />
  if (type === 'patient_synced')        return <Users        className="w-3.5 h-3.5 text-sky-400" />
  if (type === 'care_plan_synced')      return <Heart        className="w-3.5 h-3.5 text-purple-400" />
  if (type === 'sandbox_injected')      return <FlaskConical className="w-3.5 h-3.5 text-emerald-400" />
  if (type === 'auth_ok')               return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
  if (type === 'startup')               return <Power        className="w-3.5 h-3.5 text-emerald-400" />
  if (type === 'shutdown')              return <PowerOff     className="w-3.5 h-3.5 text-zinc-400" />
  if (type === 'config_fetched' || type === 'config_updated') return <Settings className="w-3.5 h-3.5 text-muted-foreground/40" />
  if (type === 'heartbeat')             return <Activity     className="w-3.5 h-3.5 text-muted-foreground/25" />
  return <Zap className="w-3.5 h-3.5 text-muted-foreground/40" />
}

function statusBadge(status: string) {
  if (status === 'error')   return <span className="text-[9px] font-bold uppercase tracking-wider text-red-400 bg-red-500/10 rounded px-1.5 py-0.5">error</span>
  if (status === 'warning') return <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 rounded px-1.5 py-0.5">warn</span>
  return null
}

const EVENT_LABELS: Record<string, string> = {
  patient_synced:   'Patient Synced',
  care_plan_synced: 'Care Plan Synced',
  sync_error:       'Sync Error',
  sandbox_injected: 'Sandbox Test',
  startup:          'Agent Started',
  shutdown:         'Agent Stopped',
  auth_ok:          'Auth OK',
  auth_failed:      'Auth Failed',
  db_connected:     'DB Connected',
  db_error:         'DB Error',
  heartbeat:        'Heartbeat',
  config_fetched:   'Config Fetched',
  config_updated:   'Config Updated',
}

function fmtType(t: string) {
  return EVENT_LABELS[t] ?? t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

const PAGE_SIZE = 100

export function ConnectEvents() {
  const [events,       setEvents]       = useState<ConnectEvent[]>([])
  const [instances,    setInstances]    = useState<ConnectInstance[]>([])
  const [total,        setTotal]        = useState(0)
  const [offset,       setOffset]       = useState(0)
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')
  const [hideRoutine,  setHideRoutine]  = useState(true)

  const [filters, setFilters] = useState({
    instanceId: '',
    eventType:  '',
    status:     '',
    from:       '',
    to:         '',
  })

  const load = useCallback(async (off = 0, hide = hideRoutine) => {
    setLoading(true)
    setError('')
    try {
      const res = await connectApi.listEvents({
        ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
        hideRoutine: hide,
        limit: PAGE_SIZE,
        offset: off,
      })
      setEvents(res.events)
      setTotal(res.total)
      setOffset(off)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [filters, hideRoutine])

  useEffect(() => {
    void connectApi.listInstances().then(setInstances).catch(() => {})
    void load(0, true)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const applyFilters = () => void load(0)

  const toggleRoutine = () => {
    const next = !hideRoutine
    setHideRoutine(next)
    void load(0, next)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Activity Log</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {total > 0 ? `${total.toLocaleString()} events` : 'Sync activity from every connected hospital'}
          </p>
        </div>
        <button onClick={() => void load(0)}
          className="p-2 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-white/5 transition">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-end">
        <div>
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Hospital</label>
          <select value={filters.instanceId} onChange={e => setFilters(f => ({ ...f, instanceId: e.target.value }))}
            className="bg-background border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-primary/50 min-w-[150px]">
            <option value="">All hospitals</option>
            {instances.map(i => <option key={i.id} value={i.id}>{i.hospitalName}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Event Type</label>
          <select value={filters.eventType} onChange={e => setFilters(f => ({ ...f, eventType: e.target.value }))}
            className="bg-background border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-primary/50">
            <option value="">All types</option>
            <option value="patient_synced">Patient Synced</option>
            <option value="care_plan_synced">Care Plan Synced</option>
            <option value="sync_error">Sync Error</option>
            <option value="sandbox_injected">Sandbox Test</option>
            <option value="startup">Agent Started</option>
            <option value="shutdown">Agent Stopped</option>
            <option value="auth_ok">Auth OK</option>
            <option value="auth_failed">Auth Failed</option>
            <option value="db_error">DB Error</option>
            <option value="heartbeat">Heartbeat</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Status</label>
          <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
            className="bg-background border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-primary/50">
            <option value="">All</option>
            <option value="ok">OK</option>
            <option value="error">Error</option>
            <option value="warning">Warning</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">From</label>
          <input type="datetime-local" value={filters.from} onChange={e => setFilters(f => ({ ...f, from: e.target.value }))}
            className="bg-background border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-primary/50" />
        </div>
        <div>
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">To</label>
          <input type="datetime-local" value={filters.to} onChange={e => setFilters(f => ({ ...f, to: e.target.value }))}
            className="bg-background border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-primary/50" />
        </div>
        <button onClick={applyFilters}
          className="px-3 py-1.5 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 text-xs font-semibold transition">
          Apply
        </button>
        <button onClick={() => {
          setFilters({ instanceId: '', eventType: '', status: '', from: '', to: '' })
          setTimeout(() => void load(0), 0)
        }}
          className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-white/5 transition">
          Clear
        </button>

        {/* Hide routine toggle */}
        <button
          onClick={toggleRoutine}
          className={`ml-auto px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
            hideRoutine
              ? 'border-primary/30 bg-primary/10 text-primary'
              : 'border-white/10 text-muted-foreground hover:bg-white/5'
          }`}
        >
          {hideRoutine ? 'Hiding heartbeats' : 'Showing all events'}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Event table */}
      {loading && events.length === 0 ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 p-10 text-center">
          <Activity className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No activity yet</p>
          <p className="text-xs text-muted-foreground/50 mt-1">Patient syncs, care plan syncs, and errors will appear here</p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-white/07 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/07 text-left">
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Time</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Hospital</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Event</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Patient MRN</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/05">
                {events.map(ev => (
                  <tr key={ev.id} className={`hover:bg-white/[0.025] transition ${ev.status === 'error' ? 'bg-red-500/[0.03]' : ''}`}>
                    <td className="px-4 py-2.5 text-[11px] text-muted-foreground/60 whitespace-nowrap">{timeStr(ev.createdAt)}</td>
                    <td className="px-4 py-2.5 text-xs hidden sm:table-cell">
                      {ev.hospitalName ?? <span className="text-muted-foreground/40">—</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <EventIcon type={ev.eventType} status={ev.status} />
                        <span className="text-xs font-medium">{fmtType(ev.eventType)}</span>
                        {statusBadge(ev.status)}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground/60 hidden md:table-cell font-mono">
                      {ev.patientMrn ?? '—'}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground/70 max-w-xs truncate">
                      {ev.message || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > PAGE_SIZE && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total.toLocaleString()}</span>
              <div className="flex gap-2">
                <button onClick={() => void load(Math.max(0, offset - PAGE_SIZE))} disabled={offset === 0}
                  className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-40 transition">
                  Previous
                </button>
                <button onClick={() => void load(offset + PAGE_SIZE)} disabled={offset + PAGE_SIZE >= total}
                  className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-40 transition">
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

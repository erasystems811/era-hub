import { useState, useEffect } from 'react'
import { Search, Phone, CheckCircle2, Clock, Loader2, AlertCircle } from 'lucide-react'
import { patientApi, DemoSession } from '../../lib/patient-api'
import { pageCache } from '../../lib/cache'

const STAGE_LABELS: Record<string, string> = {
  '1':  'Introduction',
  '2':  'Hospital selection',
  '3':  'Patient info',
  '4':  'Department selection',
  '5':  'Appointment booking',
  '6':  'Payment prompt',
  '7':  'Appointment confirmed',
  '8':  'Feedback prompt',
  '9':  'Wellness tip',
  '10': 'Follow-up prompt',
  '11': 'Complete',
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function DemoSessions() {
  const [sessions, setSessions] = useState<DemoSession[]>(() => pageCache.get<DemoSession[]>('patient:demo-sessions') ?? [])
  const [loading, setLoading]   = useState(() => !pageCache.get('patient:demo-sessions'))
  const [error, setError]       = useState<string | null>(null)
  const [search, setSearch]     = useState('')

  useEffect(() => {
    setLoading(true)
    patientApi.listDemoSessions()
      .then(data => { pageCache.set('patient:demo-sessions', data); setSessions(data) })
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = sessions.filter(s => {
    const q = search.toLowerCase()
    return (
      s.first_name.toLowerCase().includes(q) ||
      s.last_name.toLowerCase().includes(q) ||
      s.phone.includes(q) ||
      (s.email ?? '').toLowerCase().includes(q)
    )
  })

  const completed = sessions.filter(s => s.completed).length
  const dropOff   = sessions.length - completed

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="page-title">Demo Sessions</h1>
        <p className="caption mt-0.5">Prospects who started the interactive ERA Patient demo</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="w-4 h-4 inline mr-2" />{error}
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Sessions', value: loading ? null : sessions.length, color: 'text-foreground', sub: null },
          { label: 'Completed',      value: loading ? null : completed,        color: 'text-primary',    sub: null },
          { label: 'Dropped Off',    value: loading ? null : dropOff,          color: 'text-amber-400',  sub: null },
          { label: 'Completion Rate',
            value: loading ? null : sessions.length ? Math.round((completed / sessions.length) * 100) : 0,
            color: completed > dropOff ? 'text-teal' : 'text-amber-400',
            sub: '%' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-white/07 bg-card px-5 py-4">
            <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
            <p className={`text-2xl font-bold tabular-nums mt-0.5 ${s.color}`}>
              {s.value ?? '—'}{s.sub && s.value !== null ? s.sub : ''}
            </p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or phone…"
          className="input pl-9"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/07 bg-card overflow-hidden overflow-x-auto">
        <table className="w-full text-sm" style={{ minWidth: 640 }}>
          <thead>
            <tr className="border-b border-white/07 text-left text-xs text-muted-foreground font-semibold uppercase tracking-wide">
              <th className="px-4 py-3 w-8">#</th>
              <th className="px-4 py-3">Prospect</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Stage Reached</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Started</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/06">
            {loading ? (
              <tr><td colSpan={7} className="py-12 text-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground mx-auto" /></td></tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-muted-foreground text-sm">
                  {sessions.length === 0 ? 'No demo sessions yet. Share the demo link to get started.' : 'No results match your search.'}
                </td>
              </tr>
            ) : (
              filtered.map((s, i) => (
                <tr key={s.id} className="hover:bg-white/[0.03] transition-colors">
                  <td className="px-4 py-3 text-muted-foreground tabular-nums">{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                        {s.first_name[0]}{s.last_name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{s.first_name} {s.last_name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {s.email ?? <span className="opacity-40">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Phone className="w-3.5 h-3.5" />{s.phone}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {s.stage_reached ? (
                      <span className="text-xs font-medium text-foreground">
                        {STAGE_LABELS[s.stage_reached] ?? `Scene ${s.stage_reached}`}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/40 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {s.completed ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#CC7896]">
                        <CheckCircle2 className="w-3.5 h-3.5" />Completed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400">
                        <Clock className="w-3.5 h-3.5" />In progress
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">{fmtDate(s.started_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

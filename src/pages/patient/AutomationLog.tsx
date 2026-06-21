import { useEffect, useState } from 'react'
import { RefreshCw, Zap, Loader2 } from 'lucide-react'
import { patientApi, AutomationLog as LogEntry } from '../../lib/patient-api'
import { fmtDateTime } from '../../lib/utils'

const STATUS_BADGE: Record<string, string> = {
  sent:      'bg-teal/10 text-teal border-teal/20',
  delivered: 'bg-teal/10 text-teal border-teal/20',
  failed:    'bg-red-500/10 text-red-400 border-red-500/20',
  pending:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
  retrying:  'bg-amber-500/10 text-amber-400 border-amber-500/20',
}

const FILTERS = ['all', 'sent', 'failed', 'pending'] as const

export function AutomationLog() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [retrying, setRetrying] = useState<number | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const status = filter !== 'all' ? filter : undefined
      setLogs(await patientApi.getAutomationLog({ status }))
    } finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [filter])

  const retry = async (id: number) => {
    setRetrying(id)
    try { await patientApi.retryAutomation(id); void load() }
    finally { setRetrying(null) }
  }

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="page-title">Automation Log</h1>
          <p className="caption mt-0.5">All automated messages sent across hospitals</p>
        </div>
        <button className="btn-secondary flex items-center gap-2 text-sm" onClick={load} disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Filter tab bar */}
      <div className="flex gap-1 mb-5 p-1 rounded-xl border border-white/07 bg-card w-fit overflow-x-auto max-w-full">
        {FILTERS.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
              filter === s
                ? 'bg-teal text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/05'
            }`}>
            {s === 'all' ? 'All messages' : s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading automation logs…
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-2xl border border-white/07 bg-card flex flex-col items-center justify-center py-16 gap-3">
          <Zap className="w-10 h-10 text-muted-foreground/20" />
          <p className="font-semibold text-foreground">No automation runs found</p>
          <p className="caption text-sm">Messages will appear here once automations run</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/07 bg-card overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: 680 }}>
            <thead>
              <tr className="border-b border-white/07">
                {['Hospital', 'Patient', 'Type', 'Channel', 'Status', 'Sent', ''].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-5 py-3.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/05">
              {logs.map(l => (
                <tr key={l.id} className="hover:bg-white/[0.025] transition-colors">
                  <td className="px-5 py-3.5 text-foreground font-medium truncate max-w-[140px]">{l.hospitalName ?? '—'}</td>
                  <td className="px-5 py-3.5 text-muted-foreground truncate max-w-[120px]">{l.patientName ?? '—'}</td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs font-medium text-foreground capitalize">{l.automationType.replace(/_/g, ' ')}</span>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground text-xs capitalize">{l.channel}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${STATUS_BADGE[l.status] ?? 'bg-white/06 text-muted-foreground border-white/10'}`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground text-xs whitespace-nowrap">{fmtDateTime(l.sentAt ?? l.createdAt)}</td>
                  <td className="px-5 py-3.5">
                    {l.status === 'failed' && (
                      <button className="text-xs text-teal font-semibold flex items-center gap-1 hover:underline"
                        onClick={() => void retry(l.id)} disabled={retrying === l.id}>
                        <RefreshCw className="w-3 h-3" />
                        {retrying === l.id ? 'Retrying…' : 'Retry'}
                      </button>
                    )}
                    {l.errorMessage && (
                      <span className="text-[10px] text-red-400 block mt-0.5 max-w-[160px] truncate" title={l.errorMessage}>
                        {l.errorMessage}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  )
}

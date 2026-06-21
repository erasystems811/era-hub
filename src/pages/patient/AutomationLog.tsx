import { useEffect, useState } from 'react'
import { RefreshCw, Zap } from 'lucide-react'
import { Glass } from '../../components/Glass'
import { patientApi, AutomationLog as LogEntry } from '../../lib/patient-api'
import { fmtDateTime } from '../../lib/utils'

const STATUS_COLORS: Record<string, string> = {
  sent: 'bg-teal/10 text-teal',
  delivered: 'bg-teal/10 text-teal',
  failed: 'bg-rose/10 text-rose',
  pending: 'bg-amber-50 text-amber-600',
  retrying: 'bg-amber-50 text-amber-600',
}

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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Automation Log</h1>
          <p className="caption mt-0.5">All automated messages sent across hospitals</p>
        </div>
        <button className="btn-secondary flex items-center gap-2" onClick={load} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-5 glass-sm" style={{ padding: '4px', display: 'inline-flex', borderRadius: '14px' }}>
        {['all', 'sent', 'failed', 'pending'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all capitalize ${
              filter === s ? 'bg-teal text-white shadow-sm' : 'text-charcoal-soft hover:text-charcoal'
            }`}
          >
            {s === 'all' ? 'All messages' : s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-charcoal-soft">Loading…</div>
      ) : logs.length === 0 ? (
        <Glass className="text-center py-12">
          <Zap className="w-10 h-10 text-pink mx-auto mb-3 opacity-40" />
          <p className="font-medium text-charcoal">No automation runs found</p>
          <p className="caption mt-1">Messages will appear here once automations run</p>
        </Glass>
      ) : (
        <div className="glass overflow-hidden" style={{ padding: 0 }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(233,145,200,0.2)' }}>
                {['Hospital', 'Patient', 'Type', 'Channel', 'Status', 'Sent', 'Actions'].map(h => (
                  <th key={h} className="text-left text-xs text-charcoal-soft font-medium px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map(l => (
                <tr key={l.id} className="border-b border-pink-border last:border-0 hover:bg-pink-light transition-colors">
                  <td className="px-4 py-3 text-charcoal">{l.hospitalName ?? '—'}</td>
                  <td className="px-4 py-3 text-charcoal-soft">{l.patientName ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium text-charcoal capitalize">{l.automationType.replace(/_/g, ' ')}</span>
                  </td>
                  <td className="px-4 py-3 text-charcoal-soft capitalize">{l.channel}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-semibold px-2 py-1 rounded-full uppercase tracking-wide ${STATUS_COLORS[l.status] ?? 'bg-gray-100 text-gray-500'}`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-charcoal-soft text-xs">{fmtDateTime(l.sentAt ?? l.createdAt)}</td>
                  <td className="px-4 py-3">
                    {l.status === 'failed' && (
                      <button
                        className="text-xs text-teal font-medium flex items-center gap-1 hover:underline"
                        onClick={() => void retry(l.id)}
                        disabled={retrying === l.id}
                      >
                        <RefreshCw className="w-3 h-3" />
                        {retrying === l.id ? 'Retrying…' : 'Retry'}
                      </button>
                    )}
                    {l.errorMessage && (
                      <span className="text-[11px] text-rose block mt-0.5 max-w-[160px] truncate" title={l.errorMessage}>
                        {l.errorMessage}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

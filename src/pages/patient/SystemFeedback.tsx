import { useState, useEffect } from 'react'
import { RefreshCw, Send, Loader2, AlertCircle, MessageSquare } from 'lucide-react'
import { patientApi, SystemFeedbackEntry } from '../../lib/patient-api'
import { pageCache } from '../../lib/cache'

const RATINGS = [
  { value: 5, emoji: '😍', label: 'Excellent' },
  { value: 4, emoji: '😊', label: 'Good' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 2, emoji: '😕', label: 'Poor' },
  { value: 1, emoji: '😡', label: 'Terrible' },
]

function roleLabel(r: string) {
  if (!r) return 'Unknown'
  return r.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })
}

function isThisMonth(iso: string) {
  const d = new Date(iso), n = new Date()
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth()
}

function StatCard({ label, value, suffix, highlight }: { label: string; value: number | string | null; suffix?: string; highlight?: boolean }) {
  return (
    <div className="rounded-xl border border-white/07 bg-card px-5 py-4">
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
      <p className={`text-3xl font-bold mt-1 tabular-nums ${highlight ? 'text-primary' : 'text-foreground'}`}>
        {value ?? '—'}{suffix && value !== null && <span className="text-base font-normal text-muted-foreground ml-1">{suffix}</span>}
      </p>
    </div>
  )
}

type BroadcastState = 'idle' | 'confirming' | 'sending' | 'sent' | 'error'

export function SystemFeedback() {
  const [entries, setEntries] = useState<SystemFeedbackEntry[]>(() => pageCache.get<SystemFeedbackEntry[]>('patient:feedback') ?? [])
  const [loading, setLoading] = useState(() => !pageCache.get('patient:feedback'))
  const [error, setError] = useState<string | null>(null)
  const [broadcastState, setBroadcastState] = useState<BroadcastState>('idle')
  const [broadcastMsg, setBroadcastMsg] = useState<string | null>(null)

  const fetchEntries = async () => {
    setLoading(true); setError(null)
    try {
      const data = await patientApi.listSystemFeedback()
      pageCache.set('patient:feedback', data)
      setEntries(data)
    }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(() => { void fetchEntries() }, [])

  const handleBroadcast = async () => {
    setBroadcastState('sending'); setBroadcastMsg(null)
    try {
      await patientApi.broadcastFeedback()
      setBroadcastState('sent')
      setBroadcastMsg('Feedback broadcast sent to hospitals successfully.')
      setTimeout(() => { setBroadcastState('idle'); setBroadcastMsg(null) }, 4000)
    } catch (e) {
      setBroadcastState('error')
      setBroadcastMsg(e instanceof Error ? e.message : 'Broadcast failed')
      setTimeout(() => { setBroadcastState('idle'); setBroadcastMsg(null) }, 4000)
    }
  }

  const total = entries.length
  const avg   = total ? (entries.reduce((s, e) => s + e.rating, 0) / total).toFixed(1) : null
  const month = entries.filter(e => { try { return isThisMonth(e.created_at) } catch { return false } }).length
  const breakdown = RATINGS.map(r => {
    const count = entries.filter(e => e.rating === r.value).length
    return { ...r, count, pct: total ? Math.round((count / total) * 100) : 0 }
  })

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-semibold text-primary/70 mb-1">ERA Patient</p>
          <h1 className="page-title">Hospital Feedback</h1>
          <p className="caption mt-1">Ratings from hospital staff</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <button onClick={fetchEntries} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {broadcastState === 'confirming' ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card text-xs">
              <span className="text-muted-foreground">Push to hospitals?</span>
              <button onClick={() => void handleBroadcast()} className="font-semibold text-primary hover:opacity-80">Yes</button>
              <button onClick={() => setBroadcastState('idle')} className="text-muted-foreground hover:text-foreground">Cancel</button>
            </div>
          ) : (
            <button onClick={() => broadcastState === 'idle' && setBroadcastState('confirming')} disabled={broadcastState === 'sending'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all disabled:opacity-50 ${
                broadcastState === 'sent'  ? 'border-[#CC7896]/30 bg-[#CC7896]/10 text-[#CC7896]'
              : broadcastState === 'error' ? 'border-red-500/30 bg-red-500/10 text-red-400'
              : 'border-primary/30 bg-primary/10 text-primary hover:bg-primary/15'}`}>
              {broadcastState === 'sending' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              {broadcastState === 'sent' ? 'Sent!' : broadcastState === 'error' ? 'Failed' : 'Push to hospitals'}
            </button>
          )}
        </div>
      </div>

      {broadcastMsg && (
        <div className={`flex items-center gap-2 text-sm p-3 rounded-lg border ${broadcastState === 'error' ? 'text-red-400 bg-red-500/10 border-red-500/20' : 'text-[#CC7896] bg-[#CC7896]/10 border-[#CC7896]/20'}`}>
          <AlertCircle className="w-4 h-4 shrink-0" />{broadcastMsg}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-400 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total responses" value={loading ? null : total} />
        <StatCard label="Average rating" value={loading ? null : avg} suffix="/ 5" highlight />
        <StatCard label="This month" value={loading ? null : month} />
      </div>

      <div className="rounded-xl border border-white/07 bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">Rating breakdown</h2>
        <div className="space-y-3">
          {breakdown.map(r => (
            <div key={r.value} className="flex items-center gap-3">
              <span className="text-xl w-7 shrink-0 leading-none">{r.emoji}</span>
              <span className="text-xs text-muted-foreground w-16 shrink-0">{r.label}</span>
              <div className="flex-1 h-2 bg-white/08 rounded-full overflow-hidden">
                <div className="h-full bg-primary/70 rounded-full transition-all duration-500" style={{ width: loading ? '0%' : `${r.pct}%` }} />
              </div>
              <span className="text-sm font-bold text-foreground w-6 text-right tabular-nums shrink-0">{loading ? '—' : r.count}</span>
              <span className="text-xs text-muted-foreground w-10 text-right tabular-nums shrink-0">{loading ? '' : `${r.pct}%`}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-white/07 bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/07 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">All responses</h2>
          {!loading && total > 0 && <span className="text-xs text-muted-foreground">{total} total</span>}
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
            <MessageSquare className="w-8 h-8 opacity-20" />
            <p className="text-sm">No feedback yet</p>
            <p className="text-xs opacity-50">Responses appear here once hospital staff start rating</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: 560 }}>
              <thead>
                <tr className="border-b border-white/07">
                  {['Hospital', 'Role', 'Rating', 'Comment', 'When'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map(e => {
                  const r = RATINGS.find(x => x.value === e.rating) ?? RATINGS[2]
                  return (
                    <tr key={e.id} className="border-b border-white/05 last:border-0 hover:bg-white/[0.03] transition-colors">
                      <td className="px-5 py-3 font-medium text-foreground whitespace-nowrap">{e.hospital_name}</td>
                      <td className="px-3 py-3">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/08 text-muted-foreground capitalize">{roleLabel(e.user_role)}</span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="flex items-center gap-1.5 whitespace-nowrap">
                          <span className="text-base leading-none">{r.emoji}</span>
                          <span className="font-bold text-foreground tabular-nums">{e.rating}</span>
                          <span className="text-xs text-muted-foreground">/5</span>
                        </span>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground max-w-xs">
                        {e.comment ? <span className="line-clamp-2">{e.comment}</span> : <span className="opacity-30">—</span>}
                      </td>
                      <td className="px-5 py-3 text-xs text-muted-foreground whitespace-nowrap">{timeAgo(e.created_at)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

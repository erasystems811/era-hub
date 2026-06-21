import { useState, useEffect } from 'react'
import { RefreshCw, Users, Activity, Eye, TrendingUp, MessageSquare, Loader2, AlertCircle } from 'lucide-react'
import { patientApi, PatientAnalyticsData, PatientFeedbackItem } from '../../lib/patient-api'
import { pageCache } from '../../lib/cache'

const CAT_COLORS: Record<string, string> = {
  feature:  'text-blue-400   bg-blue-500/10   border-blue-500/25',
  bug:      'text-red-400    bg-red-500/10    border-red-500/25',
  ux:       'text-purple-400 bg-purple-500/10 border-purple-500/25',
  general:  'text-slate-400  bg-white/08      border-white/10',
}

function StatCard({ icon, label, value, sub, highlight }: { icon: React.ReactNode; label: string; value: number | null; sub?: string; highlight?: boolean }) {
  return (
    <div className="rounded-xl border border-white/07 bg-card px-5 py-4 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${highlight ? 'bg-primary/15 text-primary' : 'bg-white/06 text-muted-foreground'}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-2xl font-bold text-foreground tabular-nums mt-0.5">{value === null ? '—' : value.toLocaleString()}</p>
        {sub && <p className="text-xs text-muted-foreground/50 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function PatientAnalytics() {
  const [data, setData] = useState<PatientAnalyticsData | null>(() => pageCache.get<PatientAnalyticsData>('patient:analytics'))
  const [feedback, setFeedback] = useState<PatientFeedbackItem[]>([])
  const [loading, setLoading] = useState(() => !pageCache.get('patient:analytics'))
  const [fbLoading, setFbLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [catFilter, setCatFilter] = useState('all')
  const [fbPage, setFbPage] = useState(1)
  const [fbTotal, setFbTotal] = useState(0)

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const d = await patientApi.getPatientAnalytics()
      pageCache.set('patient:analytics', d)
      setData(d)
    }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed to load') }
    finally { setLoading(false) }
  }

  const loadFeedback = async (page = 1, category?: string) => {
    setFbLoading(true)
    try {
      const res = await patientApi.listPatientFeedback({ page, category: category === 'all' ? undefined : category })
      setFeedback(res.items ?? [])
      setFbTotal(res.total ?? 0)
    } catch { /* ignore */ }
    finally { setFbLoading(false) }
  }

  useEffect(() => { void load() }, [])
  useEffect(() => { void loadFeedback(fbPage, catFilter) }, [fbPage, catFilter])

  const d = data
  const PER_PAGE = 20

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-primary/70 mb-1">ERA Patient App</p>
          <h1 className="page-title">Patient Analytics</h1>
          <p className="caption mt-0.5">Activity from the ERA Patient mobile app</p>
        </div>
        <button onClick={() => { void load(); void loadFeedback(1, catFilter) }} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground transition disabled:opacity-50">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-400 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Users className="w-5 h-5" />} label="Total patients" value={loading ? null : d?.totalPatients ?? 0} highlight />
        <StatCard icon={<TrendingUp className="w-5 h-5" />} label="New today" value={loading ? null : d?.newToday ?? 0} sub={`${d?.newThisWeek ?? 0} this week`} />
        <StatCard icon={<Activity className="w-5 h-5" />} label="Active today" value={loading ? null : d?.activeToday ?? 0} sub={`${d?.activeThisWeek ?? 0} this week`} />
        <StatCard icon={<Eye className="w-5 h-5" />} label="Page views today" value={loading ? null : d?.pageViewsToday ?? 0} sub={`${d?.pageViewsWeek ?? 0} this week`} />
      </div>

      {/* Top pages + daily signups */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top pages */}
        <div className="rounded-xl border border-white/07 bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-white/07">
            <h2 className="text-sm font-semibold text-foreground">Top pages</h2>
          </div>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : !d?.topPages?.length ? (
            <p className="text-sm text-muted-foreground p-5">No page view data yet</p>
          ) : (
            <div className="divide-y divide-white/05">
              {d.topPages.map((p, i) => {
                const max = d.topPages[0]?.views ?? 1
                return (
                  <div key={i} className="px-5 py-3 flex items-center gap-3">
                    <span className="text-xs text-muted-foreground/40 tabular-nums w-4">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-foreground truncate">{p.route}</span>
                        <span className="text-sm font-bold text-primary tabular-nums ml-2">{p.views.toLocaleString()}</span>
                      </div>
                      <div className="h-1.5 bg-white/06 rounded-full overflow-hidden">
                        <div className="h-full bg-primary/60 rounded-full" style={{ width: `${(p.views / max) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Daily signups */}
        <div className="rounded-xl border border-white/07 bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-white/07">
            <h2 className="text-sm font-semibold text-foreground">Daily sign-ups (last 14 days)</h2>
          </div>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : !d?.dailySignups?.length ? (
            <p className="text-sm text-muted-foreground p-5">No sign-up data yet</p>
          ) : (
            <div className="p-5 flex items-end gap-1.5 h-36">
              {d.dailySignups.map((ds, i) => {
                const max = Math.max(...d.dailySignups.map(x => x.count), 1)
                const pct = Math.max(3, (ds.count / max) * 100)
                const day = new Date(ds.date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group" title={`${day}: ${ds.count}`}>
                    <span className="text-[9px] text-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity">{ds.count || ''}</span>
                    <div className="w-full rounded-t bg-primary/40 hover:bg-primary/70 transition-colors" style={{ height: `${pct}%` }} />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Patient feedback */}
      <div>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h2 className="text-sm font-semibold text-foreground">Patient feedback</h2>
          <div className="flex gap-1.5">
            {['all', 'feature', 'bug', 'ux', 'general'].map(c => (
              <button key={c} onClick={() => { setCatFilter(c); setFbPage(1) }}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all capitalize ${catFilter === c ? 'bg-primary/15 border-primary/40 text-primary' : 'border-white/10 text-muted-foreground hover:border-white/20'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/07 bg-card overflow-hidden">
          {fbLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : feedback.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
              <MessageSquare className="w-8 h-8 opacity-20" />
              <p className="text-sm">No feedback for this category</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-white/06">
                {feedback.map(f => {
                  const catClass = CAT_COLORS[f.category] ?? CAT_COLORS.general
                  return (
                    <div key={f.id} className="px-5 py-4 hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${catClass}`}>{f.category}</span>
                            {f.rating !== null && (
                              <span className="text-xs text-muted-foreground">⭐ {f.rating}/5</span>
                            )}
                            <span className="text-xs text-muted-foreground/40">{f.username ?? 'Anonymous'}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{f.message}</p>
                        </div>
                        <span className="text-xs text-muted-foreground/40 shrink-0 whitespace-nowrap">{timeAgo(f.created_at)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
              {fbTotal > PER_PAGE && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-white/07">
                  <span className="text-xs text-muted-foreground">{fbTotal} total</span>
                  <div className="flex gap-2">
                    <button onClick={() => setFbPage(p => Math.max(1, p - 1))} disabled={fbPage === 1}
                      className="px-3 py-1 text-xs rounded border border-white/10 text-muted-foreground hover:text-foreground disabled:opacity-30">Prev</button>
                    <span className="px-2 py-1 text-xs text-muted-foreground">Page {fbPage} of {Math.ceil(fbTotal / PER_PAGE)}</span>
                    <button onClick={() => setFbPage(p => p + 1)} disabled={fbPage >= Math.ceil(fbTotal / PER_PAGE)}
                      className="px-3 py-1 text-xs rounded border border-white/10 text-muted-foreground hover:text-foreground disabled:opacity-30">Next</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

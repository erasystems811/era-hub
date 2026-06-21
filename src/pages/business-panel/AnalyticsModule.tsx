import { useState, useEffect } from 'react'
import { MessageSquare, Bot, UserCheck, Clock, Mic, Zap } from 'lucide-react'
import { bizApi, type BizAnalytics } from './business-api'

const PERIODS = ['today', 'this_week', 'this_month', 'last_month'] as const
type Period = typeof PERIODS[number]

const PERIOD_LABELS: Record<Period, string> = {
  today: 'Today',
  this_week: 'This week',
  this_month: 'This month',
  last_month: 'Last month',
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ComponentType<{ className?: string }>
  label: string; value: string; sub?: string; color?: string
}) {
  return (
    <div className="p-5 rounded-xl border border-white/[0.07] bg-card">
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-lg bg-white/[0.04] flex items-center justify-center">
          <Icon className="w-4 h-4" style={{ color: color ?? 'var(--foreground)' }} />
        </div>
      </div>
      <p className="text-2xl font-bold" style={{ color: color ?? 'var(--foreground)' }}>{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
      {sub && <p className="text-[10px] text-muted-foreground/50 mt-0.5">{sub}</p>}
    </div>
  )
}

export function AnalyticsModule() {
  const [period, setPeriod]     = useState<Period>('this_month')
  const [data, setData]         = useState<BizAnalytics | null>(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    bizApi.getAnalytics(period)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [period])

  const pct = (n: number, total: number) => total === 0 ? 0 : Math.round((n / total) * 100)
  const currentHour = new Date().getHours()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Analytics</h2>
          <p className="text-sm text-muted-foreground mt-1">How your AI is performing</p>
        </div>
        {/* Period selector */}
        <div className="flex rounded-xl border border-white/[0.08] overflow-hidden">
          {PERIODS.map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-2 text-xs font-semibold transition-colors ${
                period === p ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.03]'
              }`}>
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="text-center py-16 text-muted-foreground text-sm">Loading analytics...</div>
      ) : data ? (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <StatCard icon={MessageSquare} label="Total messages received" value={data.totalMessages.toLocaleString()} />
            <StatCard icon={Bot} label="Messages AI handled"
              value={data.aiHandled.toLocaleString()}
              sub={`${pct(data.aiHandled, data.totalMessages)}% of total`}
              color="#4AA89D" />
            <StatCard icon={UserCheck} label="Handed off to human"
              value={data.humanHandoffs.toLocaleString()}
              color="#F59E0B" />
            <StatCard icon={Clock} label="Avg response time"
              value={`${data.avgResponseSeconds}s`} />
            <StatCard icon={Mic} label="Voice notes received"
              value={data.voiceNotesCount.toLocaleString()}
              color="#BF7C93" />
            <StatCard icon={Zap} label="Top scenario"
              value={data.topScenario ?? 'None'} />
          </div>

          {/* Usage progress */}
          {data.usage && (
            <div className="p-5 rounded-xl border border-white/[0.07] bg-card">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">Message usage</p>
                <p className="text-xs text-muted-foreground">
                  {data.usage.limit != null ? `${data.usage.limit.toLocaleString()} / month` : 'Unlimited'}
                </p>
              </div>
              <div className="flex items-end justify-between mb-2">
                <span className="text-lg font-bold text-foreground">{data.usage.used.toLocaleString()} used</span>
                {data.usage.limit != null && (
                  <span className="text-sm text-muted-foreground">{(data.usage.limit - data.usage.used).toLocaleString()} remaining</span>
                )}
              </div>
              {data.usage.limit != null && (() => {
                const p = pct(data.usage.used, data.usage.limit)
                const color = p > 90 ? '#EF4444' : p > 70 ? '#F59E0B' : '#4AA89D'
                return (
                  <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(p, 100)}%`, background: color }} />
                  </div>
                )
              })()}
            </div>
          )}

          {/* Two-col layout: top questions + handoff reasons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top questions */}
            <div className="p-5 rounded-xl border border-white/[0.07] bg-card">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground mb-4">Most asked questions</p>
              {data.topQuestions.length === 0 ? (
                <p className="text-xs text-muted-foreground">No data yet</p>
              ) : (
                <div className="space-y-3">
                  {data.topQuestions.slice(0, 5).map((q, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-[10px] font-bold text-muted-foreground/40 w-4 shrink-0 mt-0.5">{i + 1}</span>
                      <p className="text-sm text-foreground flex-1 min-w-0">{q.question}</p>
                      <span className="text-xs text-muted-foreground shrink-0">{q.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Handoff reasons */}
            <div className="p-5 rounded-xl border border-white/[0.07] bg-card">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground mb-4">Handoff reasons</p>
              {data.handoffReasons.length === 0 ? (
                <p className="text-xs text-muted-foreground">No handoffs {PERIOD_LABELS[period].toLowerCase()}</p>
              ) : (
                <div className="space-y-2.5">
                  {data.handoffReasons.map((r, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <p className="text-sm text-foreground">{r.reason}</p>
                      <span className="text-sm font-semibold text-foreground">{r.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Busiest hours — CSS bar chart */}
          <div className="p-5 rounded-xl border border-white/[0.07] bg-card">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground mb-5">Busiest hours</p>
            {data.messagesByHour.length === 0 ? (
              <p className="text-xs text-muted-foreground">No data yet</p>
            ) : (() => {
              const max = Math.max(...data.messagesByHour, 1)
              return (
                <div>
                  <div className="flex items-end gap-[3px] h-20">
                    {data.messagesByHour.map((v, h) => {
                      const heightPct = Math.max((v / max) * 100, 2)
                      const isCurrent = h === currentHour
                      return (
                        <div key={h} className="flex-1 flex items-end" title={`${h}:00 — ${v} messages`}>
                          <div
                            className="w-full rounded-t-sm transition-all"
                            style={{
                              height: `${heightPct}%`,
                              background: isCurrent ? '#BF7C93' : 'rgba(255,255,255,0.08)',
                            }}
                          />
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground/40">
                    <span>12am</span><span>6am</span><span>12pm</span><span>6pm</span><span>11pm</span>
                  </div>
                </div>
              )
            })()}
          </div>
        </>
      ) : null}
    </div>
  )
}

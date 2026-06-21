import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, CreditCard, Loader2, TrendingUp, Users, MessageSquare, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { eventsApi, UsageRecord } from '../../lib/events-api'
import { commsApi, Plan } from '../../lib/comms-api'
import { fmtNumber } from '../../lib/utils'

function periodLabel(period: string) {
  const [y, m] = period.split('-')
  return new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

function currentPeriod() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function offsetPeriod(period: string, delta: number) {
  const [y, m] = period.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function fmtVoice(secs: number) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

export function Billing() {
  const navigate = useNavigate()
  const [period, setPeriod] = useState(currentPeriod)
  const [usage, setUsage] = useState<UsageRecord[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    Promise.allSettled([
      eventsApi.listUsage(period),
      commsApi.listPlans(),
    ]).then(([usageResult, plansResult]) => {
      if (usageResult.status === 'fulfilled') setUsage(usageResult.value)
      else setUsage([]) // usage endpoint not yet live — show zeros
      if (plansResult.status === 'fulfilled') setPlans(plansResult.value)
      else setError(plansResult.reason instanceof Error ? plansResult.reason.message : 'Failed to load plans')
    }).finally(() => setLoading(false))
  }, [period])

  const isCurrentPeriod = period === currentPeriod()

  // ── Derived stats ────────────────────────────────────────────────────────────

  const planMap = Object.fromEntries(plans.map(p => [p.name, p]))

  const mrr = plans
    .filter(p => p.billingModel === 'plan_based' && p.monthlyFee)
    .reduce((s, p) => s + (p.monthlyFee ?? 0) * p.clientCount, 0)

  const usageRevenue = usage
    .filter(u => {
      const plan = planMap[u.planName]
      return plan?.billingModel === 'usage_based'
    })
    .reduce((s, u) => s + (u.estimatedCost ?? 0), 0)

  const totalMessages = usage.reduce((s, u) => s + u.messagesIn + u.messagesOut, 0)
  const activeCount = usage.length

  // ── By-plan breakdown ────────────────────────────────────────────────────────

  const byPlan: Record<string, { plan: Plan; records: UsageRecord[] }> = {}
  for (const u of usage) {
    const plan = planMap[u.planName]
    if (!plan) continue
    if (!byPlan[u.planName]) byPlan[u.planName] = { plan, records: [] }
    byPlan[u.planName].records.push(u)
  }

  const planRows = Object.values(byPlan).sort((a, b) => b.records.length - a.records.length)

  // ── Top consumers ────────────────────────────────────────────────────────────

  const topConsumers = [...usage]
    .sort((a, b) => (b.messagesIn + b.messagesOut) - (a.messagesIn + a.messagesOut))
    .slice(0, 10)

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Billing</h1>
          <p className="caption mt-0.5">Revenue, consumption, and subscription monitoring</p>
        </div>
        {/* Period selector */}
        <div className="flex items-center gap-1 rounded-xl border border-white/[0.07] bg-card px-1 py-1 shrink-0">
          <button
            onClick={() => setPeriod(p => offsetPeriod(p, -1))}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/07 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-foreground px-2 min-w-[130px] text-center">
            {periodLabel(period)}
          </span>
          <button
            onClick={() => setPeriod(p => offsetPeriod(p, 1))}
            disabled={isCurrentPeriod}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/07 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Stat strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: TrendingUp,    label: 'Total MRR',         value: loading ? '—' : `₦${fmtNumber(Math.round(mrr))}`,          color: 'text-primary' },
          { icon: CreditCard,    label: 'Usage Revenue',     value: loading ? '—' : `₦${fmtNumber(Math.round(usageRevenue))}`, color: 'text-foreground' },
          { icon: Users,         label: 'Active Businesses', value: loading ? '—' : activeCount.toString(),                     color: 'text-teal' },
          { icon: MessageSquare, label: 'Messages this month', value: loading ? '—' : fmtNumber(totalMessages),                color: 'text-foreground' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="rounded-xl border border-white/[0.07] bg-card px-5 py-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-3.5 h-3.5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
            <p className={`text-2xl font-bold tabular-nums ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading billing data…
        </div>
      ) : usage.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.07] bg-card flex flex-col items-center justify-center py-16 gap-3">
          <CreditCard className="w-10 h-10 text-muted-foreground/20" />
          <p className="font-semibold text-foreground">No usage data for {periodLabel(period)}</p>
          <p className="caption text-sm">Usage records are collected as businesses send messages. The usage API endpoint may not be active yet.</p>
        </div>
      ) : (
        <>
          {/* By-plan breakdown */}
          {planRows.length > 0 && (
            <div className="rounded-2xl border border-white/[0.07] bg-card overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.07]">
                <h2 className="text-sm font-semibold text-foreground">By Plan</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" style={{ minWidth: 560 }}>
                  <thead>
                    <tr className="border-b border-white/[0.05]">
                      {['Plan', 'Businesses', 'MRR', 'Avg msgs / business', 'Total messages'].map(h => (
                        <th key={h} className="text-left text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground px-5 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {planRows.map(({ plan, records }, i) => {
                      const totalMsgs = records.reduce((s, r) => s + r.messagesIn + r.messagesOut, 0)
                      const avg = records.length > 0 ? Math.round(totalMsgs / records.length) : 0
                      const planMrr = plan.billingModel === 'plan_based' && plan.monthlyFee
                        ? plan.monthlyFee * plan.clientCount : 0
                      return (
                        <tr key={plan.id}
                          className={`border-b border-white/[0.04] last:border-0 ${i % 2 === 1 ? 'bg-white/[0.015]' : ''}`}>
                          <td className="px-5 py-3.5">
                            <p className="font-semibold text-foreground">{plan.displayName}</p>
                            <p className="text-xs text-muted-foreground capitalize">{plan.billingModel.replace('_', ' ')}</p>
                          </td>
                          <td className="px-5 py-3.5 font-medium text-foreground tabular-nums">{records.length}</td>
                          <td className="px-5 py-3.5 font-medium text-primary tabular-nums">
                            {planMrr > 0 ? `₦${fmtNumber(planMrr)}` : <span className="text-muted-foreground text-xs">—</span>}
                          </td>
                          <td className="px-5 py-3.5 text-foreground tabular-nums">{fmtNumber(avg)}</td>
                          <td className="px-5 py-3.5 font-semibold text-foreground tabular-nums">{fmtNumber(totalMsgs)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Top consumers */}
          <div className="rounded-2xl border border-white/[0.07] bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.07]">
              <h2 className="text-sm font-semibold text-foreground">Top Consumers</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ minWidth: 680 }}>
                <thead>
                  <tr className="border-b border-white/[0.05]">
                    {['Business', 'Plan', 'Msgs In', 'Msgs Out', 'Voice', 'AI Tokens', 'Est. Cost', ''].map(h => (
                      <th key={h} className="text-left text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground px-5 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {topConsumers.map(u => (
                    <tr key={u.businessId} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.025] transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                            {u.businessName[0]?.toUpperCase()}
                          </div>
                          <span className="font-semibold text-foreground truncate max-w-[140px]">{u.businessName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground text-xs capitalize">{u.planName}</td>
                      <td className="px-5 py-3.5 text-foreground tabular-nums">{fmtNumber(u.messagesIn)}</td>
                      <td className="px-5 py-3.5 text-foreground tabular-nums">{fmtNumber(u.messagesOut)}</td>
                      <td className="px-5 py-3.5 text-foreground tabular-nums text-xs">{fmtVoice(u.voiceNotesCount * 30)}</td>
                      <td className="px-5 py-3.5 text-foreground tabular-nums">{fmtNumber(u.aiTokensUsed)}</td>
                      <td className="px-5 py-3.5 font-medium text-primary tabular-nums">
                        {u.estimatedCost != null ? `₦${fmtNumber(Math.round(u.estimatedCost))}` : '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => navigate(`/comms/billing/${u.businessId}`)}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                        >
                          View <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Usage trends placeholder */}
          <div className="rounded-2xl border border-white/[0.07] bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground mb-1">Usage Trends</h2>
            <p className="text-xs text-muted-foreground mb-4">Daily breakdown available in Event Log</p>
            <div className="flex items-end gap-1 h-16">
              {Array.from({ length: 28 }, (_, i) => {
                const h = 20 + Math.round(Math.random() * 80)
                return (
                  <div
                    key={i}
                    className="flex-1 rounded-sm bg-primary/20 hover:bg-primary/40 transition-colors"
                    style={{ height: `${h}%` }}
                    title={`Day ${i + 1}`}
                  />
                )
              })}
            </div>
            <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground/40">
              <span>1</span><span>7</span><span>14</span><span>21</span><span>28</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

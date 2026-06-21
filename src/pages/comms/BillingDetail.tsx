import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, AlertTriangle, CheckCircle, XCircle, MessageSquare, Mic, CreditCard, TrendingDown } from 'lucide-react'
import { commsApi, ClientDetail } from '../../lib/comms-api'
import { eventsApi, UsageRecord } from '../../lib/events-api'
import { fmtNumber } from '../../lib/utils'

function currentPeriod() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function last6Periods() {
  const periods: string[] = []
  for (let i = 0; i < 6; i++) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    periods.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return periods
}

function periodLabel(period: string) {
  const [y, m] = period.split('-')
  return new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
}

function fmtVoice(secs: number) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

export function BillingDetail() {
  const { clientId } = useParams<{ clientId: string }>()
  const navigate = useNavigate()

  const [client, setClient] = useState<ClientDetail | null>(null)
  const [currentUsage, setCurrentUsage] = useState<UsageRecord | null>(null)
  const [history, setHistory] = useState<(UsageRecord | null)[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!clientId) return
    setLoading(true)
    const periods = last6Periods()
    Promise.allSettled([
      commsApi.getClient(clientId),
      eventsApi.getBusinessUsage(clientId, currentPeriod()).catch(() => null),
      ...periods.slice(0).map(p => eventsApi.getBusinessUsage(clientId, p).catch(() => null)),
    ]).then(([clientResult, curResult, ...histResults]) => {
      if (clientResult.status === 'fulfilled') setClient(clientResult.value as ClientDetail)
      else { setError(clientResult.reason instanceof Error ? clientResult.reason.message : 'Failed to load client'); return }
      if (curResult.status === 'fulfilled') setCurrentUsage(curResult.value as UsageRecord | null)
      setHistory(histResults.map(r => r.status === 'fulfilled' ? r.value as UsageRecord | null : null))
    }).finally(() => setLoading(false))
  }, [clientId])

  const period = currentPeriod()
  const planLimit = currentUsage?.planLimit ?? client?.plan?.limits?.monthlyMessages ?? null
  const msgsOut = currentUsage?.messagesOut ?? 0
  const pct = planLimit ? (msgsOut / planLimit) * 100 : null

  const limitStatus = pct == null
    ? 'none'
    : pct >= 100 ? 'critical'
    : pct >= 80  ? 'warning'
    : 'ok'

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/comms/billing')}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/07 transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="page-title">{client?.name ?? 'Business'}</h1>
            {client && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(191,124,147,0.12)', color: '#BF7C93' }}>
                {client.planName}
              </span>
            )}
            {client && !client.active && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
                Suspended
              </span>
            )}
          </div>
          <p className="caption">{periodLabel(period)}</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      ) : (
        <>
          {/* Stat strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: MessageSquare, label: 'Messages In',   value: fmtNumber(currentUsage?.messagesIn ?? 0),  color: 'text-foreground' },
              { icon: MessageSquare, label: 'Messages Out',  value: fmtNumber(currentUsage?.messagesOut ?? 0), color: 'text-foreground' },
              { icon: Mic,           label: 'Voice Notes',   value: fmtVoice((currentUsage?.voiceNotesCount ?? 0) * 30), color: 'text-teal' },
              { icon: CreditCard,    label: 'Est. Cost',     value: currentUsage?.estimatedCost != null ? `₦${fmtNumber(Math.round(currentUsage.estimatedCost))}` : '—', color: 'text-primary' },
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

          {/* Limit warning */}
          {limitStatus === 'critical' && (
            <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3">
              <XCircle className="w-4 h-4 text-destructive shrink-0" />
              <p className="text-sm text-destructive font-medium">
                Message limit exceeded — {pct!.toFixed(0)}% of {fmtNumber(planLimit!)} monthly messages used
              </p>
            </div>
          )}
          {limitStatus === 'warning' && (
            <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <p className="text-sm text-amber-300 font-medium">
                Approaching limit — {pct!.toFixed(0)}% of {fmtNumber(planLimit!)} monthly messages used
              </p>
            </div>
          )}
          {limitStatus === 'ok' && (
            <div className="flex items-center gap-3 rounded-xl border border-teal/20 bg-teal/10 px-4 py-3">
              <CheckCircle className="w-4 h-4 text-teal shrink-0" />
              <p className="text-sm text-teal font-medium">
                {pct!.toFixed(0)}% of {fmtNumber(planLimit!)} monthly messages used — on track
              </p>
            </div>
          )}
          {limitStatus === 'none' && (
            <div className="flex items-center gap-3 rounded-xl border border-teal/20 bg-teal/10 px-4 py-3">
              <CheckCircle className="w-4 h-4 text-teal shrink-0" />
              <p className="text-sm text-teal font-medium">No message cap — unlimited plan</p>
            </div>
          )}

          {/* Monthly history */}
          <div className="rounded-2xl border border-white/[0.07] bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.07]">
              <h2 className="text-sm font-semibold text-foreground">Monthly History</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ minWidth: 540 }}>
                <thead>
                  <tr className="border-b border-white/[0.05]">
                    {['Month', 'Msgs In', 'Msgs Out', 'Voice', 'AI Tokens', 'Cost'].map(h => (
                      <th key={h} className="text-left text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground px-5 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {last6Periods().map((p, i) => {
                    const rec = history[i]
                    return (
                      <tr key={p} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]">
                        <td className="px-5 py-3.5 font-medium text-foreground">
                          {periodLabel(p)}
                          {p === currentPeriod() && (
                            <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-primary">current</span>
                          )}
                        </td>
                        {rec ? (
                          <>
                            <td className="px-5 py-3.5 tabular-nums text-foreground">{fmtNumber(rec.messagesIn)}</td>
                            <td className="px-5 py-3.5 tabular-nums text-foreground">{fmtNumber(rec.messagesOut)}</td>
                            <td className="px-5 py-3.5 tabular-nums text-foreground text-xs">{fmtVoice(rec.voiceNotesCount * 30)}</td>
                            <td className="px-5 py-3.5 tabular-nums text-foreground">{fmtNumber(rec.aiTokensUsed)}</td>
                            <td className="px-5 py-3.5 tabular-nums font-medium text-primary">
                              {rec.estimatedCost != null ? `₦${fmtNumber(Math.round(rec.estimatedCost))}` : '—'}
                            </td>
                          </>
                        ) : (
                          <td colSpan={5} className="px-5 py-3.5 text-muted-foreground text-xs">No data</td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Plan details */}
          {client?.plan && (
            <div className="rounded-2xl border border-white/[0.07] bg-card p-5">
              <h2 className="text-sm font-semibold text-foreground mb-4">Plan Details</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  ['Plan name',      client.plan.displayName],
                  ['Billing model',  client.plan.billingModel.replace('_', ' ')],
                  ['Monthly fee',    client.plan.monthlyFee ? `₦${fmtNumber(client.plan.monthlyFee)}` : 'Free'],
                  ['Monthly limit',  client.plan.limits.monthlyMessages ? fmtNumber(client.plan.limits.monthlyMessages) : 'Unlimited'],
                  ['Daily limit',    client.plan.limits.dailyMessages    ? fmtNumber(client.plan.limits.dailyMessages)   : 'Unlimited'],
                  ['Max sessions',   client.plan.limits.maxSessions      ? String(client.plan.limits.maxSessions)        : 'Unlimited'],
                ].map(([label, val]) => (
                  <div key={label}>
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-1">{label}</p>
                    <p className="text-sm text-foreground capitalize">{val}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

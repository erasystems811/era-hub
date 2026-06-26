import { useEffect, useState } from 'react'
import { Loader2, DollarSign, TrendingUp, Users, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { subscriptionApi, type Subscription, type RevenueSnapshot } from '../../lib/comms-api'
import { useToast } from '../../components/Toast'

const STATUS_COLOURS: Record<string, string> = {
  active:    'bg-teal/15 text-teal',
  trial:     'bg-blue-500/15 text-blue-400',
  past_due:  'bg-yellow-500/15 text-yellow-400',
  cancelled: 'bg-white/10 text-white/40',
  suspended: 'bg-red-500/15 text-red-400',
}

export function Revenue() {
  const showToast = useToast()
  const [subs, setSubs]         = useState<Subscription[]>([])
  const [revenue, setRevenue]   = useState<RevenueSnapshot | null>(null)
  const [loading, setLoading]   = useState(true)

  async function load() {
    setLoading(true)
    try {
      const [s, r] = await Promise.all([subscriptionApi.list(), subscriptionApi.revenue()])
      setSubs(s); setRevenue(r)
    } catch (e) {
      showToast((e as Error).message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const fmt = (n: number, currency = 'NGN') =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(196,40,111,0.15)' }}>
          <DollarSign className="w-4 h-4" style={{ color: '#C4286F' }} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">Revenue</h1>
          <p className="text-xs text-muted-foreground">Subscriptions and MRR</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          {/* KPI cards */}
          {revenue && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: <TrendingUp className="w-4 h-4" />, label: 'MRR', value: fmt(revenue.mrr) },
                { icon: <CheckCircle2 className="w-4 h-4 text-teal" />, label: 'Active', value: String(revenue.activeSubscriptions) },
                { icon: <Clock className="w-4 h-4 text-blue-400" />, label: 'Trial', value: String(revenue.trialSubscriptions) },
                { icon: <Users className="w-4 h-4" />, label: 'Total', value: String(subs.length) },
              ].map(k => (
                <div key={k.label} className="rounded-2xl border border-white/06 bg-card p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">{k.icon}<span className="text-[10px] uppercase tracking-wider font-bold">{k.label}</span></div>
                  <div className="text-xl font-bold text-foreground">{k.value}</div>
                </div>
              ))}
            </div>
          )}

          {/* By plan */}
          {revenue && revenue.byPlan.length > 0 && (
            <div className="rounded-2xl border border-white/06 bg-card p-5">
              <h2 className="text-sm font-semibold text-foreground mb-3">Subscribers by Plan</h2>
              <div className="space-y-2">
                {revenue.byPlan.map(p => (
                  <div key={p.planName} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-32 truncate">{p.planName}</span>
                    <div className="flex-1 bg-white/05 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full"
                        style={{ width: `${Math.max(4, (p.count / revenue.activeSubscriptions) * 100)}%`, background: '#C4286F' }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-foreground w-6 text-right">{p.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subscription list */}
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">All Subscriptions</h2>
            {subs.length === 0 ? (
              <div className="text-center py-10">
                <DollarSign className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No subscriptions yet</p>
              </div>
            ) : subs.map(s => (
              <div key={s.id} className="rounded-xl border border-white/06 bg-card p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-foreground">{s.clientName}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_COLOURS[s.status] ?? 'bg-white/10 text-white/50'}`}>
                      {s.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{s.planName}</span>
                    {s.amount != null && (
                      <span className="text-xs font-semibold text-foreground">
                        {fmt(s.amount, s.currency)}
                      </span>
                    )}
                    {s.trialEndsAt && s.status === 'trial' && (
                      <span className="text-xs text-blue-400">
                        trial ends {new Date(s.trialEndsAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

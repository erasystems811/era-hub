import { useEffect, useState } from 'react'
import { Layers, CheckCircle, XCircle } from 'lucide-react'
import { Glass } from '../../components/Glass'
import { commsApi, Plan } from '../../lib/comms-api'

const PLAN_ICONS: Record<string, string> = {
  internal: '🔑', starter: '🌱', professional: '⚡', enterprise: '🏆',
}

export function Plans() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void commsApi.listPlans().then(setPlans).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-16 text-charcoal-soft">Loading…</div>

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="page-title">Plans</h1>
        <p className="caption mt-0.5">{plans.length} plans available</p>
      </div>

      {plans.length === 0 ? (
        <Glass className="text-center py-12">
          <Layers className="w-10 h-10 text-pink mx-auto mb-3 opacity-40" />
          <p className="font-medium text-charcoal">No plans configured</p>
        </Glass>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {plans.map(p => (
            <Glass key={p.id} className={!p.active ? 'opacity-50' : ''}>
              <div className="flex items-start gap-3 mb-4">
                <div className="text-2xl">{PLAN_ICONS[p.name.toLowerCase()] ?? '📦'}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-charcoal capitalize">{p.name}</h3>
                    {p.active
                      ? <CheckCircle className="w-4 h-4 text-teal" />
                      : <XCircle className="w-4 h-4 text-charcoal-soft opacity-40" />
                    }
                  </div>
                  <div className="text-sm font-semibold text-teal mt-0.5">
                    {p.priceMonthly === 0 ? 'Free' : `₦${p.priceMonthly.toLocaleString()}/month`}
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-charcoal-soft">Monthly messages</span>
                  <span className="font-medium text-charcoal">
                    {p.monthlyMessageLimit ? p.monthlyMessageLimit.toLocaleString() : 'Unlimited'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal-soft">WhatsApp sessions</span>
                  <span className="font-medium text-charcoal">
                    {p.maxSessions ?? 'Unlimited'}
                  </span>
                </div>
                {Object.entries(p.features ?? {}).map(([key, val]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-charcoal-soft capitalize">{key.replace(/_/g, ' ')}</span>
                    {typeof val === 'boolean'
                      ? val
                        ? <CheckCircle className="w-4 h-4 text-teal" />
                        : <XCircle className="w-4 h-4 text-charcoal-soft opacity-30" />
                      : <span className="font-medium text-charcoal">{String(val)}</span>
                    }
                  </div>
                ))}
              </div>

              {!p.active && (
                <div className="mt-3 text-xs text-charcoal-soft border-t border-pink-border pt-2">
                  This plan is not available to new customers
                </div>
              )}
            </Glass>
          ))}
        </div>
      )}
    </div>
  )
}

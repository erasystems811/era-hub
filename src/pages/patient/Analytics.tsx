import { useEffect, useState } from 'react'
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import { Glass } from '../../components/Glass'
import { patientApi, HealthCheck, Hospital } from '../../lib/patient-api'
import { fmtMoney } from '../../lib/utils'

export function Analytics() {
  const [health, setHealth] = useState<HealthCheck | null>(null)
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void Promise.all([
      patientApi.getHealth().catch(() => null),
      patientApi.listHospitals().catch(() => []),
    ]).then(([h, hs]) => {
      setHealth(h)
      setHospitals(hs ?? [])
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-16 text-charcoal-soft">Loading…</div>

  const active = hospitals.filter(h => h.active).length
  const byStatus = hospitals.reduce((acc, h) => {
    acc[h.subscriptionStatus] = (acc[h.subscriptionStatus] ?? 0) + 1; return acc
  }, {} as Record<string, number>)
  const totalWallet = hospitals.reduce((sum, h) => sum + (h.walletBalanceKobo ?? 0), 0)
  const totalPatients = hospitals.reduce((sum, h) => sum + h.patientCount, 0)

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="page-title">Analytics</h1>
        <p className="caption mt-0.5">ERA Patient — system overview</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total hospitals', value: hospitals.length.toString() },
          { label: 'Active', value: active.toString() },
          { label: 'Total patients', value: totalPatients.toLocaleString() },
          { label: 'Total wallet balance', value: fmtMoney(totalWallet) },
        ].map(s => (
          <Glass key={s.label} sm className="!p-4">
            <div className="text-2xl font-semibold text-charcoal">{s.value}</div>
            <div className="text-xs text-charcoal-soft mt-0.5">{s.label}</div>
          </Glass>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Health checks */}
        <Glass>
          <h3 className="section-title mb-4">System health</h3>
          {!health ? (
            <p className="caption">Unable to reach the system health endpoint</p>
          ) : (
            <div className="space-y-2">
              {health.checks.map(c => (
                <div key={c.name} className="flex items-start gap-2.5 py-2 border-b border-pink-border last:border-0">
                  {c.ok
                    ? <CheckCircle className="w-4 h-4 text-teal shrink-0 mt-0.5" />
                    : c.warning
                    ? <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    : <XCircle className="w-4 h-4 text-rose shrink-0 mt-0.5" />
                  }
                  <div>
                    <div className="text-sm font-medium text-charcoal">{c.name}</div>
                    <div className="text-xs text-charcoal-soft">{c.detail}</div>
                    {c.balance && <div className="text-xs text-teal">{c.balance}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Glass>

        {/* Subscription breakdown */}
        <Glass>
          <h3 className="section-title mb-4">Subscriptions</h3>
          <div className="space-y-3">
            {Object.entries(byStatus).map(([status, count]) => (
              <div key={status} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: status === 'active' ? '#4A9BA8' : status === 'trial' ? '#F59E0B' : '#D05080' }} />
                <span className="text-sm text-charcoal capitalize flex-1">{status}</span>
                <span className="text-sm font-semibold text-charcoal">{count}</span>
                <div className="w-24 h-1.5 rounded-full bg-pink-light overflow-hidden">
                  <div className="h-full rounded-full bg-teal"
                    style={{ width: `${(count / hospitals.length) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>

          {hospitals.length > 0 && (
            <div className="mt-5 pt-4 border-t border-pink-border">
              <h4 className="text-xs font-medium text-charcoal-soft mb-3">Largest wallets</h4>
              {hospitals
                .filter(h => h.walletBalanceKobo)
                .sort((a, b) => (b.walletBalanceKobo ?? 0) - (a.walletBalanceKobo ?? 0))
                .slice(0, 5)
                .map(h => (
                  <div key={h.id} className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-charcoal truncate">{h.name}</span>
                    <span className="text-sm font-medium text-charcoal-soft">{fmtMoney(h.walletBalanceKobo)}</span>
                  </div>
                ))
              }
            </div>
          )}
        </Glass>
      </div>
    </div>
  )
}

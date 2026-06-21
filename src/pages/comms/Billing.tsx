import { useEffect, useState } from 'react'
import { CreditCard } from 'lucide-react'
import { Glass } from '../../components/Glass'
import { commsApi, Client } from '../../lib/comms-api'
import { fmtNumber } from '../../lib/utils'

export function Billing() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void commsApi.listClients().then(setClients).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-16 text-charcoal-soft">Loading…</div>

  const totalMessages = clients.reduce((s, c) => s + c.monthlyMessageCount, 0)
  const active = clients.filter(c => c.active).length

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="page-title">Billing & Usage</h1>
        <p className="caption mt-0.5">Monthly usage across all businesses</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Active businesses', value: active.toString() },
          { label: 'Total messages this month', value: fmtNumber(totalMessages) },
          { label: 'Total businesses', value: clients.length.toString() },
        ].map(s => (
          <Glass key={s.label} sm className="!p-4">
            <div className="text-2xl font-semibold text-charcoal">{s.value}</div>
            <div className="text-xs text-charcoal-soft mt-0.5">{s.label}</div>
          </Glass>
        ))}
      </div>

      {clients.length === 0 ? (
        <Glass className="text-center py-12">
          <CreditCard className="w-10 h-10 text-pink mx-auto mb-3 opacity-40" />
          <p className="font-medium text-charcoal">No businesses yet</p>
        </Glass>
      ) : (
        <Glass className="overflow-hidden" style={{ padding: 0 }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(233,145,200,0.2)' }}>
                {['Business', 'Plan', 'Status', 'Messages this month'].map(h => (
                  <th key={h} className="text-left text-xs text-charcoal-soft font-medium px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients
                .sort((a, b) => b.monthlyMessageCount - a.monthlyMessageCount)
                .map(c => (
                  <tr key={c.id} className="border-b border-pink-border last:border-0">
                    <td className="px-4 py-3 font-medium text-charcoal">{c.name}</td>
                    <td className="px-4 py-3 capitalize text-charcoal-soft">{c.planName}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${c.active ? 'text-teal' : 'text-rose'}`}>
                        {c.active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-charcoal">{fmtNumber(c.monthlyMessageCount)}</span>
                        {totalMessages > 0 && (
                          <div className="flex-1 max-w-[120px] h-1.5 rounded-full bg-pink-light overflow-hidden">
                            <div className="h-full rounded-full bg-teal" style={{ width: `${(c.monthlyMessageCount / totalMessages) * 100}%` }} />
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </Glass>
      )}
    </div>
  )
}

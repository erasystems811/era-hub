import { useEffect, useState } from 'react'
import { CreditCard, Loader2 } from 'lucide-react'
import { commsApi, Client } from '../../lib/comms-api'
import { fmtNumber } from '../../lib/utils'
import { pageCache } from '../../lib/cache'

export function Billing() {
  const [clients, setClients] = useState<Client[]>(() => pageCache.get<Client[]>('comms:clients') ?? [])
  const [loading, setLoading] = useState(() => !pageCache.get('comms:clients'))

  useEffect(() => {
    void commsApi.listClients().then(data => {
      pageCache.set('comms:clients', data)
      setClients(data)
    }).finally(() => setLoading(false))
  }, [])

  const totalMessages = clients.reduce((s, c) => s + c.monthlyMessageCount, 0)
  const active = clients.filter(c => c.active).length
  const sorted = [...clients].sort((a, b) => b.monthlyMessageCount - a.monthlyMessageCount)

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="page-title">Billing & Usage</h1>
        <p className="caption mt-0.5">Monthly usage across all businesses</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Active businesses',          value: loading ? '—' : active.toString(),              color: 'text-teal' },
          { label: 'Messages this month',         value: loading ? '—' : fmtNumber(totalMessages),       color: 'text-foreground' },
          { label: 'Total businesses',            value: loading ? '—' : clients.length.toString(),      color: 'text-foreground' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-white/08 bg-card px-5 py-4">
            <p className="text-xs text-muted-foreground font-medium mb-1">{s.label}</p>
            <p className={`text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading billing data…
        </div>
      ) : clients.length === 0 ? (
        <div className="rounded-2xl border border-white/07 bg-card flex flex-col items-center justify-center py-16 gap-3">
          <CreditCard className="w-10 h-10 text-muted-foreground/20" />
          <p className="font-semibold text-foreground">No businesses yet</p>
          <p className="caption text-sm">Billing data will appear once businesses are onboarded</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/07 bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/07">
                {['Business', 'Plan', 'Status', 'Messages this month', 'Share'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-5 py-3.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/05">
              {sorted.map(c => {
                const pct = totalMessages > 0 ? (c.monthlyMessageCount / totalMessages) * 100 : 0
                return (
                  <tr key={c.id} className="hover:bg-white/[0.025] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                          {c.name[0]?.toUpperCase()}
                        </div>
                        <p className="font-semibold text-foreground truncate max-w-[180px]">{c.name}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground capitalize text-xs">{c.planName}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-semibold ${c.active ? 'text-teal' : 'text-red-400'}`}>
                        {c.active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-foreground tabular-nums">
                      {fmtNumber(c.monthlyMessageCount)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex-1 max-w-[100px] h-1.5 rounded-full bg-white/08 overflow-hidden">
                          <div className="h-full rounded-full bg-primary/60" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums shrink-0">{pct.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

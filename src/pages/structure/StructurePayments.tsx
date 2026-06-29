import { useEffect, useState } from 'react'
import { structureApi, Payment } from '../../lib/structure-api'
import { TrendingUp } from 'lucide-react'

const STATUS_STYLE: Record<string, string> = {
  successful: 'bg-[#4DBFB3]/10 text-[#4DBFB3]',
  pending:    'bg-[#C9952B]/10 text-[#C9952B]',
  failed:     'bg-red-500/10 text-red-400',
}

export function StructurePayments() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    structureApi.listPayments()
      .then(setPayments)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const successful = payments.filter(p => p.status === 'successful')
  const totalRevenue = successful.reduce((s, p) => s + p.amount, 0)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground">Payments</h1>
          <p className="text-xs text-muted-foreground/50 mt-0.5">All unlock payment transactions</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#4DBFB3]/20 bg-[#4DBFB3]/5">
          <TrendingUp className="w-4 h-4 text-[#4DBFB3]" />
          <div>
            <p className="text-[10px] text-muted-foreground/40 uppercase tracking-wider">Total Revenue</p>
            <p className="text-base font-bold text-[#4DBFB3] tabular-nums">₦{totalRevenue.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {error && <div className="text-sm text-red-400 bg-red-500/5 border border-red-500/20 rounded-lg px-4 py-3">{error}</div>}

      <div className="rounded-xl border border-white/08 bg-white/[0.03] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground/40">Loading…</div>
        ) : payments.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground/40">No payment transactions yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/07">
                {['Business', 'Owner', 'Amount', 'Status', 'Reference', 'Date'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground/40 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/05">
              {payments.map(p => {
                const biz = p.businesses as { name: string; owner_name: string } | null
                return (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition">
                    <td className="px-4 py-3 font-medium text-foreground">{biz?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground/60">{biz?.owner_name ?? '—'}</td>
                    <td className="px-4 py-3 font-semibold tabular-nums text-foreground">₦{p.amount.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[p.status] ?? 'bg-white/5 text-muted-foreground/50'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground/40 text-[12px] font-mono">{p.flutterwave_ref ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground/40 text-[12px]">{new Date(p.created_at).toLocaleDateString('en-NG')}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { structureApi, MonitoredBusiness, Report, Payment } from '../../lib/structure-api'
import { Building2, FileText, CreditCard, AlertTriangle, Lock, TrendingUp } from 'lucide-react'

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; color: string }) {
  return (
    <div className="rounded-xl border border-white/08 bg-white/[0.04] p-4 flex items-center gap-3">
      <div className="p-2 rounded-lg" style={{ background: `${color}1A` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground tabular-nums">{value}</p>
        <p className="text-[11px] text-muted-foreground/60">{label}</p>
      </div>
    </div>
  )
}

export function StructureDashboard() {
  const [businesses, setBusinesses] = useState<MonitoredBusiness[]>([])
  const [pendingReports, setPendingReports] = useState<Report[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      structureApi.monitoring(),
      structureApi.listReports('pending'),
      structureApi.listPayments(),
    ])
      .then(([biz, reports, pays]) => {
        setBusinesses(biz)
        setPendingReports(reports)
        setPayments(pays)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (error) return (
    <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">{error}</div>
  )

  const locked = businesses.filter(b => b.is_locked)
  const byStage = businesses.reduce((acc, b) => { acc[b.stage] = (acc[b.stage] || 0) + 1; return acc }, {} as Record<string, number>)
  const recentPayments = payments.filter(p => p.status === 'successful').slice(0, 5)
  const revenue = payments.filter(p => p.status === 'successful').reduce((s, p) => s + p.amount, 0)

  const stats = [
    { label: 'Active Businesses', value: businesses.length, icon: Building2, color: '#C9952B' },
    { label: 'Pending Reports',   value: pendingReports.length, icon: FileText, color: '#CC7896' },
    { label: 'Locked Accounts',   value: locked.length, icon: Lock, color: '#ef4444' },
    { label: 'Revenue (₦)',        value: revenue, icon: CreditCard, color: '#4DBFB3' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-foreground">ERA Structure</h1>
        <p className="text-xs text-muted-foreground/50 mt-0.5">
          {new Date().toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-white/[0.04] animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(s => <StatCard key={s.label} {...s} />)}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {(['assessment', 'guide', 'maintenance'] as const).map(stage => (
          <div key={stage} className="rounded-xl border border-white/08 bg-white/[0.04] p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground/40">{stage}</p>
              <p className="text-3xl font-bold text-foreground mt-0.5 tabular-nums">{byStage[stage] ?? 0}</p>
            </div>
            <TrendingUp className="w-5 h-5 text-[#C9952B]/30" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pending reports */}
        <div className="rounded-xl border border-white/08 bg-white/[0.04]">
          <div className="px-4 py-3 border-b border-white/06 flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Reports awaiting review</p>
            <span className="text-xs px-2 py-0.5 rounded-full text-[#CC7896] bg-[#CC7896]/10 font-semibold">{pendingReports.length}</span>
          </div>
          <div className="divide-y divide-white/05">
            {pendingReports.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground/40 text-center">All clear — no pending reports</p>
            ) : pendingReports.slice(0, 6).map(r => {
              const biz = r.businesses as { name: string; owner_name: string } | null
              return (
                <div key={r.id} className="px-4 py-2.5 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground">{biz?.name}</p>
                    <p className="text-[11px] text-muted-foreground/40">{biz?.owner_name}</p>
                  </div>
                  <a href="/structure/reports" className="text-[11px] text-[#C9952B] hover:underline">Review</a>
                </div>
              )
            })}
          </div>
        </div>

        {/* Locked accounts */}
        <div className="rounded-xl border border-white/08 bg-white/[0.04]">
          <div className="px-4 py-3 border-b border-white/06 flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Locked accounts</p>
            <span className="text-xs px-2 py-0.5 rounded-full text-red-400 bg-red-500/10 font-semibold">{locked.length}</span>
          </div>
          <div className="divide-y divide-white/05">
            {locked.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground/40 text-center">No locked accounts</p>
            ) : locked.slice(0, 6).map(b => (
              <div key={b.id} className="px-4 py-2.5 flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground">{b.name}</p>
                  <p className="text-[11px] text-muted-foreground/40">{b.owner_name}</p>
                </div>
                {b.locked_at && (
                  <span className="text-[11px] text-muted-foreground/40">
                    {new Date(b.locked_at).toLocaleDateString('en-NG')}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent successful payments */}
      {recentPayments.length > 0 && (
        <div className="rounded-xl border border-white/08 bg-white/[0.04]">
          <div className="px-4 py-3 border-b border-white/06">
            <p className="text-sm font-semibold text-foreground">Recent payments</p>
          </div>
          <div className="divide-y divide-white/05">
            {recentPayments.map(p => {
              const biz = p.businesses as { name: string } | null
              return (
                <div key={p.id} className="px-4 py-2.5 flex items-center justify-between">
                  <p className="text-sm text-foreground">{biz?.name}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-[#4DBFB3] tabular-nums">₦{p.amount.toLocaleString()}</span>
                    <span className="text-[11px] text-muted-foreground/40">{new Date(p.created_at).toLocaleDateString('en-NG')}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Businesses needing attention */}
      {businesses.filter(b => b.docHealth < 60 || b.overdueDocs > 0).length > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5">
          <div className="px-4 py-3 border-b border-amber-500/15 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <p className="text-sm font-semibold text-amber-400">Needs attention</p>
          </div>
          <div className="divide-y divide-white/05">
            {businesses.filter(b => b.docHealth < 60 || b.overdueDocs > 0).slice(0, 5).map(b => (
              <div key={b.id} className="px-4 py-2.5 flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground">{b.name}</p>
                  <p className="text-[11px] text-muted-foreground/40">{b.overdueDocs} overdue • {b.docHealth}% doc health</p>
                </div>
                <a href="/structure/monitoring" className="text-[11px] text-[#C9952B] hover:underline">Monitor</a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

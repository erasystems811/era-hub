import { Mail, Send, AlertCircle, MousePointer2, TrendingUp, CheckCircle2, XCircle, Server } from 'lucide-react'

const STATS = [
  { label: 'Sent today',     value: '4,821',  sub: 'across all clients', icon: Send,          color: '#4DBFB3' },
  { label: 'Delivery rate',  value: '98.2%',  sub: 'last 30 days',       icon: CheckCircle2,  color: '#4DBFB3' },
  { label: 'Click rate',     value: '3.4%',   sub: 'last 30 days',       icon: MousePointer2, color: '#CC7896' },
  { label: 'Bounce rate',    value: '0.8%',   sub: 'last 30 days',       icon: XCircle,       color: '#f59e0b' },
]

const CLIENTS = [
  { name: 'City General Hospital',  domain: 'citygeneral.ng',    sent: 1240, delivered: '99.1%', clicked: '4.2%', bounced: '0.2%', status: 'healthy' },
  { name: 'QuickWash Laundry',      domain: 'quickwash.ng',      sent: 890,  delivered: '97.8%', clicked: '2.9%', bounced: '1.1%', status: 'healthy' },
  { name: 'Metro Logistics',        domain: 'metrologistics.ng', sent: 450,  delivered: '98.5%', clicked: '3.1%', bounced: '0.6%', status: 'healthy' },
  { name: 'Sunrise Pharmacy',       domain: 'sunrisepharm.ng',   sent: 310,  delivered: '96.2%', clicked: '1.8%', bounced: '2.1%', status: 'warning' },
  { name: 'FoodBridge Restaurant',  domain: 'foodbridge.ng',     sent: 180,  delivered: '99.4%', clicked: '5.6%', bounced: '0.1%', status: 'healthy' },
]

const RECENT = [
  { client: 'City General Hospital', name: 'July Appointment Reminders', status: 'sent',      sent: 840,  time: '2h ago' },
  { client: 'QuickWash Laundry',     name: 'Weekend Promo',              status: 'sent',      sent: 620,  time: '5h ago' },
  { client: 'Sunrise Pharmacy',      name: 'Monthly Newsletter',         status: 'scheduled', sent: 0,    time: 'Tomorrow 9am' },
  { client: 'Metro Logistics',       name: 'Invoice Batch — June',       status: 'sending',   sent: 280,  time: 'Now' },
  { client: 'FoodBridge Restaurant', name: 'New Menu Launch',            status: 'draft',     sent: 0,    time: 'Draft' },
]

function statusPill(s: string) {
  if (s === 'sent')      return 'bg-teal/10 text-teal border-teal/20'
  if (s === 'sending')   return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
  if (s === 'scheduled') return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
  return 'bg-white/05 text-muted-foreground border-white/10'
}

function healthDot(s: string) {
  return s === 'healthy'
    ? 'w-2 h-2 rounded-full bg-teal'
    : 'w-2 h-2 rounded-full bg-amber-400'
}

export function EmailOverview() {
  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">Email</h1>
          <p className="caption mt-0.5">Postal infrastructure · all clients · owned sending</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-teal/20 bg-teal/05">
          <Server className="w-3.5 h-3.5 text-teal" />
          <span className="text-xs font-medium text-teal">Postal connected</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STATS.map(s => (
          <div key={s.label} className="rounded-xl border border-white/07 bg-card px-4 py-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{s.label}</p>
              <s.icon className="w-4 h-4" style={{ color: s.color }} />
            </div>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground/50 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Client health */}
        <div className="rounded-2xl border border-white/07 bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-white/06 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground/50" />
            <h2 className="text-sm font-semibold text-foreground">Client sending health</h2>
          </div>
          <div className="divide-y divide-white/05">
            {CLIENTS.map(c => (
              <div key={c.name} className="px-5 py-3 flex items-center gap-3">
                <span className={healthDot(c.status)} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                  <p className="text-[10px] text-muted-foreground/50">{c.domain} · {c.sent.toLocaleString()} today</p>
                </div>
                <div className="text-right shrink-0 hidden sm:block">
                  <p className="text-xs font-semibold text-teal">{c.delivered}</p>
                  <p className="text-[10px] text-muted-foreground/50">delivered</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-semibold" style={{ color: '#CC7896' }}>{c.clicked}</p>
                  <p className="text-[10px] text-muted-foreground/50">clicked</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent campaigns */}
        <div className="rounded-2xl border border-white/07 bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-white/06 flex items-center gap-2">
            <Mail className="w-4 h-4 text-muted-foreground/50" />
            <h2 className="text-sm font-semibold text-foreground">Recent campaigns</h2>
          </div>
          <div className="divide-y divide-white/05">
            {RECENT.map((r, i) => (
              <div key={i} className="px-5 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{r.name}</p>
                  <p className="text-[10px] text-muted-foreground/50">{r.client}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border capitalize ${statusPill(r.status)}`}>
                    {r.status}
                  </span>
                  <p className="text-[10px] text-muted-foreground/40 mt-0.5">{r.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Infrastructure note */}
      <div className="flex items-start gap-3 p-4 rounded-xl border border-white/07 bg-white/[0.02]">
        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground">Connect your Postal server to activate live data</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Stats above are sample data. Once the Postal server is running and the ERA Comms API email module is deployed,
            all figures update in real time. Configure the connection in <span className="text-primary">Email Domains</span>.
          </p>
        </div>
      </div>
    </div>
  )
}

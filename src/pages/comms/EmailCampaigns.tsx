import { useState } from 'react'
import { Plus, Send, Clock, CheckCircle2, XCircle, Loader2, BarChart2, Calendar, Trash2 } from 'lucide-react'

interface Campaign {
  id: number
  name: string
  client: string
  template: string
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled'
  recipients: number
  sent: number
  delivered: number
  clicked: number
  bounced: number
  scheduledAt: string | null
  sentAt: string | null
}

const CAMPAIGNS: Campaign[] = [
  { id: 1, name: 'July Appointment Reminders',  client: 'City General Hospital', template: 'Appointment Reminder', status: 'sent',      recipients: 840,  sent: 840,  delivered: 832, clicked: 35,  bounced: 4,  scheduledAt: null,              sentAt: '2 hours ago' },
  { id: 2, name: 'Weekend Promo',               client: 'QuickWash Laundry',     template: 'Promo Blast',          status: 'sent',      recipients: 620,  sent: 620,  delivered: 606, clicked: 18,  bounced: 7,  scheduledAt: null,              sentAt: '5 hours ago' },
  { id: 3, name: 'Invoice Batch — June',        client: 'Metro Logistics',       template: 'Invoice',              status: 'sending',   recipients: 310,  sent: 280,  delivered: 275, clicked: 9,   bounced: 1,  scheduledAt: null,              sentAt: null },
  { id: 4, name: 'Monthly Newsletter',          client: 'Sunrise Pharmacy',      template: 'Monthly Newsletter',   status: 'scheduled', recipients: 1200, sent: 0,    delivered: 0,   clicked: 0,   bounced: 0,  scheduledAt: 'Tomorrow 9:00am', sentAt: null },
  { id: 5, name: 'New Menu Launch',             client: 'FoodBridge Restaurant', template: 'Promo Blast',          status: 'draft',     recipients: 0,    sent: 0,    delivered: 0,   clicked: 0,   bounced: 0,  scheduledAt: null,              sentAt: null },
  { id: 6, name: 'August Health Tips',          client: 'City General Hospital', template: 'Monthly Newsletter',   status: 'draft',     recipients: 0,    sent: 0,    delivered: 0,   clicked: 0,   bounced: 0,  scheduledAt: null,              sentAt: null },
]

const STATUS_STYLES: Record<string, string> = {
  draft:     'bg-white/05 text-muted-foreground border-white/10',
  scheduled: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  sending:   'bg-blue-500/10 text-blue-400 border-blue-500/20',
  sent:      'bg-teal/10 text-teal border-teal/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
}

const STATUS_ICONS: Record<string, JSX.Element> = {
  draft:     <></>,
  scheduled: <Clock className="w-3 h-3" />,
  sending:   <Loader2 className="w-3 h-3 animate-spin" />,
  sent:      <CheckCircle2 className="w-3 h-3" />,
  cancelled: <XCircle className="w-3 h-3" />,
}

const FILTERS = ['All', 'Draft', 'Scheduled', 'Sending', 'Sent']

function pct(a: number, b: number) {
  if (!b) return '—'
  return `${((a / b) * 100).toFixed(1)}%`
}

export function EmailCampaigns() {
  const [filter, setFilter] = useState('All')
  const [showCreate, setShowCreate] = useState(false)

  const shown = filter === 'All'
    ? CAMPAIGNS
    : CAMPAIGNS.filter(c => c.status === filter.toLowerCase())

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">Campaigns</h1>
          <p className="caption mt-0.5">Schedule, monitor and manage bulk email sends</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> New campaign
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total campaigns', value: CAMPAIGNS.length },
          { label: 'Sent this month',  value: CAMPAIGNS.filter(c => c.status === 'sent').length },
          { label: 'Scheduled',        value: CAMPAIGNS.filter(c => c.status === 'scheduled').length },
          { label: 'Drafts',           value: CAMPAIGNS.filter(c => c.status === 'draft').length },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-white/07 bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-2xl font-bold text-foreground mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              filter === f
                ? 'bg-primary/20 text-primary border-primary/30'
                : 'text-muted-foreground border-white/08 hover:border-white/16 hover:text-foreground'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/07 bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: 780 }}>
            <thead>
              <tr className="border-b border-white/06">
                {['Campaign', 'Client', 'Status', 'Recipients', 'Delivered', 'Clicked', 'Bounced', 'When', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/05">
              {shown.map(c => (
                <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground truncate max-w-[180px]">{c.name}</p>
                    <p className="text-[10px] text-muted-foreground/50">{c.template}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">{c.client}</td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1 w-fit text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${STATUS_STYLES[c.status]}`}>
                      {STATUS_ICONS[c.status]} {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground tabular-nums">{c.recipients ? c.recipients.toLocaleString() : '—'}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-teal tabular-nums">{pct(c.delivered, c.recipients)}</td>
                  <td className="px-4 py-3 text-xs font-semibold tabular-nums" style={{ color: '#CC7896' }}>{pct(c.clicked, c.delivered)}</td>
                  <td className="px-4 py-3 text-xs text-amber-400 tabular-nums">{pct(c.bounced, c.sent)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground/50 whitespace-nowrap">
                    {c.status === 'scheduled' ? (
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{c.scheduledAt}</span>
                    ) : c.sentAt ? (
                      <span className="flex items-center gap-1"><Send className="w-3 h-3" />{c.sentAt}</span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 text-muted-foreground/40 hover:text-primary hover:bg-primary/10 rounded-lg transition">
                        <BarChart2 className="w-3.5 h-3.5" />
                      </button>
                      {(c.status === 'scheduled' || c.status === 'draft') && (
                        <button className="p-1.5 text-muted-foreground/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className="relative z-10 bg-[#1a1624] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="px-6 py-5 border-b border-white/08">
              <h2 className="font-semibold text-foreground">New campaign</h2>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="label">Campaign name</label>
                <input className="input" placeholder="July newsletter — City General" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Client</label>
                  <select className="input">
                    <option>City General Hospital</option>
                    <option>QuickWash Laundry</option>
                    <option>Metro Logistics</option>
                  </select>
                </div>
                <div>
                  <label className="label">Template</label>
                  <select className="input">
                    <option>Appointment Reminder</option>
                    <option>Monthly Newsletter</option>
                    <option>Promo Blast</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Contact list</label>
                  <select className="input">
                    <option>All patients (840)</option>
                    <option>Cardiology ward (120)</option>
                  </select>
                </div>
                <div>
                  <label className="label">Send</label>
                  <select className="input">
                    <option>Immediately</option>
                    <option>Schedule for later</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-white/08 flex gap-2 justify-end">
              <button className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn-primary flex items-center gap-2">
                <Send className="w-4 h-4" /> Create campaign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect, type ReactNode } from 'react'
import { Send, Loader2, AlertCircle, CheckCircle2, XCircle, Clock, FileEdit } from 'lucide-react'
import { emailApi, type EmailCampaign } from '../../lib/comms-api'
import { fmtDate } from '../../lib/utils'
import { EmailTabs } from './EmailOverview'

const STATUS_STYLE: Record<string, string> = {
  draft:     'bg-white/05 text-muted-foreground border-white/10',
  scheduled: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  sending:   'bg-blue-500/10 text-blue-400 border-blue-500/20',
  sent:      'bg-teal/10 text-teal border-teal/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
}

const STATUS_ICON: Record<string, ReactNode> = {
  draft:     <FileEdit className="w-3 h-3" />,
  scheduled: <Clock className="w-3 h-3" />,
  sending:   <Loader2 className="w-3 h-3 animate-spin" />,
  sent:      <CheckCircle2 className="w-3 h-3" />,
  cancelled: <XCircle className="w-3 h-3" />,
}

function pct(n: number) { return n > 0 ? `${n.toFixed(1)}%` : '—' }

function CampaignRow({ c, onUpdate }: { c: EmailCampaign; onUpdate: (id: string, next: EmailCampaign) => void }) {
  const [busy, setBusy] = useState(false)

  const action = async (type: 'send' | 'cancel') => {
    setBusy(true)
    try {
      if (type === 'send') {
        await emailApi.sendCampaign(c.id)
      } else {
        await emailApi.cancelCampaign(c.id)
      }
      // Optimistically update status
      onUpdate(c.id, { ...c, status: type === 'send' ? 'sending' : 'cancelled' })
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Action failed')
    } finally {
      setBusy(false)
    }
  }

  const canSend   = c.status === 'draft' || c.status === 'scheduled'
  const canCancel = c.status === 'draft' || c.status === 'scheduled' || c.status === 'sending'

  return (
    <tr className="border-b border-white/05 hover:bg-white/[0.025] transition-colors group">
      <td className="px-5 py-4">
        <p className="font-medium text-foreground text-sm">{c.name}</p>
        <p className="text-[10px] text-muted-foreground/50 mt-0.5">{c.clientName}</p>
      </td>
      <td className="px-5 py-4 hidden md:table-cell text-xs text-muted-foreground">{c.templateName}</td>
      <td className="px-5 py-4 hidden md:table-cell text-xs text-muted-foreground">{c.listName}</td>
      <td className="px-5 py-4">
        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${STATUS_STYLE[c.status] ?? STATUS_STYLE.draft}`}>
          {STATUS_ICON[c.status]}
          {c.status}
        </span>
      </td>
      <td className="px-5 py-4 hidden lg:table-cell">
        {c.status === 'sent' || c.status === 'sending' ? (
          <div className="text-xs space-y-0.5">
            <p className="text-foreground tabular-nums">{c.totalSent.toLocaleString()} / {c.totalRecipients.toLocaleString()}</p>
            <p className="text-muted-foreground/50">{pct(c.deliveryRate)} delivered · {pct(c.bounceRate)} bounced</p>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground/40">—</span>
        )}
      </td>
      <td className="px-5 py-4 hidden sm:table-cell text-xs text-muted-foreground whitespace-nowrap">
        {c.scheduledAt ? fmtDate(c.scheduledAt) : fmtDate(c.createdAt)}
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-1.5 justify-end">
          {canSend && (
            <button
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition disabled:opacity-50"
              onClick={() => void action('send')}
              disabled={busy}
            >
              {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              {c.status === 'scheduled' ? 'Send now' : 'Launch'}
            </button>
          )}
          {canCancel && (
            <button
              className="px-2.5 py-1 rounded-lg text-xs font-medium text-muted-foreground border border-white/10 hover:border-red-500/30 hover:text-red-400 transition disabled:opacity-50"
              onClick={() => void action('cancel')}
              disabled={busy}
            >
              Cancel
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}

export function EmailCampaigns() {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const load = () => {
    setLoading(true); setError('')
    emailApi.listCampaigns()
      .then(setCampaigns)
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleUpdate = (id: string, next: EmailCampaign) =>
    setCampaigns(prev => prev.map(c => c.id === id ? next : c))

  const filtered = statusFilter === 'all'
    ? campaigns
    : campaigns.filter(c => c.status === statusFilter)

  const counts = campaigns.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-5 max-w-6xl">
      <div>
        <h1 className="page-title">Email</h1>
        <p className="caption mt-0.5">Manage campaigns · launch · monitor delivery</p>
      </div>

      <EmailTabs />

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-red-500/20 bg-red-500/05">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {!loading && campaigns.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {['all', 'draft', 'scheduled', 'sending', 'sent', 'cancelled'].map(s => {
            const count = s === 'all' ? campaigns.length : (counts[s] ?? 0)
            if (s !== 'all' && count === 0) return null
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition capitalize ${statusFilter === s ? 'bg-primary/15 border-primary/30 text-primary' : 'border-white/10 text-muted-foreground hover:border-white/20'}`}
              >
                {s === 'all' ? 'All' : s} {count > 0 && <span className="opacity-60 ml-1">{count}</span>}
              </button>
            )
          })}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading campaigns…
        </div>
      ) : campaigns.length === 0 ? (
        <div className="rounded-2xl border border-white/07 bg-card flex flex-col items-center justify-center py-16 gap-3 text-center">
          <Send className="w-10 h-10 text-muted-foreground/20" />
          <p className="font-semibold text-foreground">No campaigns yet</p>
          <p className="text-sm text-muted-foreground max-w-sm">
            Campaigns are created by businesses through the business portal. Once a business submits a campaign,
            it will appear here for you to review and launch.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/07 bg-card flex items-center justify-center py-12 text-muted-foreground text-sm">
          No {statusFilter} campaigns
        </div>
      ) : (
        <div className="rounded-2xl border border-white/07 bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/07">
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-5 py-3.5">Campaign</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-5 py-3.5 hidden md:table-cell">Template</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-5 py-3.5 hidden md:table-cell">List</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-5 py-3.5">Status</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-5 py-3.5 hidden lg:table-cell">Results</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-5 py-3.5 hidden sm:table-cell">Date</th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <CampaignRow key={c.id} c={c} onUpdate={handleUpdate} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

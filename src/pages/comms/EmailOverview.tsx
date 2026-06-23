import { useEffect, useState } from 'react'
import { useNavigate, useLocation, NavLink } from 'react-router-dom'
import {
  Mail, Globe, FileText, Send, Users, Loader2,
  AlertCircle, CheckCircle2, XCircle, Server,
} from 'lucide-react'
import { emailApi, type EmailOverviewStats, type EmailCampaign } from '../../lib/comms-api'

const EMAIL_TABS = [
  { label: 'Overview',  path: '/comms/email' },
  { label: 'Domains',   path: '/comms/email/domains' },
  { label: 'Templates', path: '/comms/email/templates' },
  { label: 'Campaigns', path: '/comms/email/campaigns' },
  { label: 'Contacts',  path: '/comms/email/contacts' },
]

export function EmailTabs() {
  const { pathname } = useLocation()
  return (
    <div className="flex gap-1 border-b border-white/07 mb-6 -mt-2">
      {EMAIL_TABS.map(t => {
        const active = t.path === '/comms/email' ? pathname === t.path : pathname.startsWith(t.path)
        return (
          <NavLink
            key={t.path}
            to={t.path}
            end={t.path === '/comms/email'}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              active
                ? 'text-primary border-primary'
                : 'text-muted-foreground border-transparent hover:text-foreground hover:border-white/20'
            }`}
          >
            {t.label}
          </NavLink>
        )
      })}
    </div>
  )
}

const CAMPAIGN_STATUS: Record<string, string> = {
  sent:      'bg-teal/10 text-teal border-teal/20',
  sending:   'bg-blue-500/10 text-blue-400 border-blue-500/20',
  scheduled: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  draft:     'bg-white/05 text-muted-foreground border-white/10',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
}

export function EmailOverview() {
  const nav = useNavigate()
  const [stats, setStats]       = useState<EmailOverviewStats | null>(null)
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  useEffect(() => {
    Promise.allSettled([
      emailApi.overview(),
      emailApi.listCampaigns(),
    ]).then(([sRes, cRes]) => {
      if (sRes.status === 'fulfilled') setStats(sRes.value)
      else setError(sRes.reason instanceof Error ? sRes.reason.message : 'Failed to load stats')
      if (cRes.status === 'fulfilled') setCampaigns(cRes.value.slice(0, 6))
    }).finally(() => setLoading(false))
  }, [])

  const pct = (n: number) => n > 0 ? `${n.toFixed(1)}%` : '—'

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">Email</h1>
          <p className="caption mt-0.5">Postal email infrastructure · all clients</p>
        </div>
        {stats !== null && (
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${
            stats.postalConnected
              ? 'border-teal/20 bg-teal/05 text-teal'
              : 'border-amber-500/20 bg-amber-500/05 text-amber-400'
          }`}>
            <Server className="w-3.5 h-3.5" />
            Postal {stats.postalConnected ? 'connected' : 'not connected'}
          </div>
        )}
      </div>

      <EmailTabs />

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-red-500/20 bg-red-500/05">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Sent today',    value: stats?.sentToday.toLocaleString() ?? '0',  sub: 'across all clients',  color: '#4DBFB3' },
              { label: 'Sent (30 days)', value: stats?.sent30d.toLocaleString() ?? '0',    sub: 'last 30 days',        color: '#4DBFB3' },
              { label: 'Delivery rate', value: pct(stats?.deliveryRate ?? 0),              sub: 'of emails delivered',  color: '#4DBFB3' },
              { label: 'Bounce rate',   value: pct(stats?.bounceRate ?? 0),                sub: 'of emails bounced',    color: '#f59e0b' },
            ].map(s => (
              <div key={s.label} className="rounded-xl border border-white/07 bg-card px-4 py-4">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">{s.label}</p>
                <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[10px] text-muted-foreground/50 mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Navigation cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Domains',   desc: 'Sending domain setup & DNS',  Icon: Globe,     path: '/comms/email/domains' },
              { label: 'Templates', desc: 'HTML email templates',         Icon: FileText,  path: '/comms/email/templates' },
              { label: 'Campaigns', desc: 'Schedule & send campaigns',    Icon: Send,      path: '/comms/email/campaigns' },
              { label: 'Contacts',  desc: 'Lists & suppression',          Icon: Users,     path: '/comms/email/contacts' },
            ].map(item => (
              <button
                key={item.path}
                onClick={() => nav(item.path)}
                className="rounded-xl border border-white/07 bg-card p-4 text-left hover:bg-white/[0.03] hover:border-primary/30 transition-all group"
              >
                <item.Icon className="w-5 h-5 text-primary/60 group-hover:text-primary mb-2.5 transition-colors" />
                <p className="text-sm font-semibold text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
              </button>
            ))}
          </div>

          {/* Recent campaigns */}
          <div className="rounded-2xl border border-white/07 bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-white/06 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-muted-foreground/50" />
                <h2 className="text-sm font-semibold text-foreground">Recent campaigns</h2>
              </div>
              <button onClick={() => nav('/comms/email/campaigns')} className="text-xs text-primary hover:underline">
                View all
              </button>
            </div>
            {campaigns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
                <Mail className="w-8 h-8 text-muted-foreground/20" />
                <p className="text-sm font-medium text-foreground">No campaigns yet</p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Add a sending domain, create a template, build a contact list, then launch a campaign.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/05">
                {campaigns.map(c => (
                  <div key={c.id} className="px-5 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                      <p className="text-[10px] text-muted-foreground/50">{c.clientName}</p>
                    </div>
                    <div className="text-right shrink-0 hidden sm:block">
                      <p className="text-xs tabular-nums text-foreground">{c.totalSent.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground/50">sent</p>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border capitalize ${CAMPAIGN_STATUS[c.status] ?? CAMPAIGN_STATUS.draft}`}>
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {!stats?.postalConnected && (
            <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-500/20 bg-amber-500/05">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Postal server not connected</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Email sending requires a Postal server. Configure{' '}
                  <code className="text-primary/80 text-[11px]">POSTAL_SERVER_URL</code> and{' '}
                  <code className="text-primary/80 text-[11px]">POSTAL_API_KEY</code> in your ERA Comms environment.
                  Once connected, domains can be verified and campaigns can be sent.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

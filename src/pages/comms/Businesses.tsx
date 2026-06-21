import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Users, Search, Eye, EyeOff, Copy, Check, Trash2, X, Loader2, ChevronRight } from 'lucide-react'
import { StatusDot } from '../../components/StatusDot'
import { commsApi, Client, ClientDetail, ApiKey, Plan } from '../../lib/comms-api'
import { fmtDate, fmtNumber } from '../../lib/utils'
import { pageCache } from '../../lib/cache'

function ClientDrawer({ client, plans, onClose, onUpdated }: {
  client: Client; plans: Plan[]
  onClose: () => void; onUpdated: () => void
}) {
  const [detail, setDetail] = useState<ClientDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [newLabel, setNewLabel] = useState('')
  const [showKey, setShowKey] = useState<Record<string, boolean>>({})
  const [freshKey, setFreshKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    void commsApi.getClient(client.id).then(d => { setDetail(d); setLoading(false) })
  }, [client.id])

  const createKey = async () => {
    if (!detail || !newLabel) return
    setSaving(true)
    try {
      const k = await commsApi.createApiKey(detail.id, newLabel, ['messages:send', 'sessions:read'])
      setFreshKey(k.key)
      setNewLabel('')
      setDetail(await commsApi.getClient(detail.id))
    } finally { setSaving(false) }
  }

  const revokeKey = async (keyId: string) => {
    if (!detail) return
    if (!confirm('Remove this access key?')) return
    await commsApi.revokeApiKey(keyId)
    setDetail(await commsApi.getClient(detail.id))
    onUpdated()
  }

  const toggleActive = async () => {
    if (!detail) return
    setSaving(true)
    try {
      await commsApi.updateClient(detail.id, { active: !detail.active })
      setDetail(await commsApi.getClient(detail.id))
      onUpdated()
    } finally { setSaving(false) }
  }

  const copyKey = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="w-[480px] bg-[hsl(262,20%,9%)] border-l border-white/08 overflow-y-auto flex flex-col">
        {/* Drawer header */}
        <div className="px-6 py-5 border-b border-white/07 flex items-start justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary text-sm font-bold flex items-center justify-center shrink-0">
                {client.name[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <h2 className="font-semibold text-foreground truncate">{client.name}</h2>
                <p className="text-xs text-muted-foreground font-mono">{client.slug}</p>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition shrink-0 mt-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading…
            </div>
          ) : detail && (
            <>
              {/* Info grid */}
              <div className="rounded-xl border border-white/07 bg-card p-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-1.5">Status</p>
                  <StatusDot status={detail.active ? 'active' : 'inactive'} label={detail.active ? 'Active' : 'Suspended'} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-1.5">Plan</p>
                  <p className="text-sm font-medium text-foreground capitalize">{detail.planName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-1.5">Sessions</p>
                  <p className="text-sm text-foreground">{detail.usage.sessionsActive} active</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-1.5">Messages / month</p>
                  <p className="text-sm text-foreground tabular-nums">{fmtNumber(detail.usage.monthlyMessages)}</p>
                </div>
                {detail.contactEmail && (
                  <div className="col-span-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-1.5">Email</p>
                    <p className="text-sm text-foreground truncate">{detail.contactEmail}</p>
                  </div>
                )}
              </div>

              <button
                className={`w-full text-sm py-2 rounded-xl font-medium transition-colors border ${
                  detail.active
                    ? 'border-red-500/25 text-red-400 hover:bg-red-500/10'
                    : 'btn-teal'
                }`}
                onClick={toggleActive}
                disabled={saving}
              >
                {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin inline mr-1.5" />Saving…</> : detail.active ? 'Suspend access' : 'Restore access'}
              </button>

              {/* New key banner */}
              {freshKey && (
                <div className="rounded-xl border border-teal/20 bg-teal/05 p-4">
                  <p className="text-xs font-semibold text-teal mb-2">New key — copy now, won't be shown again</p>
                  <p className="font-mono text-xs text-foreground break-all mb-2">{freshKey}</p>
                  <button className="text-xs flex items-center gap-1.5 text-muted-foreground hover:text-teal transition"
                    onClick={() => void copyKey(freshKey)}>
                    {copied ? <Check className="w-3.5 h-3.5 text-teal" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied!' : 'Copy to clipboard'}
                  </button>
                </div>
              )}

              {/* API keys */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Access keys</h3>
                {detail.apiKeys.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No API keys yet</p>
                ) : (
                  <div className="space-y-2 mb-3">
                    {detail.apiKeys.map((k: ApiKey) => (
                      <div key={k.id} className="rounded-xl border border-white/07 bg-card px-4 py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">{k.label}</p>
                          <p className="font-mono text-xs text-muted-foreground truncate">
                            {showKey[k.id] ? k.keyPreview : '••••••••••••••••' + k.keyPreview.slice(-8)}
                          </p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/07 transition"
                            onClick={() => setShowKey(p => ({ ...p, [k.id]: !p[k.id] }))}>
                            {showKey[k.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition"
                            onClick={() => void revokeKey(k.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input className="input flex-1 text-sm" placeholder="Key label (e.g. Production)" value={newLabel} onChange={e => setNewLabel(e.target.value)} />
                  <button className="btn-primary text-sm" disabled={!newLabel || saving} onClick={createKey}>Generate</button>
                </div>
              </div>

              {/* Plan change */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Change plan</h3>
                <select
                  className="input"
                  value={detail.planId}
                  onChange={async e => {
                    setSaving(true)
                    try {
                      await commsApi.updateClient(detail.id, { planId: e.target.value })
                      setDetail(await commsApi.getClient(detail.id))
                      onUpdated()
                    } finally { setSaving(false) }
                  }}
                >
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>{p.displayName} — {p.monthlyFee ? `₦${p.monthlyFee.toLocaleString()}/mo` : 'Free'}</option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export function Businesses() {
  const nav = useNavigate()
  const [clients, setClients] = useState<Client[]>(() => pageCache.get<Client[]>('comms:clients') ?? [])
  const [plans, setPlans] = useState<Plan[]>(() => pageCache.get<Plan[]>('comms:plans') ?? [])
  const [loading, setLoading] = useState(() => !pageCache.get('comms:clients'))
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Client | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const [c, p] = await Promise.all([commsApi.listClients(), commsApi.listPlans()])
      pageCache.set('comms:clients', c); pageCache.set('comms:plans', p)
      setClients(c); setPlans(p)
    } finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [])

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.slug.toLowerCase().includes(search.toLowerCase())
  )

  const active    = clients.filter(c => c.active).length
  const suspended = clients.filter(c => !c.active).length

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="page-title">Businesses</h1>
          <p className="caption mt-0.5">{clients.length} business{clients.length !== 1 ? 'es' : ''} on ERA Comms</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => nav('/comms/onboarding')}>
          <Plus className="w-4 h-4" /> Add business
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Total',     value: clients.length, color: 'text-foreground' },
          { label: 'Active',    value: active,          color: 'text-teal' },
          { label: 'Suspended', value: suspended,        color: 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-white/08 bg-card px-5 py-4">
            <p className="text-xs text-muted-foreground font-medium mb-1">{s.label}</p>
            <p className={`text-2xl font-bold tabular-nums ${s.color}`}>{loading ? '—' : s.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
        <input className="input pl-10" placeholder="Search businesses…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading businesses…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/07 bg-card flex flex-col items-center justify-center py-16 gap-3">
          <Users className="w-10 h-10 text-muted-foreground/20" />
          <p className="font-semibold text-foreground">{search ? 'No businesses match your search' : 'No businesses yet'}</p>
          <p className="caption text-sm">{search ? 'Try a different name or slug' : 'Onboard your first business to start managing comms'}</p>
          {!search && <button className="btn-primary mt-1" onClick={() => nav('/comms/onboarding')}>Add first business</button>}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/07 bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/07">
                {['Business', 'Plan', 'Status', 'Sessions', 'Messages / mo', 'Added', ''].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-5 py-3.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/05">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-white/[0.025] cursor-pointer transition-colors group"
                  onClick={() => setSelected(c)}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                        {c.name[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate max-w-[180px]">{c.name}</p>
                        <p className="text-xs text-muted-foreground font-mono truncate max-w-[180px]">{c.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground text-xs capitalize">{c.planName}</td>
                  <td className="px-5 py-3.5">
                    <StatusDot status={c.active ? 'active' : 'inactive'} label={c.active ? 'Active' : 'Suspended'} size="sm" />
                  </td>
                  <td className="px-5 py-3.5 text-foreground tabular-nums">{c.sessionCount}</td>
                  <td className="px-5 py-3.5 text-foreground tabular-nums">{fmtNumber(c.monthlyMessageCount)}</td>
                  <td className="px-5 py-3.5 text-muted-foreground text-xs whitespace-nowrap">{fmtDate(c.createdAt)}</td>
                  <td className="px-5 py-3.5">
                    <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-colors ml-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <ClientDrawer client={selected} plans={plans} onClose={() => setSelected(null)} onUpdated={load} />
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Users, Search, Eye, EyeOff, Copy, Check, Trash2, X } from 'lucide-react'
import { Glass } from '../../components/Glass'
import { StatusDot } from '../../components/StatusDot'
import { commsApi, Client, ClientDetail, ApiKey, Plan } from '../../lib/comms-api'
import { fmtDate, fmtNumber } from '../../lib/utils'

function ClientDrawer({ client, plans, onClose, onUpdated }: {
  client: Client; plans: Plan[]
  onClose: () => void; onUpdated: () => void
}) {
  const [detail, setDetail] = useState<ClientDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [newLabel, setNewLabel] = useState('')
  const [showKey, setShowKey] = useState<Record<string, boolean>>({})
  const [freshKey, setFreshKey] = useState<string | null>(null)
  const [copying, setCopying] = useState(false)
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
      const updated = await commsApi.getClient(detail.id)
      setDetail(updated)
    } finally { setSaving(false) }
  }

  const revokeKey = async (keyId: string) => {
    if (!detail) return
    if (!confirm('Remove this access key?')) return
    await commsApi.revokeApiKey(keyId)
    const updated = await commsApi.getClient(detail.id)
    setDetail(updated)
    onUpdated()
  }

  const toggleActive = async () => {
    if (!detail) return
    setSaving(true)
    try {
      await commsApi.updateClient(detail.id, { active: !detail.active })
      const updated = await commsApi.getClient(detail.id)
      setDetail(updated)
      onUpdated()
    } finally { setSaving(false) }
  }

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopying(true)
    setTimeout(() => setCopying(false), 1500)
  }

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="w-[480px] bg-bg border-l border-pink-border overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="section-title">{client.name}</h2>
            <p className="caption">{client.slug}</p>
          </div>
          <button className="btn-ghost p-2" onClick={onClose}><X className="w-4 h-4" /></button>
        </div>

        {loading ? (
          <p className="text-charcoal-soft text-sm">Loading…</p>
        ) : detail && (
          <>
            {/* Info */}
            <Glass sm className="mb-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="label">Status</div>
                  <StatusDot status={detail.active ? 'active' : 'inactive'} label={detail.active ? 'Active' : 'Suspended'} />
                </div>
                <div>
                  <div className="label">Plan</div>
                  <div className="text-charcoal capitalize">{detail.planName}</div>
                </div>
                <div>
                  <div className="label">Sessions</div>
                  <div className="text-charcoal">{detail.usage.sessionsActive} active</div>
                </div>
                <div>
                  <div className="label">Messages this month</div>
                  <div className="text-charcoal">{fmtNumber(detail.usage.monthlyMessages)}</div>
                </div>
                {detail.contactEmail && <div className="col-span-2"><div className="label">Email</div><div className="text-charcoal">{detail.contactEmail}</div></div>}
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  className={detail.active ? 'btn-secondary text-xs text-rose' : 'btn-primary text-xs'}
                  onClick={toggleActive}
                  disabled={saving}
                >
                  {detail.active ? 'Suspend access' : 'Restore access'}
                </button>
              </div>
            </Glass>

            {/* Fresh key banner */}
            {freshKey && (
              <div className="p-4 rounded-xl mb-4" style={{ background: 'rgba(74,155,168,0.06)', border: '1px solid rgba(74,155,168,0.15)' }}>
                <div className="text-xs font-semibold text-charcoal-soft mb-1">New key — copy it now</div>
                <div className="font-mono text-xs text-charcoal break-all">{freshKey}</div>
                <button className="btn-secondary text-xs mt-2 flex items-center gap-1" onClick={() => void copy(freshKey)}>
                  {copying ? <Check className="w-3.5 h-3.5 text-teal" /> : <Copy className="w-3.5 h-3.5" />} Copy key
                </button>
              </div>
            )}

            {/* API keys */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-charcoal mb-3">Access keys</h3>
              {detail.apiKeys.length === 0
                ? <p className="caption text-sm">No keys yet</p>
                : (
                  <div className="space-y-2">
                    {detail.apiKeys.map((k: ApiKey) => (
                      <div key={k.id} className="glass-sm flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium text-charcoal">{k.label}</div>
                          <div className="font-mono text-xs text-charcoal-soft">
                            {showKey[k.id] ? k.keyPreview : '•••••••••••••••••• ' + k.keyPreview.slice(-8)}
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button className="btn-ghost p-1.5" onClick={() => setShowKey(p => ({ ...p, [k.id]: !p[k.id] }))}>
                            {showKey[k.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button className="btn-ghost p-1.5 hover:text-rose transition-colors" onClick={() => void revokeKey(k.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }
              <div className="flex gap-2 mt-3">
                <input className="input flex-1 text-sm" placeholder="Key label" value={newLabel} onChange={e => setNewLabel(e.target.value)} />
                <button className="btn-primary text-sm" disabled={!newLabel || saving} onClick={createKey}>
                  Generate key
                </button>
              </div>
            </div>

            {/* Plan change */}
            <div>
              <h3 className="text-sm font-semibold text-charcoal mb-3">Change plan</h3>
              <select
                className="input"
                value={detail.planId}
                onChange={async (e) => {
                  setSaving(true)
                  try {
                    await commsApi.updateClient(detail.id, { planId: e.target.value })
                    const updated = await commsApi.getClient(detail.id)
                    setDetail(updated)
                    onUpdated()
                  } finally { setSaving(false) }
                }}
              >
                {plans.filter(p => p.active).map(p => (
                  <option key={p.id} value={p.id}>{p.name} — {p.priceMonthly === 0 ? 'Free' : `₦${p.priceMonthly.toLocaleString()}/mo`}</option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export function Businesses() {
  const nav = useNavigate()
  const [clients, setClients] = useState<Client[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Client | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const [c, p] = await Promise.all([commsApi.listClients(), commsApi.listPlans()])
      setClients(c); setPlans(p)
    } finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [])

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.slug.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Businesses</h1>
          <p className="caption mt-0.5">{clients.length} business{clients.length !== 1 ? 'es' : ''} registered</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => nav('/comms/onboarding')}>
          <Plus className="w-4 h-4" /> Add business
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-soft opacity-50" />
        <input className="input pl-10" placeholder="Search businesses…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="text-center py-16 text-charcoal-soft">Loading…</div>
      ) : filtered.length === 0 ? (
        <Glass className="text-center py-12">
          <Users className="w-10 h-10 text-pink mx-auto mb-3 opacity-40" />
          <p className="font-medium text-charcoal">{search ? 'No businesses match your search' : 'No businesses yet'}</p>
          {!search && <button className="btn-primary mt-4" onClick={() => nav('/comms/onboarding')}>Add first business</button>}
        </Glass>
      ) : (
        <div className="glass overflow-hidden" style={{ padding: 0 }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(233,145,200,0.2)' }}>
                {['Business', 'Plan', 'Status', 'Sessions', 'Messages this month', 'Added', ''].map(h => (
                  <th key={h} className="text-left text-xs text-charcoal-soft font-medium px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-b border-pink-border last:border-0 hover:bg-pink-light cursor-pointer transition-colors"
                  onClick={() => setSelected(c)}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-charcoal">{c.name}</div>
                    <div className="text-xs text-charcoal-soft">{c.slug}</div>
                  </td>
                  <td className="px-4 py-3 capitalize text-charcoal-soft">{c.planName}</td>
                  <td className="px-4 py-3">
                    <StatusDot status={c.active ? 'active' : 'inactive'} label={c.active ? 'Active' : 'Suspended'} size="sm" />
                  </td>
                  <td className="px-4 py-3 text-charcoal-soft">{c.sessionCount}</td>
                  <td className="px-4 py-3 text-charcoal-soft">{fmtNumber(c.monthlyMessageCount)}</td>
                  <td className="px-4 py-3 text-charcoal-soft">{fmtDate(c.createdAt)}</td>
                  <td className="px-4 py-3 text-right"><span className="text-xs text-teal font-medium">Manage →</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <ClientDrawer
          client={selected}
          plans={plans}
          onClose={() => setSelected(null)}
          onUpdated={load}
        />
      )}
    </div>
  )
}

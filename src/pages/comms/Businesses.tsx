import { useEffect, useState, type ComponentType } from 'react'
import {
  Plus, Users, Search, Eye, EyeOff, Copy, Check, Trash2, X, Loader2,
  ChevronRight, AlertCircle, Pencil, BarChart2, KeyRound, Save,
} from 'lucide-react'
import { StatusDot } from '../../components/StatusDot'
import { commsApi, type Client, type ClientDetail, type ApiKey, type Plan } from '../../lib/comms-api'
import { fmtDate, fmtNumber } from '../../lib/utils'
import { pageCache } from '../../lib/cache'
import { useToast } from '../../components/Toast'
import { PhoneInput } from '../../components/PhoneInput'
import { EmptyState } from '../../components/EmptyState'

type DrawerTab = 'overview' | 'edit' | 'keys'

const FIELD = "w-full px-3.5 py-2.5 rounded-xl bg-[hsl(262_20%_11%)] border border-white/[0.10] text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all"
const LABEL = "text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-1.5 block"

function ClientDrawer({ client, plans, onClose, onUpdated }: {
  client: Client; plans: Plan[]
  onClose: () => void; onUpdated: () => void
}) {
  const toast = useToast()
  const [detail, setDetail]         = useState<ClientDetail | null>(null)
  const [loading, setLoading]       = useState(true)
  const [drawerError, setDrawerError] = useState<string | null>(null)
  const [tab, setTab]               = useState<DrawerTab>('overview')
  const [saving, setSaving]         = useState(false)
  const [saveOk, setSaveOk]         = useState(false)

  // Edit form state
  const [editName,  setEditName]  = useState('')
  const [editSlug,  setEditSlug]  = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editPlan,  setEditPlan]  = useState('')

  // API keys state
  const [newLabel,     setNewLabel]     = useState('')
  const [freshKey,     setFreshKey]     = useState<string | null>(null)
  const [freshKeyId,   setFreshKeyId]   = useState<string | null>(null)
  const [showFreshKey, setShowFreshKey] = useState(false)
  const [secureSent,   setSecureSent]   = useState(false)
  const [showKey,      setShowKey]      = useState<Record<string, boolean>>({})
  const [copied,       setCopied]       = useState(false)

  const reload = (id: string) => {
    setLoading(true); setDrawerError(null)
    commsApi.getClient(id)
      .then(d => {
        if (!d) {
          setDrawerError('No data returned for this business. It may have been deleted or the API is unavailable.')
          setLoading(false)
          return
        }
        setDetail(d)
        setEditName(d.name ?? '')
        setEditSlug(d.slug ?? '')
        setEditEmail(d.contactEmail ?? '')
        setEditPhone(d.contactPhone ?? '')
        setEditPlan(d.planId ?? '')
        setLoading(false)
      })
      .catch(e => { setDrawerError(e instanceof Error ? e.message : 'Failed to load business details'); setLoading(false) })
  }

  useEffect(() => { reload(client.id) }, [client.id])

  const saveEdit = async () => {
    if (!detail) return
    setSaving(true)
    try {
      await commsApi.updateClient(detail.id, {
        name:         editName.trim()  || undefined,
        planId:       editPlan         || undefined,
        contactEmail: editEmail.trim() || undefined,
        contactPhone: editPhone.trim() || undefined,
      })
      setSaveOk(true)
      setTimeout(() => setSaveOk(false), 2000)
      reload(detail.id)
      onUpdated()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Save failed', 'error')
    } finally { setSaving(false) }
  }

  const toggleActive = async () => {
    if (!detail) return
    setSaving(true)
    try {
      await commsApi.updateClient(detail.id, { active: !detail.active })
      reload(detail.id)
      onUpdated()
    } finally { setSaving(false) }
  }

  const createKey = async () => {
    if (!detail || !newLabel) return
    setSaving(true)
    try {
      const k = await commsApi.createApiKey(detail.id, newLabel, ['messaging', 'analytics'])
      setFreshKey(k.key); setFreshKeyId(k.id)
      setShowFreshKey(false); setSecureSent(false)
      setNewLabel('')
      reload(detail.id)
    } finally { setSaving(false) }
  }

  const revokeKey = async (keyId: string) => {
    if (!detail || !confirm('Remove this access key?')) return
    await commsApi.revokeApiKey(keyId)
    reload(detail.id); onUpdated()
  }

  const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true); setTimeout(() => setCopied(false), 1500)
  }

  const TABS: { id: DrawerTab; label: string; icon: ComponentType<{ className?: string }> }[] = [
    { id: 'overview', label: 'Overview',  icon: BarChart2 },
    { id: 'edit',     label: 'Edit',      icon: Pencil    },
    { id: 'keys',     label: 'API Keys',  icon: KeyRound  },
  ]

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full sm:w-[500px] flex flex-col" style={{ background: 'hsl(262 20% 8%)', borderLeft: '1px solid rgba(255,255,255,0.09)' }}>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-primary/15 text-primary text-base font-bold flex items-center justify-center shrink-0">
                {(detail?.name ?? client.name)[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-foreground truncate text-base leading-tight">
                  {detail?.name ?? client.name}
                </h2>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">{detail?.slug ?? client.slug}</p>
                <button
                  onClick={() => void copyText(client.id)}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground/40 hover:text-muted-foreground font-mono mt-0.5 transition group"
                  title="Copy client ID"
                >
                  <span className="truncate max-w-[180px]">{client.id}</span>
                  <Copy className="w-2.5 h-2.5 shrink-0 opacity-0 group-hover:opacity-100 transition" />
                </button>
              </div>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition shrink-0 mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/07">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Status + plan strip */}
          {detail && !loading && (
            <div className="flex items-center gap-3 flex-wrap">
              <StatusDot status={detail.active ? 'active' : 'inactive'} label={detail.active ? 'Active' : 'Suspended'} size="sm" />
              <span className="text-muted-foreground/30 text-xs">·</span>
              <span className="text-xs text-muted-foreground capitalize">{detail.planName}</span>
              <span className="text-muted-foreground/30 text-xs">·</span>
              <span className="text-xs text-muted-foreground">{detail.usage?.sessionsActive ?? 0} session{(detail.usage?.sessionsActive ?? 0) !== 1 ? 's' : ''}</span>
              <span className="text-muted-foreground/30 text-xs">·</span>
              <span className="text-xs text-muted-foreground tabular-nums">{fmtNumber(detail.usage?.monthlyMessages ?? 0)} msg/mo</span>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 mt-4">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  tab === t.id
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/06'
                }`}>
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading…
            </div>
          ) : drawerError ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <AlertCircle className="w-8 h-8 text-red-400/60" />
              <p className="text-sm font-medium text-foreground">Failed to load details</p>
              <p className="text-xs text-muted-foreground max-w-xs">{drawerError}</p>
              <button className="text-xs text-primary hover:text-primary/80 transition mt-1" onClick={() => reload(client.id)}>
                Try again
              </button>
            </div>
          ) : detail && (
            <>
              {/* ── OVERVIEW TAB ── */}
              {tab === 'overview' && (
                <div className="space-y-4">
                  {/* Stat grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Sessions active',     value: String(detail.usage?.sessionsActive ?? 0) },
                      { label: 'Messages this month', value: fmtNumber(detail.usage?.monthlyMessages ?? 0) },
                      { label: 'Plan',                value: detail.planName ?? '—', cap: true },
                      { label: 'Member since',        value: fmtDate(detail.createdAt) },
                    ].map(s => (
                      <div key={s.label} className="rounded-xl border border-white/07 bg-card px-4 py-3.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-1">{s.label}</p>
                        <p className={`text-sm font-semibold text-foreground ${s.cap ? 'capitalize' : 'tabular-nums'}`}>{s.value}</p>
                      </div>
                    ))}
                  </div>

                  {detail.contactEmail && (
                    <div className="rounded-xl border border-white/07 bg-card px-4 py-3.5">
                      <p className={LABEL}>Contact email</p>
                      <p className="text-sm text-foreground truncate">{detail.contactEmail}</p>
                    </div>
                  )}
                  {detail.contactPhone && (
                    <div className="rounded-xl border border-white/07 bg-card px-4 py-3.5">
                      <p className={LABEL}>Contact phone</p>
                      <p className="text-sm text-foreground">{detail.contactPhone}</p>
                    </div>
                  )}

                  {/* Moderation actions */}
                  <div className="flex gap-2">
                    <button
                      disabled={saving}
                      onClick={async () => {
                        const reason = prompt('Warning reason (optional):') ?? undefined
                        setSaving(true)
                        try {
                          await commsApi.warnClient(detail.id, reason)
                          toast('Warning issued', 'success'); reload(detail.id)
                        } catch (e) { toast((e as Error).message, 'error') }
                        finally { setSaving(false) }
                      }}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold border border-orange-500/25 text-orange-400 hover:bg-orange-500/10 transition-colors disabled:opacity-40"
                    >
                      Issue Warning
                    </button>
                    <button
                      disabled={saving}
                      onClick={async () => {
                        const isSuspended = !detail.active
                        if (!isSuspended && !confirm(`Suspend "${detail.name}"?`)) return
                        setSaving(true)
                        try {
                          if (isSuspended) {
                            await commsApi.unsuspendClient(detail.id)
                            toast('Account reinstated', 'success')
                          } else {
                            const reason = prompt('Suspension reason:') ?? 'Operator action'
                            await commsApi.suspendClient(detail.id, reason)
                            toast('Account suspended', 'success')
                          }
                          reload(detail.id); onUpdated()
                        } catch (e) { toast((e as Error).message, 'error') }
                        finally { setSaving(false) }
                      }}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors border disabled:opacity-40 ${
                        detail.active
                          ? 'border-red-500/25 text-red-400 hover:bg-red-500/10'
                          : 'border-teal/25 text-teal hover:bg-teal/10'
                      }`}
                    >
                      {detail.active ? 'Suspend' : 'Reinstate'}
                    </button>
                  </div>

                  {/* Danger zone */}
                  <div className="pt-2 border-t border-white/05">
                    <button
                      className="text-xs text-muted-foreground/40 hover:text-red-400/70 transition-colors disabled:opacity-30 underline underline-offset-2 decoration-dotted"
                      disabled={saving}
                      onClick={async () => {
                        if (!confirm(`Permanently delete "${detail.name}"? This cannot be undone.`)) return
                        setSaving(true)
                        try { await commsApi.deleteClient(detail.id); onUpdated(); onClose() }
                        catch (e) { toast(e instanceof Error ? e.message : 'Delete failed', 'error') }
                        finally { setSaving(false) }
                      }}
                    >
                      Delete business permanently
                    </button>
                  </div>
                </div>
              )}

              {/* ── EDIT TAB ── */}
              {tab === 'edit' && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-white/07 bg-card p-4 space-y-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 border-b border-white/06 pb-3">Business info</p>

                    <div>
                      <label className={LABEL}>Business name</label>
                      <input className={FIELD} value={editName} onChange={e => setEditName(e.target.value)} placeholder="e.g. Acme Hospital" />
                    </div>

                    <div>
                      <label className={LABEL}>Slug <span className="text-muted-foreground/40 normal-case tracking-normal font-normal">(used in API calls)</span></label>
                      <input className={FIELD} value={editSlug} onChange={e => setEditSlug(e.target.value)} placeholder="e.g. acme-hospital" disabled
                        title="Slug cannot be changed after creation — it would break existing integrations" />
                      <p className="text-[10px] text-muted-foreground/40 mt-1.5">Slug is locked — changing it would break existing integrations.</p>
                    </div>

                    <div>
                      <label className={LABEL}>Contact email</label>
                      <input className={FIELD} type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} placeholder="contact@business.com" />
                    </div>

                    <div>
                      <label className={LABEL}>Contact phone</label>
                      <PhoneInput value={editPhone} onChange={setEditPhone} inputClassName={FIELD} />
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/07 bg-card p-4 space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 border-b border-white/06 pb-3">Subscription</p>

                    <div>
                      <label className={LABEL}>Plan</label>
                      <select className={FIELD} value={editPlan} onChange={e => setEditPlan(e.target.value)}>
                        {plans.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.displayName}{p.monthlyFee ? ` — ₦${p.monthlyFee.toLocaleString()}/mo` : ' — Free'}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={LABEL}>Access status</label>
                      <button
                        type="button"
                        onClick={toggleActive}
                        disabled={saving}
                        className={`w-full text-sm py-2.5 rounded-xl font-medium transition-colors border ${
                          detail.active
                            ? 'border-amber-500/25 text-amber-400 hover:bg-amber-500/10'
                            : 'border-teal/25 text-teal hover:bg-teal/10'
                        }`}
                      >
                        {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin inline mr-1.5" />Saving…</> : detail.active ? 'Suspend access' : 'Restore access'}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={saveEdit} disabled={saving || !editName.trim()}
                    className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {saving
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
                      : saveOk
                      ? <><Check className="w-3.5 h-3.5" /> Saved!</>
                      : <><Save className="w-3.5 h-3.5" /> Save changes</>}
                  </button>
                </div>
              )}

              {/* ── KEYS TAB ── */}
              {tab === 'keys' && (
                <div className="space-y-4">
                  {freshKey && freshKeyId && (
                    <div className="rounded-xl border border-primary/20 bg-primary/05 p-4 space-y-3">
                      <p className="text-xs font-bold text-primary">Key generated — how do you want to deliver it?</p>

                      {/* Option 1 — Secure email link */}
                      {!secureSent ? (
                        <div className="space-y-2">
                          {detail.contactEmail ? (
                            <button
                              className="w-full flex items-center gap-3 rounded-xl border border-primary/25 bg-primary/08 px-4 py-3 text-left hover:bg-primary/15 transition group"
                              onClick={async () => {
                                if (!detail) return
                                setSaving(true)
                                try {
                                  await commsApi.sendSecureKeyLink(detail.id, freshKeyId)
                                  setSecureSent(true)
                                } catch (e) {
                                  toast(e instanceof Error ? e.message : 'Failed to send secure link', 'error')
                                } finally { setSaving(false) }
                              }}
                              disabled={saving}
                            >
                              <KeyRound className="w-4 h-4 text-primary shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-foreground">Send secure link to email</p>
                                <p className="text-[10px] text-muted-foreground truncate">{detail.contactEmail}</p>
                              </div>
                            </button>
                          ) : (
                            <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/06 px-4 py-3">
                              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                              <p className="text-xs text-amber-300/80">No contact email on file. Add one in the Edit tab first.</p>
                            </div>
                          )}

                          {/* Option 2 — Show inline */}
                          {!showFreshKey ? (
                            <button
                              className="w-full flex items-center gap-3 rounded-xl border border-white/08 bg-white/03 px-4 py-3 text-left hover:bg-white/06 transition"
                              onClick={() => setShowFreshKey(true)}
                            >
                              <Eye className="w-4 h-4 text-muted-foreground shrink-0" />
                              <div>
                                <p className="text-xs font-semibold text-foreground">Show key here (once)</p>
                                <p className="text-[10px] text-muted-foreground">Only if you are physically with the client</p>
                              </div>
                            </button>
                          ) : (
                            <div className="rounded-xl border border-amber-500/20 bg-amber-500/05 p-3 space-y-2">
                              <p className="text-[10px] text-amber-400 font-semibold">Only share this in person — never over chat or email</p>
                              <p className="font-mono text-xs text-foreground break-all leading-relaxed">{freshKey}</p>
                              <button className="text-xs flex items-center gap-1.5 text-muted-foreground hover:text-teal transition"
                                onClick={() => void copyText(freshKey)}>
                                {copied ? <Check className="w-3.5 h-3.5 text-teal" /> : <Copy className="w-3.5 h-3.5" />}
                                {copied ? 'Copied!' : 'Copy'}
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 rounded-xl border border-teal/20 bg-teal/06 px-4 py-3">
                          <Check className="w-4 h-4 text-teal shrink-0" />
                          <p className="text-xs text-teal">Secure link sent to {detail.contactEmail}. Expires after one view or 24 hours.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Generate new key */}
                  <div className="rounded-xl border border-white/07 bg-card p-4 space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 border-b border-white/06 pb-3">Generate new key</p>
                    <div>
                      <label className={LABEL}>Key label</label>
                      <input className={FIELD} placeholder="e.g. Production, Staging" value={newLabel}
                        onChange={e => setNewLabel(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && newLabel) void createKey() }} />
                    </div>
                    <button className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      disabled={!newLabel || saving} onClick={createKey}>
                      {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating…</> : <><KeyRound className="w-3.5 h-3.5" /> Generate key</>}
                    </button>
                  </div>

                  {/* Existing keys */}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 mb-3">
                      Active keys ({(detail.apiKeys ?? []).length})
                    </p>
                    {(detail.apiKeys ?? []).length === 0 ? (
                      <div className="rounded-xl border border-white/07 bg-card px-4 py-8 text-center">
                        <KeyRound className="w-6 h-6 text-muted-foreground/20 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No keys yet</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {(detail.apiKeys ?? []).map((k: ApiKey) => (
                          <div key={k.id} className="rounded-xl border border-white/07 bg-card px-4 py-3 flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-medium text-foreground">{k.label}</p>
                                {k.lastUsedAt && (
                                  <span className="text-[10px] text-muted-foreground/50">used {fmtDate(k.lastUsedAt)}</span>
                                )}
                              </div>
                              <p className="font-mono text-xs text-muted-foreground">
                                {showKey[k.id] ? k.keyPreview : '••••••••••••••••' + k.keyPreview.slice(-8)}
                              </p>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <button className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/07 transition"
                                onClick={() => setShowKey(p => ({ ...p, [k.id]: !p[k.id] }))}>
                                {showKey[k.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                              <button className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/07 transition"
                                onClick={() => void copyText(k.keyPreview)}>
                                <Copy className="w-3.5 h-3.5" />
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
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function CreateBusinessModal({ plans, onCreated, onClose }: {
  plans: Plan[]
  onCreated: (c: Client) => void
  onClose: () => void
}) {
  const [name, setName]     = useState('')
  const [slug, setSlug]     = useState('')
  const [planId, setPlanId] = useState(plans[0]?.id ?? '')
  const [email, setEmail]   = useState('')
  const [phone, setPhone]   = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError]   = useState('')
  const [slugEdited, setSlugEdited] = useState(false)

  const handleName = (v: string) => {
    setName(v)
    if (!slugEdited) setSlug(toSlug(v))
  }

  const submit = async () => {
    if (!name.trim()) { setError('Enter a business name'); return }
    if (!slug.trim()) { setError('Enter a slug'); return }
    if (!planId)      { setError('Select a plan'); return }
    setCreating(true); setError('')
    try {
      const c = await commsApi.createClient({
        name: name.trim(),
        slug: slug.trim(),
        planId,
        contactEmail: email.trim() || undefined,
        contactPhone: phone.trim() || undefined,
      })
      onCreated(c)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create business')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-[#1a1624] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-5 border-b border-white/08">
          <h2 className="font-semibold text-foreground">Add business</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Creates a business account directly, without the self-service request flow.</p>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className={LABEL}>Business name</label>
            <input className={FIELD} placeholder="Acme Corp" value={name} onChange={e => handleName(e.target.value)} />
          </div>
          <div>
            <label className={LABEL}>Slug <span className="text-muted-foreground/40 normal-case font-normal">(used in URLs)</span></label>
            <input
              className={FIELD + ' font-mono'}
              placeholder="acme-corp"
              value={slug}
              onChange={e => { setSlugEdited(true); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')) }}
            />
          </div>
          <div>
            <label className={LABEL}>Plan</label>
            <select className={FIELD} value={planId} onChange={e => setPlanId(e.target.value)}>
              <option value="">Select plan…</option>
              {plans.map(p => <option key={p.id} value={p.id}>{p.displayName}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Contact email <span className="text-muted-foreground/40 normal-case font-normal">(optional)</span></label>
              <input className={FIELD} type="email" placeholder="hello@acme.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <label className={LABEL}>Contact phone <span className="text-muted-foreground/40 normal-case font-normal">(optional)</span></label>
              <PhoneInput value={phone} onChange={setPhone} inputClassName={FIELD} />
            </div>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
        <div className="px-6 py-4 border-t border-white/08 flex gap-2 justify-end">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary flex items-center gap-2" onClick={() => void submit()} disabled={creating}>
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Create business
          </button>
        </div>
      </div>
    </div>
  )
}

export function Businesses() {
  const [clients, setClients] = useState<Client[]>(() => pageCache.get<Client[]>('comms:clients') ?? [])
  const [plans, setPlans] = useState<Plan[]>(() => pageCache.get<Plan[]>('comms:plans') ?? [])
  const [loading, setLoading] = useState(() => !pageCache.get('comms:clients'))
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Client | null>(null)
  const [showCreate, setShowCreate] = useState(false)

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
        <button className="btn-primary flex items-center gap-2" onClick={() => setShowCreate(true)}>
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
        <EmptyState
          icon={<Users className="w-full h-full" />}
          title={search ? 'No businesses match your search' : 'No businesses yet'}
          description={search ? 'Try a different name or slug.' : 'Onboard your first business to manage their WhatsApp comms, automations, and billing from one place.'}
          action={!search ? { label: 'Add first business', onClick: () => setShowCreate(true) } : undefined}
          accent="#4AA89D"
        />
      ) : (
        <div className="rounded-2xl border border-white/07 bg-card overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: 640 }}>
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
        </div>
      )}

      {selected && (
        <ClientDrawer client={selected} plans={plans} onClose={() => setSelected(null)} onUpdated={load} />
      )}

      {showCreate && (
        <CreateBusinessModal
          plans={plans}
          onCreated={c => {
            setClients(prev => [c, ...prev])
            setShowCreate(false)
          }}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  )
}

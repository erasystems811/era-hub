import { useEffect, useState } from 'react'
import {
  Loader2, Upload, Plus, Send, X, Users, CheckCircle2,
  AlertCircle, Clock, Trash2, Pencil, Copy, ChevronDown, ChevronUp,
} from 'lucide-react'
import { broadcastApi, commsApi, type Broadcast, type BroadcastDetail, type Client } from '../../lib/comms-api'
import { useToast } from '../../components/Toast'
import { normalizePhoneList } from '../../components/PhoneInput'
import { EmptyState } from '../../components/EmptyState'

function StatusBadge({ status, hasFailed }: { status: string; hasFailed?: boolean }) {
  if (status === 'sent' && hasFailed) {
    return (
      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400">
        partial
      </span>
    )
  }
  const styles: Record<string, string> = {
    draft:     'bg-white/10 text-white/50',
    sending:   'bg-yellow-500/15 text-yellow-400',
    sent:      'bg-teal/15 text-teal',
    cancelled: 'bg-red-500/15 text-red-400',
  }
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${styles[status] ?? 'bg-white/10 text-white/50'}`}>
      {status}
    </span>
  )
}

const MODAL_FIELD = "w-full px-3 py-2.5 rounded-xl bg-[hsl(262_20%_11%)] border border-white/06 text-sm text-foreground placeholder:text-muted-foreground/40"
const MODAL_LABEL = "text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1"

interface BroadcastFormProps {
  title: string
  initialName?: string
  initialContent?: string
  initialPhones?: string
  showBusinessPicker?: boolean  // false when editing (business can't change)
  initialClientId?: string
  initialSessionId?: string
  saving: boolean
  onSubmit: (data: { name: string; content: string; phones: string; clientId: string; sessionId: string }) => void
  onClose: () => void
  submitLabel: string
}

function BroadcastForm({
  title, initialName = '', initialContent = '', initialPhones = '',
  showBusinessPicker = true, initialClientId = '', initialSessionId = '',
  saving, onSubmit, onClose, submitLabel,
}: BroadcastFormProps) {
  const [clients, setClients]       = useState<Client[]>([])
  const [clientId, setClientId]     = useState(initialClientId)
  const [sessionId, setSessionId]   = useState(initialSessionId)
  const [sessions, setSessions]     = useState<{ id: string; phoneNumber: string }[]>([])
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [name, setName]             = useState(initialName)
  const [content, setContent]       = useState(initialContent)
  const [phones, setPhones]         = useState(initialPhones)

  useEffect(() => {
    if (showBusinessPicker) commsApi.listClients().then(setClients).catch(() => {})
  }, [showBusinessPicker])

  useEffect(() => {
    if (!clientId) { setSessions([]); setSessionId(''); return }
    setLoadingSessions(true)
    commsApi.getClient(clientId)
      .then(detail => {
        const s = detail.sessions.map(s => ({ id: s.id, phoneNumber: s.phoneNumber }))
        setSessions(s)
        setSessionId(prev => prev || (s[0]?.id ?? ''))
      })
      .catch(() => {})
      .finally(() => setLoadingSessions(false))
  }, [clientId])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-card shadow-card-lg p-6 space-y-4 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">{title}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>

        <div className="space-y-3">
          {showBusinessPicker && (
            <>
              <div>
                <label className={MODAL_LABEL}>Business *</label>
                <select value={clientId} onChange={e => setClientId(e.target.value)} className={MODAL_FIELD}>
                  <option value="">Select business…</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className={MODAL_LABEL}>WhatsApp Number *</label>
                <select value={sessionId} onChange={e => setSessionId(e.target.value)}
                  disabled={!clientId || loadingSessions} className={`${MODAL_FIELD} disabled:opacity-50`}>
                  {!clientId && <option value="">Pick a business first…</option>}
                  {clientId && loadingSessions && <option value="">Loading numbers…</option>}
                  {clientId && !loadingSessions && sessions.length === 0 && <option value="">No numbers connected</option>}
                  {sessions.map(s => <option key={s.id} value={s.id}>{s.phoneNumber}</option>)}
                </select>
              </div>
            </>
          )}

          <div>
            <label className={MODAL_LABEL}>Broadcast Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. June Promo" className={MODAL_FIELD} />
          </div>

          <div>
            <label className={MODAL_LABEL}>Message *</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={4}
              placeholder="Type your message here…" className={`${MODAL_FIELD} resize-none`} />
            <p className="text-[10px] text-muted-foreground/50 mt-1">{content.length} characters</p>
          </div>

          <div>
            <label className={MODAL_LABEL}>Recipients — one per line or comma-separated</label>
            <textarea value={phones} onChange={e => setPhones(e.target.value)} rows={3}
              placeholder={"08012345678\n+2348087654321\n8099990000"}
              className={`${MODAL_FIELD} font-mono resize-none`} />
            <p className="text-[10px] text-muted-foreground/50 mt-1">
              Local (08012345678) and international (+2348012345678) formats both accepted
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-sm text-muted-foreground hover:text-foreground transition-colors">
            Cancel
          </button>
          <button onClick={() => onSubmit({ name, content, phones, clientId, sessionId })}
            disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-50"
            style={{ background: '#C4286F' }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : submitLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export function Broadcasts() {
  const showToast = useToast()
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([])
  const [loading, setLoading]       = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editBroadcast, setEditBroadcast] = useState<Broadcast | null>(null)
  const [sending, setSending]       = useState<string | null>(null)
  const [duplicating, setDuplicating] = useState<string | null>(null)
  const [savingCreate, setSavingCreate] = useState(false)
  const [savingEdit, setSavingEdit]     = useState(false)
  const [editPhones, setEditPhones]         = useState('')
  const [loadingEdit, setLoadingEdit]       = useState<string | null>(null)
  const [expandedId, setExpandedId]         = useState<string | null>(null)
  const [detail, setDetail]                 = useState<BroadcastDetail | null>(null)
  const [loadingDetail, setLoadingDetail]   = useState(false)

  async function load() {
    setLoading(true)
    try { setBroadcasts(await broadcastApi.list()) }
    catch (e) { showToast((e as Error).message, 'error') }
    finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [])

  async function handleCreate({ name, content, phones, clientId, sessionId }: {
    name: string; content: string; phones: string; clientId: string; sessionId: string
  }) {
    if (!clientId || !sessionId || !name.trim() || !content.trim()) {
      showToast('Please fill all required fields', 'error'); return
    }
    setSavingCreate(true)
    try {
      const res = await broadcastApi.create({ clientId, sessionId, name: name.trim(), content: content.trim(), recipients: normalizePhoneList(phones) })
      if (res.invalidRecipients > 0) {
        showToast(`${res.invalidRecipients} number(s) skipped — not in E.164 format (+country code required)`, 'error')
      }
      showToast('Broadcast created', 'success')
      setShowCreate(false)
      void load()
    } catch (e) { showToast((e as Error).message, 'error') }
    finally { setSavingCreate(false) }
  }

  async function handleEdit({ name, content, phones }: {
    name: string; content: string; phones: string; clientId: string; sessionId: string
  }) {
    if (!editBroadcast || !name.trim() || !content.trim()) {
      showToast('Name and message are required', 'error'); return
    }
    setSavingEdit(true)
    try {
      await broadcastApi.edit(editBroadcast.id, {
        name: name.trim(),
        content: content.trim(),
        recipients: phones.trim() ? normalizePhoneList(phones) : undefined,
      })
      showToast('Broadcast updated', 'success')
      setEditBroadcast(null)
      void load()
    } catch (e) { showToast((e as Error).message, 'error') }
    finally { setSavingEdit(false) }
  }

  async function send(id: string) {
    setSending(id)
    try {
      const res = await broadcastApi.send(id)
      showToast(`Queued ${res.queued} messages`, 'success')
      void load()
    } catch (e) { showToast((e as Error).message, 'error') }
    finally { setSending(null) }
  }

  async function duplicate(b: Broadcast) {
    setDuplicating(b.id)
    try {
      await broadcastApi.duplicate(b.id)
      showToast(`"${b.name}" duplicated as draft`, 'success')
      void load()
    } catch (e) { showToast((e as Error).message, 'error') }
    finally { setDuplicating(null) }
  }

  async function cancel(id: string) {
    try {
      await broadcastApi.cancel(id)
      showToast('Broadcast cancelled', 'success')
      void load()
    } catch (e) { showToast((e as Error).message, 'error') }
  }

  async function remove(id: string) {
    if (!confirm('Delete this broadcast?')) return
    try {
      await broadcastApi.delete(id)
      showToast('Deleted', 'success')
      void load()
    } catch (e) { showToast((e as Error).message, 'error') }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(196,40,111,0.15)' }}>
            <Upload className="w-4 h-4" style={{ color: '#C4286F' }} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Broadcasts</h1>
            <p className="text-xs text-muted-foreground">Bulk WhatsApp campaigns</p>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: '#C4286F' }}>
          <Plus className="w-3.5 h-3.5" /> New Broadcast
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : broadcasts.length === 0 ? (
        <EmptyState
          icon={<Upload className="w-full h-full" />}
          title="No broadcasts yet"
          description="Send a message to hundreds of contacts at once. Create your first broadcast campaign to get started."
          action={{ label: 'Create broadcast', onClick: () => setShowCreate(true) }}
          accent="#C4286F"
        />
      ) : (
        <div className="space-y-2">
          {broadcasts.map(b => {
            const isExpanded = expandedId === b.id
            const stripeColor = b.status === 'sent' && b.totalFailed > 0 ? '#EAB308'
              : b.status === 'sent' ? '#4AA89D'
              : b.status === 'sending' ? '#EAB308'
              : b.status === 'cancelled' ? '#ef4444'
              : 'rgba(255,255,255,0.12)'

            return (
            <div key={b.id} className="rounded-2xl border border-white/06 bg-card overflow-hidden hover:border-white/10 transition-colors">
              {/* Main row */}
              <div className="p-4 flex items-center gap-4">
              {/* Status stripe */}
              <div className="w-1 self-stretch rounded-full shrink-0" style={{ background: stripeColor }} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-foreground truncate">{b.name}</span>
                  <StatusBadge status={b.status} hasFailed={b.totalFailed > 0} />
                  <span className="text-[10px] text-muted-foreground/50 ml-1">{b.clientName}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate max-w-md">{b.content}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="w-3 h-3" /> {b.totalRecipients} recipients
                  </span>
                  {b.totalSent > 0 && (
                    <span className="text-xs text-teal flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> {b.totalSent} sent
                    </span>
                  )}
                  {b.totalFailed > 0 && (
                    <span className="text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {b.totalFailed} failed
                    </span>
                  )}
                  {b.status === 'sending' && (
                    <span className="text-xs text-yellow-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Sending…
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {b.status === 'draft' && (
                  <>
                    <button onClick={async () => {
                        setLoadingEdit(b.id)
                        try {
                          const detail = await broadcastApi.get(b.id)
                          setEditPhones(detail.recipients.map(r => r.phoneNumber).join('\n'))
                        } catch {
                          setEditPhones('')
                        } finally {
                          setLoadingEdit(null)
                        }
                        setEditBroadcast(b)
                      }}
                      disabled={loadingEdit === b.id}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/05 transition-colors disabled:opacity-40"
                      title="Edit broadcast">
                      {loadingEdit === b.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Pencil className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => void send(b.id)} disabled={sending === b.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                      style={{ background: '#C4286F' }}>
                      {sending === b.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                      Send
                    </button>
                    <button onClick={() => void remove(b.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
                {b.status === 'sending' && (
                  <button onClick={() => void cancel(b.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-white/10 text-muted-foreground hover:text-foreground">
                    <X className="w-3 h-3" /> Cancel
                  </button>
                )}
                {(b.status === 'sent' || b.status === 'cancelled') && (
                  <button onClick={() => void duplicate(b)} disabled={duplicating === b.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/05 transition-colors disabled:opacity-50"
                    title="Duplicate as new draft">
                    {duplicating === b.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Copy className="w-3 h-3" />}
                    Resend
                  </button>
                )}

                {/* Expand / collapse recipient list */}
                <button
                  onClick={async () => {
                    if (isExpanded) { setExpandedId(null); setDetail(null); return }
                    setExpandedId(b.id)
                    setDetail(null)
                    setLoadingDetail(true)
                    try { setDetail(await broadcastApi.get(b.id)) }
                    catch { /* ignore */ }
                    finally { setLoadingDetail(false) }
                  }}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/05 transition-colors"
                  title="Show recipients">
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
              </div>{/* end main row */}

              {/* Recipient detail panel */}
              {isExpanded && (
                <div className="border-t border-white/05 bg-black/20 px-5 py-3">
                  {loadingDetail ? (
                    <div className="flex items-center gap-2 py-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Loading recipients…</span>
                    </div>
                  ) : !detail ? (
                    <p className="text-xs text-muted-foreground py-1">Failed to load recipients.</p>
                  ) : detail.recipients.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-1">No recipients added yet.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {detail.recipients.map(r => (
                        <div key={r.id} className="flex items-center gap-3">
                          {r.status === 'sent'    && <CheckCircle2 className="w-3.5 h-3.5 text-teal shrink-0" />}
                          {r.status === 'failed'  && <AlertCircle  className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                          {r.status === 'pending' && <Clock        className="w-3.5 h-3.5 text-yellow-400 shrink-0" />}
                          <span className="text-xs font-mono text-foreground">{r.phoneNumber}</span>
                          {r.name && <span className="text-[10px] text-muted-foreground/60">{r.name}</span>}
                          {r.status === 'failed' && r.error && (
                            <span className="text-[10px] text-red-400/80 truncate max-w-xs" title={r.error}>{r.error}</span>
                          )}
                          {r.status === 'pending' && <span className="text-[10px] text-yellow-400/70">queued</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )})}
        </div>
      )}

      {showCreate && (
        <BroadcastForm
          title="New Broadcast"
          showBusinessPicker
          saving={savingCreate}
          onSubmit={handleCreate}
          onClose={() => setShowCreate(false)}
          submitLabel="Create Broadcast"
        />
      )}

      {editBroadcast && (
        <BroadcastForm
          title={`Edit — ${editBroadcast.name}`}
          showBusinessPicker={false}
          initialClientId={editBroadcast.clientId}
          initialSessionId=""
          initialName={editBroadcast.name}
          initialContent={editBroadcast.content}
          initialPhones={editPhones}
          saving={savingEdit}
          onSubmit={handleEdit}
          onClose={() => { setEditBroadcast(null); setEditPhones('') }}
          submitLabel="Save Changes"
        />
      )}
    </div>
  )
}

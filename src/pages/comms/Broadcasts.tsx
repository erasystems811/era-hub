import { useEffect, useState } from 'react'
import {
  Loader2, Upload, Plus, Send, X, Users, CheckCircle2,
  AlertCircle, Clock, ChevronRight, Trash2,
} from 'lucide-react'
import { broadcastApi, commsApi, type Broadcast, type Client } from '../../lib/comms-api'
import { useToast } from '../../components/Toast'

const STATUS_COLOURS: Record<string, string> = {
  draft:     'bg-white/10 text-white/50',
  sending:   'bg-yellow-500/15 text-yellow-400',
  sent:      'bg-teal/15 text-teal',
  cancelled: 'bg-red-500/15 text-red-400',
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_COLOURS[status] ?? 'bg-white/10 text-white/50'}`}>
      {status}
    </span>
  )
}

function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const showToast = useToast()
  const [clients, setClients]     = useState<Client[]>([])
  const [clientId, setClientId]   = useState('')
  const [sessionId, setSessionId] = useState('')
  const [name, setName]           = useState('')
  const [content, setContent]     = useState('')
  const [phones, setPhones]       = useState('')
  const [saving, setSaving]       = useState(false)

  useEffect(() => {
    commsApi.listClients().then(setClients).catch(() => {})
  }, [])

  const sessions = clients.find(c => c.id === clientId)
    ? [] // we load from full client detail if needed — for now just require clientId + manual sessionId
    : []

  async function submit() {
    if (!clientId || !sessionId || !name.trim() || !content.trim()) {
      showToast('Please fill all required fields', 'error'); return
    }
    const recipients = phones
      .split(/[\n,]+/)
      .map(p => p.trim())
      .filter(Boolean)
      .map(phoneNumber => ({ phoneNumber }))

    setSaving(true)
    try {
      await broadcastApi.create({ clientId, sessionId, name: name.trim(), content: content.trim(), recipients })
      showToast('Broadcast created', 'success')
      onCreated()
      onClose()
    } catch (e) {
      showToast((e as Error).message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-card shadow-card-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">New Broadcast</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Business *</label>
            <select
              value={clientId}
              onChange={e => setClientId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-[hsl(262_20%_11%)] border border-white/06 text-sm text-foreground"
            >
              <option value="">Select business…</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Session ID *</label>
            <input
              value={sessionId}
              onChange={e => setSessionId(e.target.value)}
              placeholder="Paste session UUID"
              className="w-full px-3 py-2.5 rounded-xl bg-[hsl(262_20%_11%)] border border-white/06 text-sm text-foreground placeholder:text-muted-foreground/40"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Broadcast Name *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. June Promo"
              className="w-full px-3 py-2.5 rounded-xl bg-[hsl(262_20%_11%)] border border-white/06 text-sm text-foreground placeholder:text-muted-foreground/40"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Message *</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={4}
              placeholder="Type your message here…"
              className="w-full px-3 py-2.5 rounded-xl bg-[hsl(262_20%_11%)] border border-white/06 text-sm text-foreground placeholder:text-muted-foreground/40 resize-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
              Recipients (optional) — one per line or comma-separated E.164
            </label>
            <textarea
              value={phones}
              onChange={e => setPhones(e.target.value)}
              rows={3}
              placeholder="+2348012345678&#10;+2348087654321"
              className="w-full px-3 py-2.5 rounded-xl bg-[hsl(262_20%_11%)] border border-white/06 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-sm text-muted-foreground hover:text-foreground transition-colors">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-50"
            style={{ background: '#C4286F' }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Create Broadcast'}
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
  const [sending, setSending]       = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      setBroadcasts(await broadcastApi.list())
    } catch (e) {
      showToast((e as Error).message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  async function send(id: string) {
    setSending(id)
    try {
      const res = await broadcastApi.send(id)
      showToast(`Queued ${res.queued} messages`, 'success')
      void load()
    } catch (e) {
      showToast((e as Error).message, 'error')
    } finally {
      setSending(null)
    }
  }

  async function cancel(id: string) {
    try {
      await broadcastApi.cancel(id)
      showToast('Broadcast cancelled', 'success')
      void load()
    } catch (e) {
      showToast((e as Error).message, 'error')
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this broadcast?')) return
    try {
      await broadcastApi.delete(id)
      showToast('Deleted', 'success')
      void load()
    } catch (e) {
      showToast((e as Error).message, 'error')
    }
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
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: '#C4286F' }}
        >
          <Plus className="w-3.5 h-3.5" /> New Broadcast
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : broadcasts.length === 0 ? (
        <div className="text-center py-20">
          <Upload className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No broadcasts yet</p>
          <button onClick={() => setShowCreate(true)} className="mt-3 text-sm font-medium" style={{ color: '#C4286F' }}>
            Create your first broadcast →
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {broadcasts.map(b => (
            <div key={b.id} className="rounded-2xl border border-white/06 bg-card p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-foreground truncate">{b.name}</span>
                  <StatusBadge status={b.status} />
                </div>
                <p className="text-xs text-muted-foreground truncate">{b.content}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="w-3 h-3" /> {b.totalRecipients} recipients
                  </span>
                  <span className="text-xs text-teal flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {b.totalSent} sent
                  </span>
                  {b.totalFailed > 0 && (
                    <span className="text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {b.totalFailed} failed
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">{b.clientName}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {b.status === 'draft' && (
                  <>
                    <button
                      onClick={() => void send(b.id)}
                      disabled={sending === b.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                      style={{ background: '#C4286F' }}
                    >
                      {sending === b.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                      Send
                    </button>
                    <button
                      onClick={() => void remove(b.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
                {b.status === 'sending' && (
                  <button
                    onClick={() => void cancel(b.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-white/10 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3 h-3" /> Cancel
                  </button>
                )}
                {b.status === 'sent' && (
                  <span className="text-xs text-teal flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Done</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreated={() => void load()} />}
    </div>
  )
}

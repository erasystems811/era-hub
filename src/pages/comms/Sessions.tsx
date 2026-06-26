import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Smartphone, RefreshCw, X, Loader2, KeyRound, UserCircle2, Upload, Hash, Send, ShieldOff, QrCode, Trash2 } from 'lucide-react'
import { StatusDot } from '../../components/StatusDot'
import { QRModal } from '../../components/QRModal'
import { commsApi, Session, Client } from '../../lib/comms-api'
import { timeAgo, fmtNumber } from '../../lib/utils'
import { pageCache } from '../../lib/cache'

const STATUS_LABEL: Record<string, string> = {
  pending_qr:   'Waiting for QR',
  warming_up:   'Warming up',
  connected:    'Connected',
  disconnected: 'Disconnected',
  flagged:      'Flagged',
  banned:       'Banned',
}

interface ConnectModal { sessionId: string; phoneNumber: string }

function AddSessionModal({ clients, onClose, onCreated }: {
  clients: Client[]
  onClose: () => void
  onCreated: (s: { id: string; phoneNumber: string }) => void
}) {
  const [clientId, setClientId] = useState('')
  const [phone, setPhone] = useState('+234')
  const [role, setRole] = useState<'primary' | 'backup'>('primary')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setLoading(true); setError(null)
    try {
      const s = await commsApi.createSession({ clientId, phoneNumber: phone, role })
      onCreated({ id: s.id, phoneNumber: s.phoneNumber })
    } catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-[rgba(255,255,255,0.09)] backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl">
        <div className="px-6 py-5 border-b border-white/08">
          <h2 className="font-semibold text-foreground">Connect a WhatsApp number</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Link a phone number to a business account</p>
        </div>
        <div className="px-6 py-5 space-y-4">
          {error && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</div>}
          <div>
            <label className="label">Business</label>
            <select className="input" value={clientId} onChange={e => setClientId(e.target.value)}>
              <option value="">Select a business</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">WhatsApp number</label>
            <input className="input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+2348012345678" />
          </div>
          <div>
            <label className="label">Role</label>
            <select className="input" value={role} onChange={e => setRole(e.target.value as 'primary' | 'backup')}>
              <option value="primary">Primary</option>
              <option value="backup">Backup</option>
            </select>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-white/08 flex gap-2 justify-end">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={!clientId || !phone || loading} onClick={submit}>
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Starting…</> : 'Continue to QR scan'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ConfirmStopModal({ session, onClose, onStopped }: { session: Session; onClose: () => void; onStopped: () => void }) {
  const [loading, setLoading] = useState(false)
  const stop = async () => {
    setLoading(true)
    try { await commsApi.stopSession(session.id); onStopped() }
    finally { setLoading(false) }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-[rgba(255,255,255,0.09)] backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
            <X className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Disconnect this number?</p>
            <p className="text-xs text-muted-foreground">{session.phoneNumber}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-5">This number will stop sending messages immediately. You can reconnect it anytime.</p>
        <div className="flex gap-2">
          <button className="btn-secondary flex-1" onClick={onClose}>Keep it</button>
          <button className="btn-danger flex-1" disabled={loading} onClick={stop}>
            {loading ? 'Disconnecting…' : 'Disconnect'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ProfileModal({ session, onClose, onSaved }: {
  session: Session
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName]               = useState('')
  const [description, setDescription] = useState('')
  const [pictureUrl, setPictureUrl]   = useState('')
  const [preview, setPreview]         = useState<string | null>(null)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [success, setSuccess]         = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string
      setPreview(dataUrl)
      setPictureUrl(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  const submit = async () => {
    if (!name.trim() && !description.trim() && !pictureUrl) {
      setError('Fill in at least one field'); return
    }
    setLoading(true); setError(null)
    try {
      await commsApi.updateSessionProfile(session.id, {
        name:        name.trim()        || null,
        description: description.trim() || null,
        pictureUrl:  pictureUrl         || null,
      })
      setSuccess(true)
      setTimeout(() => { onSaved(); onClose() }, 1200)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-[rgba(255,255,255,0.09)] backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl">
        <div className="px-6 py-5 border-b border-white/08">
          <h2 className="font-semibold text-foreground">WhatsApp Business Profile</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{session.phoneNumber} · changes are pushed to WhatsApp immediately if connected</p>
        </div>

        <div className="px-6 py-5 space-y-4">
          {error   && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</div>}
          {success && <div className="text-sm text-teal bg-teal/10 border border-teal/20 rounded-xl px-4 py-3">Profile saved and pushed to WhatsApp.</div>}

          {/* Picture */}
          <div>
            <label className="label">Logo / Profile picture</label>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-white/05 border border-white/10 overflow-hidden flex items-center justify-center flex-shrink-0">
                {preview
                  ? <img src={preview} alt="preview" className="w-full h-full object-cover" />
                  : <UserCircle2 className="w-7 h-7 text-muted-foreground/30" />}
              </div>
              <div className="flex-1 space-y-2">
                <button
                  className="btn-secondary text-xs flex items-center gap-1.5 w-full justify-center"
                  onClick={() => fileRef.current?.click()}>
                  <Upload className="w-3.5 h-3.5" /> Upload image
                </button>
                <input
                  className="input text-xs"
                  placeholder="Or paste an image URL"
                  value={preview ? '' : pictureUrl}
                  onChange={e => { setPictureUrl(e.target.value); setPreview(null) }}
                />
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
          </div>

          {/* Display name */}
          <div>
            <label className="label">Display name</label>
            <input
              className="input"
              placeholder="e.g. Chidera Store"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={25}
            />
            <p className="text-xs text-muted-foreground/50 mt-1">Shown in chats even if the contact hasn't saved the number · max 25 characters</p>
          </div>

          {/* Description */}
          <div>
            <label className="label">About / Description</label>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="e.g. We deliver fresh produce daily. Message us to order!"
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={139}
            />
            <p className="text-xs text-muted-foreground/50 mt-1">Shown on the WhatsApp profile page · max 139 characters</p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-white/08 flex gap-2 justify-end">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={loading || success} onClick={submit}>
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : 'Save profile'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function Sessions() {
  const nav = useNavigate()
  const [sessions, setSessions] = useState<Session[]>(() => pageCache.get<Session[]>('comms:sessions') ?? [])
  const [clients, setClients] = useState<Client[]>(() => pageCache.get<Client[]>('comms:clients') ?? [])
  const [loading, setLoading] = useState(() => !pageCache.get('comms:sessions'))
  const [showAdd, setShowAdd] = useState(false)
  const [qrModal, setQrModal] = useState<ConnectModal | null>(null)
  const [stopModal, setStopModal] = useState<Session | null>(null)
  const [profileModal, setProfileModal] = useState<Session | null>(null)
  const [pairingModal, setPairingModal] = useState<Session | null>(null)
  const [pairingPhone, setPairingPhone] = useState('')
  const [pairingCode, setPairingCode] = useState('')
  const [pairingLoading, setPairingLoading] = useState(false)
  const [testModal, setTestModal] = useState<Session | null>(null)
  const [testTo, setTestTo] = useState('')
  const [testContent, setTestContent] = useState('Hello! This is a test message from ERA Comms.')
  const [testLoading, setTestLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [s, c] = await Promise.all([commsApi.listSessions(), commsApi.listClients()])
      pageCache.set('comms:sessions', s); pageCache.set('comms:clients', c)
      setSessions(s); setClients(c)
    } finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [])

  const connected  = sessions.filter(s => s.status === 'connected').length
  const issues     = sessions.filter(s => ['flagged', 'banned', 'disconnected'].includes(s.status)).length
  const warming    = sessions.filter(s => s.status === 'warming_up').length

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="page-title">WhatsApp Sessions</h1>
          <p className="caption mt-0.5">
            {connected} connected · {sessions.length} total
            {issues > 0 && <span className="text-red-400 ml-2">· {issues} need attention</span>}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button className="btn-secondary flex items-center gap-2 text-sm" onClick={load} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button className="btn-secondary flex items-center gap-2 text-sm" onClick={() => nav('/comms/connect-session')}>
            <KeyRound className="w-3.5 h-3.5" /> OTP Connect
          </button>
          <button className="btn-primary flex items-center gap-2 text-sm" onClick={() => setShowAdd(true)}>
            <Plus className="w-4 h-4" /> Connect number
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total',     value: sessions.length, color: 'text-foreground' },
          { label: 'Connected', value: connected,        color: 'text-teal' },
          { label: 'Warming',   value: warming,          color: 'text-amber-400' },
          { label: 'Issues',    value: issues,           color: issues > 0 ? 'text-red-400' : 'text-muted-foreground' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-white/08 bg-card px-5 py-4">
            <p className="text-xs text-muted-foreground font-medium mb-1">{s.label}</p>
            <p className={`text-2xl font-bold tabular-nums ${s.color}`}>{loading ? '—' : s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading sessions…
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-2xl border border-white/07 bg-card flex flex-col items-center justify-center py-16 gap-3">
          <Smartphone className="w-10 h-10 text-muted-foreground/20" />
          <p className="font-semibold text-foreground">No WhatsApp numbers connected yet</p>
          <p className="caption text-sm">Connect the first number to start sending messages</p>
          <button className="btn-primary mt-1" onClick={() => setShowAdd(true)}>Connect a number</button>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/07 bg-card overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: 680 }}>
            <thead>
              <tr className="border-b border-white/07">
                {['Number', 'Business', 'Status', 'Messages sent', 'Last seen', 'Warmup', ''].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-5 py-3.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/05">
              {sessions.map(s => {
                const isIssue = ['flagged', 'banned', 'disconnected'].includes(s.status)
                return (
                  <tr key={s.id} className={`transition-colors ${isIssue ? 'bg-red-500/[0.03]' : 'hover:bg-white/[0.025]'}`}>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-foreground">{s.phoneNumber}</p>
                      <button
                        className="text-xs text-muted-foreground/40 hover:text-white/60 transition font-mono"
                        title="Copy session ID"
                        onClick={() => { void navigator.clipboard.writeText(s.id); alert('Session ID copied!') }}>
                        {s.id.slice(0, 8)}…
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground text-sm truncate max-w-[140px]">{s.client.name}</td>
                    <td className="px-5 py-3.5">
                      <StatusDot status={s.status} label={STATUS_LABEL[s.status] ?? s.status} size="sm" />
                    </td>
                    <td className="px-5 py-3.5 text-foreground tabular-nums">{fmtNumber(s.messagesSentTotal)}</td>
                    <td className="px-5 py-3.5 text-muted-foreground text-xs whitespace-nowrap">{timeAgo(s.lastHeartbeatAt)}</td>
                    <td className="px-5 py-3.5">
                      {s.warmup.isComplete
                        ? <span className="text-xs text-teal font-semibold">Complete</span>
                        : s.warmup.currentDay != null
                        ? <span className="text-xs text-amber-400">Day {s.warmup.currentDay}</span>
                        : <span className="text-xs text-muted-foreground/40">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        {s.status === 'connected' && (
                          <button className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/40 hover:text-teal-400 hover:bg-teal-500/10 transition"
                            onClick={() => { setTestModal(s); setTestTo(''); setTestContent('Hello! This is a test message from ERA Comms.') }} title="Send test message">
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {(s.status === 'pending_qr' || s.status === 'disconnected' || s.status === 'connecting') && (
                          <button className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/40 hover:text-teal-400 hover:bg-teal-500/10 transition"
                            onClick={() => setQrModal({ sessionId: s.id, phoneNumber: s.phoneNumber })}
                            title={s.status === 'pending_qr' ? 'Show QR' : 'Reconnect'}>
                            <QrCode className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {s.status === 'banned' && (
                          <button className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/40 hover:text-amber-400 hover:bg-amber-500/10 transition"
                            onClick={async () => {
                              try { await commsApi.unbanSession(s.id); void load() }
                              catch (e) { alert('Error: ' + (e as Error).message) }
                            }} title="Unban session">
                            <ShieldOff className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/40 hover:text-purple-400 hover:bg-purple-500/10 transition"
                          onClick={() => { setPairingModal(s); setPairingPhone(''); setPairingCode('') }} title="Link with pairing code (no QR)">
                          <Hash className="w-3.5 h-3.5" />
                        </button>
                        <button className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/40 hover:text-blue-400 hover:bg-blue-500/10 transition"
                          onClick={() => setProfileModal(s)} title="Set WhatsApp profile">
                          <UserCircle2 className="w-3.5 h-3.5" />
                        </button>
                        <button className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/40 hover:text-red-400 hover:bg-red-500/10 transition"
                          title="Reset credentials — only use if session is stuck"
                          onClick={async () => {
                            if (!confirm('This wipes WhatsApp credentials. Only do this if the session is stuck. Continue?')) return
                            try { await commsApi.resetSessionCredentials(s.id); alert('Credentials cleared. Use # button to re-link.') }
                            catch (e) { alert('Failed: ' + (e as Error).message) }
                          }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/40 hover:text-red-400 hover:bg-red-500/10 transition"
                          onClick={() => setStopModal(s)} title="Disconnect">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {showAdd && (
        <AddSessionModal clients={clients} onClose={() => setShowAdd(false)}
          onCreated={s => { setShowAdd(false); setQrModal({ sessionId: s.id, phoneNumber: s.phoneNumber }); void load() }} />
      )}

      {qrModal && (
        <QRModal sessionId={qrModal.sessionId} phoneNumber={qrModal.phoneNumber}
          onClose={() => setQrModal(null)} onConnected={() => { setQrModal(null); void load() }} />
      )}

      {stopModal && (
        <ConfirmStopModal session={stopModal} onClose={() => setStopModal(null)}
          onStopped={() => { setStopModal(null); void load() }} />
      )}

      {profileModal && (
        <ProfileModal session={profileModal} onClose={() => setProfileModal(null)}
          onSaved={() => void load()} />
      )}

      {testModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1729] border border-white/10 rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-base font-semibold text-white mb-1">Send test message</h2>
            <p className="text-xs text-white/40 mb-4">Via {testModal.phoneNumber}</p>
            <input
              className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/20 mb-2"
              placeholder="Send to: +2348012345678"
              value={testTo}
              onChange={e => setTestTo(e.target.value)}
            />
            <textarea
              className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/20 mb-3 resize-none"
              rows={3}
              value={testContent}
              onChange={e => setTestContent(e.target.value)}
            />
            <div className="flex gap-2">
              <button onClick={() => setTestModal(null)} className="flex-1 py-2 rounded-xl border border-white/10 text-sm text-white/50 hover:text-white transition">Cancel</button>
              <button
                disabled={testLoading || !testTo || !testContent}
                className="flex-1 py-2 rounded-xl bg-[#bf7c93] text-white text-sm font-semibold disabled:opacity-50"
                onClick={async () => {
                  setTestLoading(true)
                  try {
                    await commsApi.sendTestMessage(testModal.id, testTo, testContent)
                    alert('Queued ✓  —  arrives within a few seconds (anti-spam jitter applied).')
                    setTestModal(null)
                  } catch (e) { alert('Error: ' + (e as Error).message) }
                  finally { setTestLoading(false) }
                }}>
                {testLoading ? 'Sending…' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}

      {pairingModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1729] border border-white/10 rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-base font-semibold text-white mb-1">Link with pairing code</h2>
            <p className="text-xs text-white/40 mb-4">Enter the WhatsApp number for this session. A code will appear — enter it in WhatsApp → Linked Devices → Link with phone number.</p>

            {!pairingCode ? (
              <>
                <input
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/20 mb-3"
                  placeholder="+2348012345678"
                  value={pairingPhone}
                  onChange={e => setPairingPhone(e.target.value)}
                />
                <div className="flex gap-2">
                  <button onClick={() => setPairingModal(null)} className="flex-1 py-2 rounded-xl border border-white/10 text-sm text-white/50 hover:text-white transition">Cancel</button>
                  <button
                    disabled={pairingLoading || !pairingPhone}
                    className="flex-1 py-2 rounded-xl bg-[#bf7c93] text-white text-sm font-semibold disabled:opacity-50"
                    onClick={async () => {
                      setPairingLoading(true)
                      try {
                        const { code } = await commsApi.requestPairingCode(pairingModal.id, pairingPhone)
                        setPairingCode(code)
                      } catch (e) { alert('Error: ' + (e as Error).message) }
                      finally { setPairingLoading(false) }
                    }}>
                    {pairingLoading ? 'Getting code…' : 'Get code'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="bg-black/30 border border-white/10 rounded-xl p-4 text-center mb-4">
                  <p className="text-xs text-white/40 mb-1">Enter this code in WhatsApp</p>
                  <p className="text-3xl font-mono font-bold text-[#bf7c93] tracking-widest">{pairingCode}</p>
                </div>
                <button onClick={() => setPairingModal(null)} className="w-full py-2 rounded-xl bg-white/05 text-sm text-white/70 hover:text-white transition">Done</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

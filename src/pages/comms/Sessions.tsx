import { useEffect, useState } from 'react'
import { Plus, Smartphone, RefreshCw, X } from 'lucide-react'
import { Glass } from '../../components/Glass'
import { StatusDot } from '../../components/StatusDot'
import { QRModal } from '../../components/QRModal'
import { commsApi, Session, Client } from '../../lib/comms-api'
import { timeAgo, fmtNumber } from '../../lib/utils'
import { pageCache } from '../../lib/cache'

const STATUS_LABEL: Record<string, string> = {
  pending_qr: 'Waiting for QR scan',
  warming_up: 'Warming up',
  connected: 'Connected',
  disconnected: 'Disconnected — reconnect now',
  flagged: 'Flagged by WhatsApp',
  banned: 'Number banned',
}

interface ConnectModal {
  sessionId: string
  phoneNumber: string
}

function AddSessionModal({
  clients, onClose, onCreated,
}: {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <Glass className="w-[400px]">
        <h2 className="section-title mb-5">Connect a WhatsApp number</h2>
        {error && <p className="text-sm text-rose mb-4">{error}</p>}
        <div className="space-y-4">
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
        <div className="flex gap-2 mt-6">
          <button className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
          <button className="btn-primary flex-1" disabled={!clientId || !phone || loading} onClick={submit}>
            {loading ? 'Starting…' : 'Continue to QR scan'}
          </button>
        </div>
      </Glass>
    </div>
  )
}

function ConfirmStopModal({ session, onClose, onStopped }: {
  session: Session; onClose: () => void; onStopped: () => void
}) {
  const [loading, setLoading] = useState(false)
  const stop = async () => {
    setLoading(true)
    try { await commsApi.stopSession(session.id); onStopped() }
    finally { setLoading(false) }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <Glass className="w-[360px]">
        <h2 className="section-title mb-2">Disconnect this number?</h2>
        <p className="caption mb-5">{session.phoneNumber} will stop sending messages immediately. You can reconnect it later.</p>
        <div className="flex gap-2">
          <button className="btn-secondary flex-1" onClick={onClose}>Keep it</button>
          <button className="btn-danger flex-1" disabled={loading} onClick={stop}>
            {loading ? 'Disconnecting…' : 'Disconnect'}
          </button>
        </div>
      </Glass>
    </div>
  )
}

export function Sessions() {
  const [sessions, setSessions] = useState<Session[]>(() => pageCache.get<Session[]>('comms:sessions') ?? [])
  const [clients, setClients] = useState<Client[]>(() => pageCache.get<Client[]>('comms:clients') ?? [])
  const [loading, setLoading] = useState(() => !pageCache.get('comms:sessions'))
  const [showAdd, setShowAdd] = useState(false)
  const [qrModal, setQrModal] = useState<ConnectModal | null>(null)
  const [stopModal, setStopModal] = useState<Session | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const [s, c] = await Promise.all([commsApi.listSessions(), commsApi.listClients()])
      pageCache.set('comms:sessions', s); pageCache.set('comms:clients', c)
      setSessions(s); setClients(c)
    } finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [])

  const activeCount = sessions.filter(s => s.status === 'connected').length
  const issueCount = sessions.filter(s => ['flagged', 'banned', 'disconnected'].includes(s.status)).length

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Sessions</h1>
          <p className="caption mt-0.5">
            {activeCount} connected · {sessions.length} total
            {issueCount > 0 && <span className="text-rose ml-2">· {issueCount} need attention</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary flex items-center gap-2" onClick={load} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button className="btn-primary flex items-center gap-2" onClick={() => setShowAdd(true)}>
            <Plus className="w-4 h-4" /> Connect number
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-charcoal-soft">Loading…</div>
      ) : sessions.length === 0 ? (
        <Glass className="text-center py-12">
          <Smartphone className="w-10 h-10 text-pink mx-auto mb-3 opacity-40" />
          <p className="font-medium text-charcoal">No WhatsApp numbers connected yet</p>
          <p className="caption mt-1">Connect the first number to start sending messages</p>
          <button className="btn-primary mt-4" onClick={() => setShowAdd(true)}>Connect a number</button>
        </Glass>
      ) : (
        <div className="glass overflow-hidden" style={{ padding: 0 }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(233,145,200,0.2)' }}>
                {['Number', 'Business', 'Status', 'Messages sent', 'Last seen', 'Warmup', ''].map(h => (
                  <th key={h} className="text-left text-xs text-charcoal-soft font-medium px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sessions.map(s => {
                const needsAction = ['flagged', 'banned', 'disconnected', 'pending_qr'].includes(s.status)
                return (
                  <tr key={s.id} className={`border-b border-pink-border last:border-0 ${needsAction ? 'bg-rose/[0.03]' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-charcoal">{s.phoneNumber}</div>
                      <div className="text-xs text-charcoal-soft capitalize">{s.role}</div>
                    </td>
                    <td className="px-4 py-3 text-charcoal-soft">{s.client.name}</td>
                    <td className="px-4 py-3">
                      <StatusDot status={s.status} label={STATUS_LABEL[s.status] ?? s.status} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-charcoal-soft">{fmtNumber(s.messagesSentTotal)}</td>
                    <td className="px-4 py-3 text-charcoal-soft text-xs">{timeAgo(s.lastHeartbeatAt)}</td>
                    <td className="px-4 py-3">
                      {s.warmup.isComplete
                        ? <span className="text-xs text-teal font-medium">Complete</span>
                        : s.warmup.currentDay != null
                        ? <span className="text-xs text-charcoal-soft">Day {s.warmup.currentDay}</span>
                        : <span className="text-xs text-charcoal-soft opacity-40">—</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {s.status === 'pending_qr' && (
                          <button
                            className="text-xs text-teal font-medium hover:underline"
                            onClick={() => setQrModal({ sessionId: s.id, phoneNumber: s.phoneNumber })}
                          >
                            Show QR
                          </button>
                        )}
                        {s.status === 'disconnected' && (
                          <button
                            className="text-xs text-teal font-medium hover:underline"
                            onClick={() => setQrModal({ sessionId: s.id, phoneNumber: s.phoneNumber })}
                          >
                            Reconnect
                          </button>
                        )}
                        <button
                          className="text-xs text-charcoal-soft hover:text-rose transition-colors"
                          onClick={() => setStopModal(s)}
                          title="Disconnect"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <AddSessionModal
          clients={clients}
          onClose={() => setShowAdd(false)}
          onCreated={s => { setShowAdd(false); setQrModal({ sessionId: s.id, phoneNumber: s.phoneNumber }); void load() }}
        />
      )}

      {qrModal && (
        <QRModal
          sessionId={qrModal.sessionId}
          phoneNumber={qrModal.phoneNumber}
          onClose={() => setQrModal(null)}
          onConnected={() => { setQrModal(null); void load() }}
        />
      )}

      {stopModal && (
        <ConfirmStopModal
          session={stopModal}
          onClose={() => setStopModal(null)}
          onStopped={() => { setStopModal(null); void load() }}
        />
      )}
    </div>
  )
}

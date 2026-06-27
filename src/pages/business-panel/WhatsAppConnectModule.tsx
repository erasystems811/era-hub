import { useEffect, useState, useRef } from 'react'
import { Loader2, Smartphone, CheckCircle2, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { bizApi } from './business-api'
import { getCommsApi } from '../../lib/config'
import { PhoneInput } from '../../components/PhoneInput'

type Session = { id: string; phoneNumber: string; status: string; connectedAt: string | null; createdAt: string }

const STATUS_LABEL: Record<string, string> = {
  pending_qr:   'Waiting for QR scan',
  connecting:   'Connecting…',
  warming_up:   'Connected (warming up)',
  connected:    'Connected',
  disconnected: 'Disconnected',
  flagged:      'Flagged',
  banned:       'Banned',
}

function QRPanel({ sessionId, onConnected }: { sessionId: string; onConnected: () => void }) {
  const [qr, setQr]           = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const base = getCommsApi().replace(/^http/, 'ws')
    const ws = new WebSocket(`${base}/v1/admin/sessions/${sessionId}/qr`)
    wsRef.current = ws

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data as string) as { type: string; qr?: string }
        if (msg.type === 'qr' && msg.qr) {
          setQr(msg.qr)
        } else if (msg.type === 'connected') {
          setConnected(true)
          onConnected()
        }
      } catch { /* ignore parse errors */ }
    }

    ws.onerror = () => setError('Connection to ERA Comms lost. Reload to try again.')
    ws.onclose = () => { if (!connected) setError('QR session expired. Request a new QR code.') }

    return () => { ws.close() }
  }, [sessionId])

  if (connected) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <CheckCircle2 className="w-12 h-12 text-teal" />
        <p className="text-sm font-semibold text-foreground">WhatsApp connected!</p>
        <p className="text-xs text-muted-foreground">Your number is now active on ERA Comms.</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <WifiOff className="w-10 h-10 text-red-400" />
        <p className="text-xs text-red-400 text-center">{error}</p>
      </div>
    )
  }

  if (!qr) {
    return (
      <div className="flex flex-col items-center gap-3 py-10">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        <p className="text-xs text-muted-foreground">Generating QR code…</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="p-3 bg-white rounded-xl">
        <img src={qr} alt="WhatsApp QR code" className="w-56 h-56" />
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-medium text-foreground">Scan with WhatsApp</p>
        <p className="text-xs text-muted-foreground">Open WhatsApp → Linked Devices → Link a Device</p>
      </div>
    </div>
  )
}

export function WhatsAppConnectModule() {
  const [sessions, setSessions]   = useState<Session[]>([])
  const [loading, setLoading]     = useState(true)
  const [phone, setPhone]         = useState('')
  const [connecting, setConnecting] = useState(false)
  const [activeSession, setActiveSession] = useState<string | null>(null)
  const [error, setError]         = useState<string | null>(null)

  async function loadSessions() {
    try {
      setSessions(await bizApi.listWhatsAppSessions())
    } catch { /* silent */ }
    finally { setLoading(false) }
  }

  useEffect(() => { void loadSessions() }, [])

  async function requestConnect() {
    if (!phone.trim()) { setError('Enter your phone number'); return }
    if (!/^\+[1-9]\d{6,14}$/.test(phone.trim())) { setError('Use E.164 format: +2348012345678'); return }
    setConnecting(true); setError(null)
    try {
      const res = await bizApi.connectWhatsApp(phone.trim())
      setActiveSession(res.sessionId)
      await loadSessions()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setConnecting(false)
    }
  }

  const connected = sessions.filter(s => s.status === 'connected' || s.status === 'warming_up')
  const pending   = sessions.filter(s => s.status === 'pending_qr' || s.status === 'connecting')

  return (
    <div className="max-w-xl mx-auto space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Smartphone className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h2 className="text-base font-bold text-foreground">Connect WhatsApp</h2>
          <p className="text-xs text-muted-foreground">Link your number to ERA Comms</p>
        </div>
      </div>

      {/* Connected sessions */}
      {connected.length > 0 && (
        <div className="space-y-2">
          {connected.map(s => (
            <div key={s.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-teal/08 border border-teal/15">
              <Wifi className="w-4 h-4 text-teal shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground">{s.phoneNumber}</div>
                <div className="text-xs text-teal">{STATUS_LABEL[s.status] ?? s.status}</div>
              </div>
              <CheckCircle2 className="w-4 h-4 text-teal shrink-0" />
            </div>
          ))}
        </div>
      )}

      {/* Pending sessions */}
      {pending.map(s => (
        <div key={s.id} className="rounded-2xl border border-white/10 bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-foreground">{s.phoneNumber}</div>
              <div className="text-xs text-yellow-400">{STATUS_LABEL[s.status] ?? s.status}</div>
            </div>
            <button onClick={() => setActiveSession(activeSession === s.id ? null : s.id)}
              className="text-xs text-muted-foreground hover:text-foreground border border-white/10 px-3 py-1.5 rounded-lg transition-colors">
              {activeSession === s.id ? 'Hide QR' : 'Show QR'}
            </button>
          </div>
          {activeSession === s.id && (
            <QRPanel sessionId={s.id} onConnected={() => void loadSessions()} />
          )}
        </div>
      ))}

      {/* New connection form */}
      <div className="rounded-2xl border border-white/06 bg-card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Add a New Number</h3>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
            Your WhatsApp Number
          </label>
          <PhoneInput
            value={phone}
            onChange={setPhone}
            inputClassName="w-full px-3 py-2.5 rounded-xl bg-[hsl(262_20%_11%)] border border-white/06 text-sm text-foreground placeholder:text-muted-foreground/40"
          />
          {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}
        </div>
        <button
          onClick={() => void requestConnect()}
          disabled={connecting}
          className="w-full py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ background: '#C4286F' }}
        >
          {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
          Generate QR Code
        </button>
      </div>

      {loading && (
        <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      )}
    </div>
  )
}

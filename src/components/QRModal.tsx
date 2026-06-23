import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { X, RefreshCw, Smartphone, AlertTriangle } from 'lucide-react'
import { commsQrSocket } from '../lib/comms-api'
import { Glass } from './Glass'

interface Props {
  sessionId: string
  phoneNumber: string
  onClose: () => void
  onConnected: () => void
}

type Phase = 'waiting' | 'qr' | 'connected' | 'expired'

export function QRModal({ sessionId, phoneNumber, onClose, onConnected }: Props) {
  const [phase, setPhase] = useState<Phase>('waiting')
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    let settled = false
    const settle = (p: Phase, msg?: string) => {
      if (settled) return
      settled = true
      if (msg) setErrorMsg(msg)
      setPhase(p)
    }

    const ws = commsQrSocket(sessionId)
    wsRef.current = ws

    // 60-second timeout — if no QR arrives, show an actionable error
    const timeout = setTimeout(() => {
      settle('expired', 'No QR code received after 60 seconds. The WhatsApp worker may be starting up — try closing and connecting again.')
      ws.close()
    }, 60_000)

    ws.onmessage = async (evt) => {
      try {
        const msg = JSON.parse(evt.data as string) as { type: string; code?: string; data?: string }
        const qrCode = msg.code ?? msg.data
        if (msg.type === 'qr' && qrCode) {
          clearTimeout(timeout)
          const url = await QRCode.toDataURL(qrCode, { width: 280, margin: 2 })
          setQrDataUrl(url)
          setPhase('qr')
        } else if (msg.type === 'connected') {
          clearTimeout(timeout)
          setPhase('connected')
          setTimeout(() => { onConnected(); onClose() }, 2500)
        } else if (msg.type === 'expired' || msg.type === 'error') {
          clearTimeout(timeout)
          settle('expired', (msg as { reason?: string }).reason ?? 'QR code expired')
        }
      } catch { /* ignore malformed */ }
    }

    ws.onerror = () => {
      clearTimeout(timeout)
      settle('expired', 'Could not connect to the session server. Check that the ERA Comms API is running.')
    }

    ws.onclose = (evt) => {
      clearTimeout(timeout)
      if (phase === 'waiting' || phase === 'qr') {
        settle('expired', evt.reason
          ? `Connection closed: ${evt.reason}`
          : 'Connection to session server closed unexpectedly.')
      }
    }

    return () => { clearTimeout(timeout); ws.close() }
  }, [sessionId, onClose, onConnected])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <Glass className="relative w-[380px] text-center" style={{ padding: '2rem' }}>
        <button
          className="absolute top-4 right-4 btn-ghost p-1.5"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </button>

        {phase === 'waiting' && (
          <>
            <div className="w-16 h-16 rounded-2xl bg-teal-light flex items-center justify-center mx-auto mb-4">
              <Smartphone className="w-8 h-8 text-teal" />
            </div>
            <h2 className="section-title mb-2">Generating QR code</h2>
            <p className="caption">Getting ready to connect {phoneNumber}…</p>
            <div className="mt-5 flex gap-1 justify-center">
              {[0,1,2].map(i => (
                <div key={i} className="w-2 h-2 rounded-full bg-pink animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </>
        )}

        {phase === 'qr' && qrDataUrl && (
          <>
            <div className="text-xs font-medium text-teal uppercase tracking-widest mb-3">Step 5 of 6</div>
            <h2 className="section-title mb-1">Scan this code</h2>
            <p className="caption mb-5">Open WhatsApp on {phoneNumber}, go to Linked Devices, and scan this code</p>
            <div className="glass-sm p-3 inline-block mx-auto mb-5" style={{ borderRadius: '16px' }}>
              <img src={qrDataUrl} alt="WhatsApp QR" className="w-[240px] h-[240px] rounded-xl" />
            </div>
            <p className="text-xs text-charcoal-soft">Code refreshes automatically if it expires</p>
          </>
        )}

        {phase === 'connected' && (
          <>
            <div className="w-16 h-16 rounded-2xl bg-teal-light flex items-center justify-center mx-auto mb-4">
              <div className="text-3xl">✓</div>
            </div>
            <h2 className="section-title mb-2">Connected</h2>
            <p className="caption">{phoneNumber} is now active and ready to send messages</p>
          </>
        )}

        {phase === 'expired' && (
          <>
            <div className="w-16 h-16 rounded-2xl bg-pink-light flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-pink" />
            </div>
            <h2 className="section-title mb-2">Connection failed</h2>
            {errorMsg && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 mb-4 text-left leading-relaxed">
                {errorMsg}
              </p>
            )}
            <button className="btn-primary" onClick={onClose}>Close &amp; try again</button>
          </>
        )}
      </Glass>
    </div>
  )
}

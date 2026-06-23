import { useState, useEffect } from 'react'
import { Brain, CheckCircle, XCircle } from 'lucide-react'
import { getCoreApi, getCoreSecret, saveCoreConfig } from '../../lib/config'

const PURPLE = '#9B7FD4'

export function CoreSettings() {
  const [url, setUrl] = useState('')
  const [secret, setSecret] = useState('')
  const [status, setStatus] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle')
  const [stats, setStats] = useState<{ total: number; processed: number; pending: number } | null>(null)

  useEffect(() => {
    setUrl(getCoreApi())
    setSecret(getCoreSecret())
  }, [])

  async function saveAndTest() {
    const cleanUrl = url.trim().replace(/\/+$/, '')
    const cleanSecret = secret.trim()
    if (!cleanUrl || !cleanSecret) return

    setStatus('testing')
    setStats(null)

    try {
      const res = await fetch(`${cleanUrl}/health`)
      if (!res.ok) throw new Error()

      saveCoreConfig(cleanUrl, cleanSecret)
      setStatus('ok')

      const s = await fetch(`${cleanUrl}/v1/ingest/status`, {
        headers: { 'x-core-secret': cleanSecret },
      })
      if (s.ok) setStats(await s.json())
    } catch {
      setStatus('fail')
    }
  }

  return (
    <div className="max-w-lg mx-auto py-8 px-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${PURPLE}22`, border: `1px solid ${PURPLE}44` }}>
          <Brain className="w-4 h-4" style={{ color: PURPLE }} />
        </div>
        <div>
          <h1 className="text-base font-bold text-foreground">ERA Core Connection</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Connect ERA Hub to your ERA Core backend</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
            ERA Core URL
          </label>
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://era-core-production.up.railway.app"
            className="w-full rounded-xl px-4 py-3 text-sm outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.88)' }}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Secret Key
          </label>
          <input
            type="password"
            value={secret}
            onChange={e => setSecret(e.target.value)}
            placeholder="Your ERA Core secret key"
            className="w-full rounded-xl px-4 py-3 text-sm outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.88)' }}
          />
        </div>

        <button
          onClick={() => void saveAndTest()}
          disabled={status === 'testing'}
          className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
          style={{ background: PURPLE, color: 'white', opacity: status === 'testing' ? 0.6 : 1 }}
        >
          {status === 'testing' ? 'Testing…' : 'Save & Connect'}
        </button>

        {status === 'ok' && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
            <span className="text-sm text-green-400">Connected — ERA Core is live</span>
          </div>
        )}

        {status === 'fail' && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)' }}>
            <XCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="text-sm text-red-400">Could not reach ERA Core — check the URL</span>
          </div>
        )}

        {stats && (
          <div className="rounded-xl px-4 py-4 space-y-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>Memory Status</p>
            <div className="flex gap-6">
              <div><p className="text-lg font-bold" style={{ color: PURPLE }}>{stats.total}</p><p className="text-xs text-muted-foreground">Total</p></div>
              <div><p className="text-lg font-bold text-green-400">{stats.processed}</p><p className="text-xs text-muted-foreground">Processed</p></div>
              <div><p className="text-lg font-bold text-yellow-400">{stats.pending}</p><p className="text-xs text-muted-foreground">Pending</p></div>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}

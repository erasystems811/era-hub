import { useState, useEffect } from 'react'
import { Brain, CheckCircle, XCircle, Key, RefreshCw } from 'lucide-react'
import { saveCoreConfig, getCoreApi, getCoreSecret } from '../../lib/config'
import { coreFetch } from '../../lib/coreFetch'

const PURPLE = '#9B7FD4'

function getCoreBase(): string {
  return import.meta.env.DEV ? getCoreApi() : '/api/core'
}

export function CoreSettings() {
  const [url, setUrl]       = useState('')
  const [secret, setSecret] = useState('')
  const [status, setStatus] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [stats, setStats]   = useState<{ total: number; processed: number; pending: number } | null>(null)

  const [token, setToken]         = useState('')
  const [tokenStatus, setTokenStatus] = useState<'idle' | 'pushing' | 'ok' | 'fail'>('idle')
  const [tokenError, setTokenError]   = useState('')

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
    setErrorMsg('')

    try {
      saveCoreConfig(cleanUrl, cleanSecret)
      await coreFetch<{ ok: boolean }>('/health')
      setStatus('ok')
      try {
        const s = await coreFetch<{ total: number; processed: number; pending: number }>('/v1/ingest/status')
        setStats(s)
      } catch { /* stats optional */ }
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : String(e))
      setStatus('fail')
    }
  }

  async function pushToken() {
    const t = token.trim()
    if (!t) return
    setTokenStatus('pushing')
    setTokenError('')
    try {
      const res = await fetch(`${getCoreBase()}/v1/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-core-secret': getCoreSecret() },
        body: JSON.stringify({ token: t }),
      })
      if (!res.ok) throw new Error((await res.json() as { error?: string }).error ?? `${res.status}`)
      setTokenStatus('ok')
      setToken('')
    } catch (e) {
      setTokenError(e instanceof Error ? e.message : String(e))
      setTokenStatus('fail')
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
        {/* Connection */}
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
          <div className="flex items-start gap-2 px-4 py-3 rounded-xl" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)' }}>
            <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-400">Could not reach ERA Core</p>
              {errorMsg && <p className="text-xs text-red-400/70 mt-1 break-all">{errorMsg}</p>}
            </div>
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

        {/* Divider */}
        <div className="pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }} />

        {/* Claude Token */}
        <div className="flex items-center gap-2 mb-1">
          <Key className="w-3.5 h-3.5" style={{ color: PURPLE }} />
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Claude Access Token
          </p>
        </div>
        <p className="text-xs leading-relaxed mb-3" style={{ color: 'rgba(255,255,255,0.28)' }}>
          Paste your current token from <code className="px-1 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.08)', fontSize: 10 }}>~/.claude/.credentials.json</code> → <code className="px-1 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.08)', fontSize: 10 }}>accessToken</code>. Do this whenever Claude stops replying.
        </p>

        <input
          type="password"
          value={token}
          onChange={e => { setToken(e.target.value); setTokenStatus('idle') }}
          placeholder="sk-ant-oat01-…"
          className="w-full rounded-xl px-4 py-3 text-sm outline-none font-mono"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.88)' }}
        />

        <button
          onClick={() => void pushToken()}
          disabled={!token.trim() || tokenStatus === 'pushing'}
          className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
          style={{
            background: token.trim() ? `${PURPLE}22` : 'rgba(255,255,255,0.04)',
            border: `1px solid ${token.trim() ? PURPLE + '44' : 'rgba(255,255,255,0.08)'}`,
            color: token.trim() ? PURPLE : 'rgba(255,255,255,0.25)',
            opacity: tokenStatus === 'pushing' ? 0.6 : 1,
          }}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${tokenStatus === 'pushing' ? 'animate-spin' : ''}`} />
          {tokenStatus === 'pushing' ? 'Updating…' : 'Update Claude Token'}
        </button>

        {tokenStatus === 'ok' && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
            <span className="text-sm text-green-400">Token updated — Claude is live</span>
          </div>
        )}

        {tokenStatus === 'fail' && (
          <div className="flex items-start gap-2 px-4 py-3 rounded-xl" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)' }}>
            <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-400">Token update failed</p>
              {tokenError && <p className="text-xs text-red-400/70 mt-1 break-all">{tokenError}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

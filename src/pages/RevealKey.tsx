import { useEffect, useState } from 'react'
import { Copy, Check, ShieldAlert, KeyRound, Loader2 } from 'lucide-react'
import { COMMS_API } from '../lib/config'

type State =
  | { status: 'loading' }
  | { status: 'ready'; key: string; label: string; clientName: string }
  | { status: 'error'; message: string }

export function RevealKey() {
  // Parse token from /reveal-key/<token>
  const token = window.location.pathname.split('/reveal-key/')[1] ?? ''
  const [state, setState] = useState<State>({ status: 'loading' })
  const [copied, setCopied]  = useState(false)

  useEffect(() => {
    if (!token) { setState({ status: 'error', message: 'Invalid link.' }); return }

    fetch(`${COMMS_API}/v1/public/reveal/${token}`, {
      headers: { 'ngrok-skip-browser-warning': 'true' },
    })
      .then(async res => {
        const data = await res.json() as { key?: string; label?: string; clientName?: string; message?: string }
        if (!res.ok) {
          setState({ status: 'error', message: data.message ?? 'This link is invalid or has expired.' })
        } else {
          setState({ status: 'ready', key: data.key!, label: data.label!, clientName: data.clientName! })
        }
      })
      .catch(() => setState({ status: 'error', message: 'Could not connect. Please try again.' }))
  }, [token])

  const copy = () => {
    if (state.status !== 'ready') return
    void navigator.clipboard.writeText(state.key)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-[#0f0d17] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-2xl font-bold text-[#bf7c93]">ERA</span>
          <span className="text-2xl font-bold text-white"> Comms</span>
        </div>

        {state.status === 'loading' && (
          <div className="bg-white/05 border border-white/10 rounded-2xl p-8 flex flex-col items-center gap-3 text-white/50">
            <Loader2 className="w-6 h-6 animate-spin" />
            <p className="text-sm">Retrieving your key…</p>
          </div>
        )}

        {state.status === 'error' && (
          <div className="bg-white/05 border border-white/10 rounded-2xl p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-6 h-6 text-red-400" />
            </div>
            <h1 className="text-lg font-semibold text-white mb-2">Link unavailable</h1>
            <p className="text-sm text-white/50">{state.message}</p>
            <p className="text-xs text-white/30 mt-4">Contact ERA Systems for a new link.</p>
          </div>
        )}

        {state.status === 'ready' && (
          <div className="bg-white/05 border border-white/10 rounded-2xl p-8">
            <div className="w-12 h-12 rounded-full bg-[#bf7c93]/10 flex items-center justify-center mb-4">
              <KeyRound className="w-6 h-6 text-[#bf7c93]" />
            </div>
            <h1 className="text-lg font-semibold text-white mb-1">Your API key is ready</h1>
            <p className="text-sm text-white/50 mb-6">
              <span className="text-white/80">{state.clientName}</span> · {state.label}
            </p>

            <div className="bg-black/30 border border-white/10 rounded-xl p-4 mb-3">
              <p className="text-xs text-white/40 mb-2 font-mono uppercase tracking-widest">API Key</p>
              <p className="font-mono text-sm text-white/90 break-all">{state.key}</p>
            </div>

            <button
              onClick={copy}
              className="w-full flex items-center justify-center gap-2 bg-[#bf7c93] hover:bg-[#bf7c93]/90 text-white font-semibold py-3 rounded-xl transition text-sm">
              {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy key</>}
            </button>

            <div className="mt-5 p-3 bg-amber-500/05 border border-amber-500/15 rounded-xl">
              <p className="text-xs text-amber-400/80">This key is shown once. Save it somewhere safe — this page cannot be reopened.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

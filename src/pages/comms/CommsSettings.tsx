import { useState } from 'react'
import { Eye, EyeOff, Server, Key } from 'lucide-react'
import { COMMS_API, COMMS_SECRET } from '../../lib/config'

export function CommsSettings() {
  const [showSecret, setShowSecret] = useState(false)

  const masked = COMMS_SECRET
    ? COMMS_SECRET.slice(0, 6) + '•'.repeat(Math.max(0, COMMS_SECRET.length - 10)) + COMMS_SECRET.slice(-4)
    : '(not configured)'

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="page-title">Comms Settings</h1>
        <p className="caption mt-0.5">ERA Comms API connection details</p>
      </div>

      <div className="space-y-4">
        {/* Connection card */}
        <div className="rounded-2xl border border-white/07 bg-card p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Server className="w-3.5 h-3.5 text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Connection</h3>
          </div>

          <div className="space-y-5">
            <div>
              <label className="label">API endpoint</label>
              <div className="input font-mono text-sm bg-white/[0.02] text-foreground mt-1.5 select-all">
                {COMMS_API || '(not configured)'}
              </div>
            </div>
            <div>
              <label className="label">Operator secret</label>
              <div className="flex gap-2 mt-1.5">
                <div className="input flex-1 font-mono text-sm bg-white/[0.02] text-foreground select-all">
                  {showSecret ? COMMS_SECRET : masked}
                </div>
                <button className="btn-secondary flex items-center gap-1.5 text-sm shrink-0"
                  onClick={() => setShowSecret(v => !v)}>
                  {showSecret ? <><EyeOff className="w-3.5 h-3.5" /> Hide</> : <><Eye className="w-3.5 h-3.5" /> Reveal</>}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Config card */}
        <div className="rounded-2xl border border-white/07 bg-card p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-xl bg-teal/10 flex items-center justify-center">
              <Key className="w-3.5 h-3.5 text-teal" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Environment variables</h3>
          </div>

          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            Connection settings are configured through environment variables on the ERA Hub service.
            To update them, edit the variables in your deployment environment.
          </p>

          <div className="rounded-xl border border-white/06 bg-black/20 p-4 font-mono text-xs space-y-1.5">
            <div><span className="text-teal">VITE_COMMS_API_URL</span><span className="text-muted-foreground">=https://era-comms-api-production.up.railway.app</span></div>
            <div><span className="text-teal">VITE_COMMS_OPERATOR_SECRET</span><span className="text-muted-foreground">=your_secret_here</span></div>
            <div><span className="text-teal">VITE_PATIENT_API_URL</span><span className="text-muted-foreground">=https://your-patient-api.up.railway.app</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}

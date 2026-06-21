import { useState } from 'react'
import { Glass } from '../../components/Glass'
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

      <Glass>
        <h3 className="section-title mb-5">Connection</h3>
        <div className="space-y-4">
          <div>
            <label className="label">API endpoint</label>
            <div className="input font-mono text-sm bg-pink-light">{COMMS_API || '(not configured)'}</div>
          </div>
          <div>
            <label className="label">Operator secret</label>
            <div className="flex gap-2">
              <div className="input flex-1 font-mono text-sm bg-pink-light">
                {showSecret ? COMMS_SECRET : masked}
              </div>
              <button className="btn-secondary" onClick={() => setShowSecret(v => !v)}>
                {showSecret ? 'Hide' : 'Reveal'}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-pink-border">
          <h4 className="text-sm font-medium text-charcoal mb-2">Configuration</h4>
          <p className="text-sm text-charcoal-soft">
            Connection settings are configured through Railway environment variables on this service.
            To update them, go to your Railway project and edit the environment variables for the ERA Hub service.
          </p>
          <div className="mt-3 glass-sm" style={{ padding: '12px 14px' }}>
            <div className="font-mono text-xs text-charcoal-soft space-y-1">
              <div><span className="text-teal">VITE_COMMS_API_URL</span>=https://era-comms-api-production.up.railway.app</div>
              <div><span className="text-teal">VITE_COMMS_OPERATOR_SECRET</span>=your_secret_here</div>
              <div><span className="text-teal">VITE_PATIENT_API_URL</span>=https://your-patient-api.up.railway.app</div>
            </div>
          </div>
        </div>
      </Glass>
    </div>
  )
}

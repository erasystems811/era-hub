import { useState } from 'react'
import { Eye, EyeOff, Server, Bell, Globe, AlertTriangle, Copy, Check, RefreshCw } from 'lucide-react'
import { COMMS_API, COMMS_SECRET } from '../../lib/config'

function Toast({ msg }: { msg: string }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border border-white/10 bg-card px-4 py-3 shadow-card-lg text-sm text-foreground animate-in fade-in slide-in-from-bottom-2">
      <Check className="w-4 h-4 text-teal shrink-0" />
      {msg}
    </div>
  )
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!on)}
      className={`relative w-9 h-5 rounded-full transition-colors duration-200 cursor-pointer shrink-0 ${on ? 'bg-primary' : 'bg-white/10'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${on ? 'translate-x-4' : ''}`} />
    </div>
  )
}

const NOTIF_ITEMS = [
  { key: 'disconnect',  label: 'Email me when a client disconnects',              defaultOn: true },
  { key: 'usageAlert',  label: 'Email me when usage exceeds 90% of limit',        defaultOn: true },
  { key: 'digest',      label: 'Daily usage digest at 8am',                       defaultOn: false },
  { key: 'whatsapp',    label: 'WhatsApp alert for critical platform events',      defaultOn: false },
] as const

type NotifKey = typeof NOTIF_ITEMS[number]['key']

export function CommsSettings() {
  const [showSecret, setShowSecret] = useState(false)
  const [toast, setToast] = useState('')
  const [notifs, setNotifs] = useState<Record<NotifKey, boolean>>(
    Object.fromEntries(NOTIF_ITEMS.map(i => [i.key, i.defaultOn])) as Record<NotifKey, boolean>
  )
  const [copied, setCopied] = useState<string>('')

  const masked = COMMS_SECRET
    ? '•'.repeat(Math.max(0, COMMS_SECRET.length - 8)) + COMMS_SECRET.slice(-8)
    : '(not configured)'

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2800)
  }

  function copyText(text: string, key: string) {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(''), 1800)
    })
  }

  function handleReset() {
    if (window.confirm('Reset all cached data? This will reload the page.')) {
      window.location.reload()
    }
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div className="mb-6">
        <h1 className="page-title">Settings</h1>
        <p className="caption mt-0.5">ERA Comms platform configuration</p>
      </div>

      {/* Platform Configuration */}
      <div className="rounded-2xl border border-white/[0.07] bg-card p-6">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Server className="w-3.5 h-3.5 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Platform Configuration</h3>
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-1.5 block">API Endpoint</label>
            <div className="flex gap-2">
              <div className="flex-1 px-3.5 py-2.5 rounded-xl bg-[hsl(262_20%_11%)] border border-white/[0.06] text-foreground text-sm font-mono select-all">
                {COMMS_API || '(not configured)'}
              </div>
              <button
                onClick={() => copyText(COMMS_API, 'api')}
                className="btn-secondary shrink-0 flex items-center gap-1.5"
              >
                {copied === 'api' ? <Check className="w-3.5 h-3.5 text-teal" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-1.5 block">Operator Secret</label>
            <div className="flex gap-2">
              <div className="flex-1 px-3.5 py-2.5 rounded-xl bg-[hsl(262_20%_11%)] border border-white/[0.06] text-foreground text-sm font-mono select-all">
                {showSecret ? COMMS_SECRET : masked}
              </div>
              <button className="btn-secondary shrink-0 flex items-center gap-1.5" onClick={() => setShowSecret(v => !v)}>
                {showSecret ? <><EyeOff className="w-3.5 h-3.5" /> Hide</> : <><Eye className="w-3.5 h-3.5" /> Show</>}
              </button>
              <button className="btn-secondary shrink-0 flex items-center gap-1.5" onClick={() => showToast('Key rotation coming soon')}>
                <RefreshCw className="w-3.5 h-3.5" /> Rotate
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              Set via <span className="font-mono text-primary/70">VITE_COMMS_OPERATOR_SECRET</span> environment variable.
            </p>
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="rounded-2xl border border-white/[0.07] bg-card p-6">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-xl bg-teal/10 flex items-center justify-center">
            <Bell className="w-3.5 h-3.5 text-teal" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Notification Preferences</h3>
        </div>

        <div className="space-y-3">
          {NOTIF_ITEMS.map(item => (
            <label key={item.key} className="flex items-center justify-between gap-4 cursor-pointer select-none py-1">
              <span className="text-sm text-foreground leading-snug">{item.label}</span>
              <Toggle on={notifs[item.key]} onChange={v => setNotifs(n => ({ ...n, [item.key]: v }))} />
            </label>
          ))}
        </div>

        <div className="mt-5 pt-4 border-t border-white/[0.06]">
          <button
            className="btn-primary"
            onClick={() => showToast('Saved — backend sync coming soon')}
          >
            Save preferences
          </button>
        </div>
      </div>

      {/* Business Portal */}
      <div className="rounded-2xl border border-white/[0.07] bg-card p-6">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Globe className="w-3.5 h-3.5 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Business Portal</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-1.5 block">Portal URL</label>
            <div className="flex gap-2">
              <div className="flex-1 px-3.5 py-2.5 rounded-xl bg-[hsl(262_20%_11%)] border border-white/[0.06] text-foreground text-sm font-mono select-all">
                https://biz.erasystems.com.ng
              </div>
              <button
                className="btn-secondary shrink-0 flex items-center gap-1.5"
                onClick={() => copyText('https://biz.erasystems.com.ng', 'portal')}
              >
                {copied === 'portal' ? <Check className="w-3.5 h-3.5 text-teal" /> : <Copy className="w-3.5 h-3.5" />}
                Copy
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: 'AI Agent signup', path: '/apply/ai-agent', key: 'ai' },
              { label: 'Developer signup', path: '/apply/developer', key: 'dev' },
            ].map(({ label, path, key }) => (
              <div key={key}>
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-1.5 block">{label}</label>
                <div className="flex gap-2">
                  <div className="flex-1 px-3.5 py-2.5 rounded-xl bg-[hsl(262_20%_11%)] border border-white/[0.06] text-foreground text-xs font-mono truncate">
                    {path}
                  </div>
                  <button
                    className="btn-secondary shrink-0"
                    onClick={() => copyText(`https://biz.erasystems.com.ng${path}`, key)}
                  >
                    {copied === key ? <Check className="w-3.5 h-3.5 text-teal" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-2xl border border-destructive/20 bg-card p-6">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
          </div>
          <h3 className="text-sm font-semibold text-destructive">Danger Zone</h3>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-foreground font-medium">Reset all cached data</p>
            <p className="text-xs text-muted-foreground mt-0.5">Clears in-memory page cache and reloads the app</p>
          </div>
          <button onClick={handleReset} className="btn-danger shrink-0">
            Reset cache
          </button>
        </div>
      </div>

      {toast && <Toast msg={toast} />}
    </div>
  )
}

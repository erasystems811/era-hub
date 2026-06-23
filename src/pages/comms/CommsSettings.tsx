import { useState } from 'react'
import { Eye, EyeOff, Server, Globe, Copy, Check, Key, RotateCcw } from 'lucide-react'
import { COMMS_API, COMMS_SECRET } from '../../lib/config'

const PORTAL_BASE = 'https://biz.erasystems.com.ng'

export function CommsSettings() {
  const [showSecret, setShowSecret] = useState(false)
  const [copied, setCopied]         = useState('')

  function copy(text: string, key: string) {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(''), 1800)
    })
  }

  function CopyBtn({ text, id }: { text: string; id: string }) {
    return (
      <button
        onClick={() => copy(text, id)}
        className="btn-secondary shrink-0 flex items-center gap-1.5 px-3"
        title="Copy"
      >
        {copied === id
          ? <Check className="w-3.5 h-3.5 text-teal" />
          : <Copy className="w-3.5 h-3.5" />}
      </button>
    )
  }

  const masked = COMMS_SECRET
    ? '•'.repeat(Math.max(0, COMMS_SECRET.length - 4)) + COMMS_SECRET.slice(-4)
    : '(not configured)'

  return (
    <div className="max-w-2xl space-y-5">
      <div className="mb-6">
        <h1 className="page-title">Settings</h1>
        <p className="caption mt-0.5">ERA Comms platform configuration</p>
      </div>

      {/* Platform */}
      <div className="rounded-2xl border border-white/[0.07] bg-card p-6 space-y-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Server className="w-3.5 h-3.5 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Platform</h3>
        </div>

        {/* API Endpoint */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-1.5 block">
            API Endpoint
          </label>
          <div className="flex gap-2">
            <div className="flex-1 px-3.5 py-2.5 rounded-xl bg-[hsl(262_20%_11%)] border border-white/[0.06] text-foreground text-sm font-mono truncate">
              {COMMS_API || '(not configured)'}
            </div>
            <CopyBtn text={COMMS_API} id="api" />
          </div>
        </div>

        {/* Operator Secret */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-1.5 block">
            Operator Secret
          </label>
          <div className="flex gap-2">
            <div className="flex-1 px-3.5 py-2.5 rounded-xl bg-[hsl(262_20%_11%)] border border-white/[0.06] text-foreground text-sm font-mono truncate select-all">
              {showSecret ? COMMS_SECRET : masked}
            </div>
            <button
              className="btn-secondary shrink-0 flex items-center gap-1.5 px-3"
              onClick={() => setShowSecret(v => !v)}
              title={showSecret ? 'Hide' : 'Reveal'}
            >
              {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
            <CopyBtn text={COMMS_SECRET} id="secret" />
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5">
            Your master admin key — never share with business clients. Set via{' '}
            <span className="font-mono text-primary/70">VITE_COMMS_OPERATOR_SECRET</span> in Railway.
          </p>
        </div>
      </div>

      {/* Business Portal */}
      <div className="rounded-2xl border border-white/[0.07] bg-card p-6 space-y-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Globe className="w-3.5 h-3.5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Business Portal</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Links you share with your business clients</p>
          </div>
        </div>

        {/* Portal login */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-1.5 block">
            Client Login
          </label>
          <div className="flex gap-2">
            <div className="flex-1 px-3.5 py-2.5 rounded-xl bg-[hsl(262_20%_11%)] border border-white/[0.06] text-foreground text-sm font-mono truncate">
              {PORTAL_BASE}/biz/login
            </div>
            <CopyBtn text={`${PORTAL_BASE}/biz/login`} id="login" />
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5">
            After you approve a business and share their temp password, they log in here.
          </p>
        </div>

        {/* Signup links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'AI Agent Signup',   path: '/apply/ai-agent',   id: 'ai',  desc: 'For businesses that want the full AI agent' },
            { label: 'Developer Signup',  path: '/apply/developer',  id: 'dev', desc: 'For businesses integrating via API' },
          ].map(({ label, path, id, desc }) => (
            <div key={id}>
              <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-1.5 block">
                {label}
              </label>
              <div className="flex gap-2">
                <div className="flex-1 px-3.5 py-2.5 rounded-xl bg-[hsl(262_20%_11%)] border border-white/[0.06] text-foreground text-xs font-mono truncate">
                  {PORTAL_BASE}{path}
                </div>
                <CopyBtn text={`${PORTAL_BASE}${path}`} id={id} />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* API Keys info */}
      <div className="rounded-2xl border border-white/[0.07] bg-card p-6">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Key className="w-3.5 h-3.5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Business API Keys</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Managed per-business under Businesses → API Keys tab</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Each business gets their own API key for sending messages via the ERA Comms API.
          Go to <span className="text-foreground font-medium">Businesses</span>, tap a business,
          then open the <span className="text-foreground font-medium">API Keys</span> tab to generate
          and deliver keys to them.
        </p>
      </div>

      {/* Cache reset */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-muted-foreground">
          If pages show stale data, clear the in-memory cache.
        </p>
        <button
          onClick={() => { if (window.confirm('Clear cached data and reload?')) window.location.reload() }}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition px-3 py-1.5 rounded-lg border border-white/08 hover:bg-white/05"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset cache
        </button>
      </div>
    </div>
  )
}

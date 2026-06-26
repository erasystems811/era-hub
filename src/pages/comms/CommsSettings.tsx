import { useState, useEffect } from 'react'
import { Eye, EyeOff, Server, Globe, Copy, Check, Key, ExternalLink, Mail, AlertTriangle, CheckCircle2, ShieldAlert, Settings2, Save } from 'lucide-react'
import { getCommsApi, saveCommsApi, COMMS_SECRET } from '../../lib/config'
import { FailsafeContent } from './Failsafe'
import { useToast } from '../../components/Toast'

const HUB = 'https://hub.erasystems.com.ng'

type Tab = 'config' | 'failsafe'

export function CommsSettings() {
  const toast = useToast()
  const [tab, setTab]               = useState<Tab>('config')
  const [showSecret, setShowSecret]  = useState(false)
  const [copied, setCopied]          = useState('')
  const [apiStatus, setApiStatus]    = useState<'checking' | 'ok' | 'error'>('checking')
  const [apiUrl, setApiUrl]          = useState(getCommsApi)
  const [urlSaved, setUrlSaved]      = useState(false)

  const checkStatus = (url: string) => {
    setApiStatus('checking')
    fetch(`${url}/health`)
      .then(r => setApiStatus(r.ok ? 'ok' : 'error'))
      .catch(() => setApiStatus('error'))
  }

  useEffect(() => { checkStatus(getCommsApi()) }, [])

  const saveUrl = () => {
    const clean = apiUrl.trim().replace(/\/+$/, '')
    saveCommsApi(clean)
    setApiUrl(clean)
    setUrlSaved(true)
    setTimeout(() => setUrlSaved(false), 2000)
    checkStatus(clean)
    toast('API URL saved — page will use new URL immediately', 'success')
  }

  function copy(text: string, key: string) {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(''), 1800)
    })
  }

  function CopyBtn({ text, id }: { text: string; id: string }) {
    return (
      <button onClick={() => copy(text, id)} className="btn-secondary shrink-0 flex items-center gap-1.5 px-3" title="Copy">
        {copied === id ? <Check className="w-3.5 h-3.5 text-teal" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    )
  }

  const masked = COMMS_SECRET
    ? '•'.repeat(Math.max(0, COMMS_SECRET.length - 4)) + COMMS_SECRET.slice(-4)
    : '(not configured)'

  const publicLinks = [
    { label: 'Business Login',    url: `${HUB}/biz/login`,      desc: 'Share this with approved businesses so they can log in to their portal' },
    { label: 'AI Agent Signup',   url: `${HUB}/apply`,           desc: 'Public form for businesses to apply for an AI agent account' },
    { label: 'Developer Signup',  url: `${HUB}/apply/developer`, desc: 'Public form for developers wanting API access' },
  ]

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="page-title">Settings</h1>
        <p className="caption mt-0.5">Platform configuration and troubleshooting guide</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-black/20 border border-white/07 mb-6 w-fit">
        {([
          { id: 'config',   label: 'Configuration', icon: <Settings2 className="w-3.5 h-3.5" /> },
          { id: 'failsafe', label: 'Failsafe Guide', icon: <ShieldAlert className="w-3.5 h-3.5" /> },
        ] as { id: Tab; label: string; icon: React.ReactNode }[]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-primary/20 text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'config' && (
        <div className="space-y-5">
          {/* System Status */}
          <div className="rounded-2xl border border-white/[0.07] bg-card p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Server className="w-3.5 h-3.5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">System Status</h3>
            </div>

            <div className="space-y-3">
              <div className="py-2 border-b border-white/05">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-foreground">ERA Comms API</p>
                  {apiStatus === 'checking' && <span className="text-xs text-muted-foreground">Checking…</span>}
                  {apiStatus === 'ok'       && <span className="flex items-center gap-1.5 text-xs text-teal font-semibold"><CheckCircle2 className="w-3.5 h-3.5" /> Live</span>}
                  {apiStatus === 'error'    && <span className="flex items-center gap-1.5 text-xs text-red-400 font-semibold"><AlertTriangle className="w-3.5 h-3.5" /> Unreachable</span>}
                </div>
                <div className="flex gap-2">
                  <input
                    className="flex-1 px-3 py-2 rounded-xl bg-[hsl(262_20%_11%)] border border-white/[0.06] text-foreground text-sm font-mono focus:outline-none focus:border-primary/40"
                    value={apiUrl}
                    onChange={e => setApiUrl(e.target.value)}
                    placeholder="https://xxxxxxxx.share.zrok.io"
                    onKeyDown={e => e.key === 'Enter' && saveUrl()}
                  />
                  <button onClick={saveUrl} className="btn-primary shrink-0 flex items-center gap-1.5 px-3 text-sm">
                    {urlSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                    {urlSaved ? 'Saved' : 'Save'}
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5">Paste the new zrok URL here any time it changes — no need to redeploy.</p>
              </div>

              {/* zrok start command */}
              {(() => {
                const token = apiUrl.match(/https?:\/\/([^.]+)\.share\.zrok\.io/)?.[1]
                if (!token) return null
                const cmd = `zrok share reserved ${token}`
                return (
                  <div className="rounded-xl bg-black/30 border border-white/06 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Start zrok command — run this in Termux</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-sm text-teal font-mono">{cmd}</code>
                      <CopyBtn text={cmd} id="zrok-cmd" />
                    </div>
                  </div>
                )
              })()}

              <div className="flex items-start gap-3 rounded-xl px-4 py-3" style={{ background: 'rgba(239,200,100,0.07)', border: '1px solid rgba(239,200,100,0.15)' }}>
                <Mail className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-amber-400">Email delivery required</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    OTP codes, portal access emails, and API key notifications all send via email. Add a GitHub Secret called <code className="text-primary/80">SMTP_PASS</code> in the <strong className="text-foreground">era-hub</strong> repo → Settings → Secrets → Actions, then push any change to activate it.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* API Config */}
          <div className="rounded-2xl border border-white/[0.07] bg-card p-6 space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Key className="w-3.5 h-3.5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">API Configuration</h3>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-1.5 block">Operator Secret</label>
              <div className="flex gap-2">
                <div className="flex-1 px-3.5 py-2.5 rounded-xl bg-[hsl(262_20%_11%)] border border-white/[0.06] text-foreground text-sm font-mono truncate select-all">
                  {showSecret ? COMMS_SECRET : masked}
                </div>
                <button className="btn-secondary shrink-0 flex items-center gap-1.5 px-3" onClick={() => setShowSecret(v => !v)}>
                  {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <CopyBtn text={COMMS_SECRET} id="secret" />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1.5">
                Your master admin key — never share with business clients. Stored as <code className="text-primary/70">OPERATOR_SECRET</code> in GitHub Secrets.
              </p>
            </div>
          </div>

          {/* Public Links */}
          <div className="rounded-2xl border border-white/[0.07] bg-card p-6 space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Globe className="w-3.5 h-3.5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Public Links</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Share these with clients and applicants</p>
              </div>
            </div>

            <div className="space-y-4">
              {publicLinks.map(({ label, url, desc }) => (
                <div key={url}>
                  <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-1.5 block">{label}</label>
                  <div className="flex gap-2">
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[hsl(262_20%_11%)] border border-white/[0.06] text-foreground text-sm font-mono truncate hover:border-primary/30 transition-colors group"
                    >
                      <span className="truncate">{url}</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0 text-muted-foreground/40 group-hover:text-primary/60 transition-colors" />
                    </a>
                    <CopyBtn text={url} id={label} />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* API Keys info */}
          <div className="rounded-2xl border border-white/[0.07] bg-card p-6">
            <div className="flex items-center gap-2.5 mb-3">
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
              then open the <span className="text-foreground font-medium">API Keys</span> tab to generate and deliver keys.
            </p>
          </div>
        </div>
      )}

      {tab === 'failsafe' && <FailsafeContent />}
    </div>
  )
}

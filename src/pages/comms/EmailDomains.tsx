import { useState } from 'react'
import { Globe, CheckCircle2, XCircle, Copy, ChevronDown, ChevronUp, Plus, RefreshCw } from 'lucide-react'

interface Domain {
  id: number
  client: string
  domain: string
  spf: boolean
  dkim: boolean
  dmarc: boolean
  mxConfigured: boolean
  verifiedAt: string | null
}

const DOMAINS: Domain[] = [
  { id: 1, client: 'City General Hospital', domain: 'citygeneral.ng',    spf: true,  dkim: true,  dmarc: true,  mxConfigured: true,  verifiedAt: '3 months ago' },
  { id: 2, client: 'QuickWash Laundry',     domain: 'quickwash.ng',      spf: true,  dkim: true,  dmarc: false, mxConfigured: true,  verifiedAt: '2 months ago' },
  { id: 3, client: 'Metro Logistics',       domain: 'metrologistics.ng', spf: true,  dkim: false, dmarc: false, mxConfigured: false, verifiedAt: null },
  { id: 4, client: 'Sunrise Pharmacy',      domain: 'sunrisepharm.ng',   spf: false, dkim: false, dmarc: false, mxConfigured: false, verifiedAt: null },
  { id: 5, client: 'FoodBridge Restaurant', domain: 'foodbridge.ng',     spf: true,  dkim: true,  dmarc: true,  mxConfigured: true,  verifiedAt: '1 month ago' },
]

function domainDnsRecords(d: Domain) {
  return [
    {
      type: 'TXT',
      name: `@`,
      value: `v=spf1 include:mail.erasystems.io ~all`,
      label: 'SPF',
      ok: d.spf,
    },
    {
      type: 'TXT',
      name: `era-comms._domainkey`,
      value: `v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC...`,
      label: 'DKIM',
      ok: d.dkim,
    },
    {
      type: 'TXT',
      name: `_dmarc`,
      value: `v=DMARC1; p=quarantine; rua=mailto:dmarc@erasystems.io`,
      label: 'DMARC',
      ok: d.dmarc,
    },
    {
      type: 'MX',
      name: `@`,
      value: `10 mail.erasystems.io`,
      label: 'MX (inbound)',
      ok: d.mxConfigured,
    },
  ]
}

function Check({ ok }: { ok: boolean }) {
  return ok
    ? <CheckCircle2 className="w-4 h-4 text-teal" />
    : <XCircle className="w-4 h-4 text-red-400/60" />
}

function HealthBar({ d }: { d: Domain }) {
  const all    = [d.spf, d.dkim, d.dmarc, d.mxConfigured]
  const passed = all.filter(Boolean).length
  const pct    = (passed / all.length) * 100
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct === 100 ? '#4DBFB3' : pct > 50 ? '#f59e0b' : '#f87171' }} />
      </div>
      <span className="text-[10px] text-muted-foreground">{passed}/{all.length}</span>
    </div>
  )
}

export function EmailDomains() {
  const [expanded, setExpanded]   = useState<number | null>(null)
  const [copied, setCopied]       = useState<string | null>(null)
  const [showAdd, setShowAdd]     = useState(false)

  const copy = (value: string, key: string) => {
    navigator.clipboard.writeText(value)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">Email Domains</h1>
          <p className="caption mt-0.5">Connect each client's sending domain · add DNS records · verify</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Add domain
        </button>
      </div>

      {/* Domain cards */}
      <div className="space-y-3">
        {DOMAINS.map(d => {
          const open  = expanded === d.id
          const ready = d.spf && d.dkim && d.dmarc && d.mxConfigured

          return (
            <div key={d.id} className="rounded-2xl border border-white/07 bg-card overflow-hidden">
              {/* Row */}
              <div
                className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                onClick={() => setExpanded(open ? null : d.id)}
              >
                <Globe className="w-5 h-5 text-muted-foreground/40 shrink-0" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-foreground font-mono text-sm">{d.domain}</p>
                    {ready ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-teal/10 text-teal border border-teal/20">Verified</span>
                    ) : (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">Setup needed</span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground/50 mt-0.5">{d.client}</p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  {/* SPF DKIM DMARC MX indicators */}
                  <div className="hidden sm:flex items-center gap-2">
                    {['SPF','DKIM','DMARC','MX'].map((label, i) => {
                      const vals = [d.spf, d.dkim, d.dmarc, d.mxConfigured]
                      return (
                        <div key={label} className="flex flex-col items-center gap-0.5">
                          <Check ok={vals[i]} />
                          <span className="text-[9px] text-muted-foreground/40">{label}</span>
                        </div>
                      )
                    })}
                  </div>
                  <HealthBar d={d} />
                  {open ? <ChevronUp className="w-4 h-4 text-muted-foreground/40" /> : <ChevronDown className="w-4 h-4 text-muted-foreground/40" />}
                </div>
              </div>

              {/* DNS records panel */}
              {open && (
                <div className="border-t border-white/06 px-5 py-4 space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-foreground">DNS records to add at your domain registrar</p>
                    <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition">
                      <RefreshCw className="w-3.5 h-3.5" /> Verify now
                    </button>
                  </div>

                  {domainDnsRecords(d).map(r => (
                    <div
                      key={r.label}
                      className={`rounded-xl border px-4 py-3 ${r.ok ? 'border-teal/15 bg-teal/[0.03]' : 'border-white/07 bg-white/[0.015]'}`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <Check ok={r.ok} />
                          <span className="text-xs font-bold text-foreground">{r.label}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/05 font-mono text-muted-foreground">{r.type}</span>
                        </div>
                        {!r.ok && (
                          <span className="text-[10px] text-amber-400">Not detected</span>
                        )}
                      </div>
                      <div className="grid grid-cols-[80px_1fr] gap-2 text-xs">
                        <div>
                          <p className="text-muted-foreground/50 text-[10px] mb-0.5">Name</p>
                          <p className="font-mono text-muted-foreground bg-white/05 rounded px-1.5 py-0.5 truncate">{r.name}</p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-muted-foreground/50 text-[10px] mb-0.5">Value</p>
                          <div className="flex items-center gap-1.5">
                            <p className="font-mono text-muted-foreground bg-white/05 rounded px-1.5 py-0.5 truncate flex-1 text-[11px]">{r.value}</p>
                            <button
                              className="shrink-0 p-1 rounded hover:bg-white/08 transition text-muted-foreground/50 hover:text-foreground"
                              onClick={() => copy(r.value, `${d.id}-${r.label}`)}
                            >
                              {copied === `${d.id}-${r.label}`
                                ? <CheckCircle2 className="w-3.5 h-3.5 text-teal" />
                                : <Copy className="w-3.5 h-3.5" />
                              }
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Add domain modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAdd(false)} />
          <div className="relative z-10 bg-[#1a1624] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-5 border-b border-white/08">
              <h2 className="font-semibold text-foreground">Add sending domain</h2>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="label">Client</label>
                <select className="input"><option>Select client…</option><option>City General Hospital</option></select>
              </div>
              <div>
                <label className="label">Domain</label>
                <input className="input font-mono" placeholder="yourcompany.ng" />
                <p className="text-[10px] text-muted-foreground/50 mt-1">Must be the domain you'll send from. DNS records will be shown after adding.</p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-white/08 flex gap-2 justify-end">
              <button className="btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn-primary flex items-center gap-2"><Globe className="w-4 h-4" />Add domain</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

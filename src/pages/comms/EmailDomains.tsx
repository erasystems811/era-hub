import { useState, useEffect } from 'react'
import {
  Globe, CheckCircle2, XCircle, Copy, ChevronDown, ChevronUp,
  Plus, RefreshCw, Loader2, AlertCircle, Trash2,
} from 'lucide-react'
import { emailApi, commsApi, type EmailDomain, type PostalDnsRecord, type Client } from '../../lib/comms-api'
import { EmailTabs } from './EmailOverview'

function Check({ ok }: { ok: boolean }) {
  return ok
    ? <CheckCircle2 className="w-4 h-4 text-teal" />
    : <XCircle className="w-4 h-4 text-red-400/60" />
}

function HealthBar({ domain }: { domain: EmailDomain }) {
  const flags  = [domain.spfVerified, domain.dkimVerified, domain.dmarcVerified, domain.mxVerified]
  const passed = flags.filter(Boolean).length
  const pct    = (passed / flags.length) * 100
  const color  = pct === 100 ? '#4DBFB3' : pct > 50 ? '#f59e0b' : '#f87171'
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[10px] text-muted-foreground">{passed}/4</span>
    </div>
  )
}

function DomainDnsPanel({ domain }: { domain: EmailDomain }) {
  const [dns, setDns]       = useState<PostalDnsRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [verifyMsg, setVerifyMsg] = useState('')

  useEffect(() => {
    emailApi.domainDns(domain.id)
      .then(setDns)
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load DNS records'))
      .finally(() => setLoading(false))
  }, [domain.id])

  const copy = (text: string, key: string) => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(key); setTimeout(() => setCopied(null), 2000)
    })
  }

  const verify = async () => {
    setVerifying(true); setVerifyMsg('')
    try {
      const res = await emailApi.verifyDomain(domain.id)
      setVerifyMsg(res.message)
    } catch {
      setVerifyMsg('Verification request failed.')
    } finally {
      setVerifying(false)
    }
  }

  if (loading) return (
    <div className="border-t border-white/06 px-5 py-6 flex items-center gap-2 text-muted-foreground text-sm">
      <Loader2 className="w-4 h-4 animate-spin" /> Loading DNS records…
    </div>
  )

  if (error) return (
    <div className="border-t border-white/06 px-5 py-4 text-sm text-red-400">{error}</div>
  )

  const records = dns ? [
    { label: 'SPF',        type: 'TXT', name: '@',                   value: dns.spfRecord,             ok: domain.spfVerified },
    { label: 'DKIM',       type: 'TXT', name: dns.dkimRecord.name,   value: dns.dkimRecord.value,      ok: domain.dkimVerified },
    { label: 'DMARC',      type: 'TXT', name: '_dmarc',              value: dns.dmarcRecord,           ok: domain.dmarcVerified },
    { label: 'MX (inbound)',type: 'MX', name: '@',                   value: dns.mxRecord,              ok: domain.mxVerified },
  ] : []

  return (
    <div className="border-t border-white/06 px-5 py-4 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-semibold text-foreground">DNS records — add at your domain registrar</p>
        <div className="flex items-center gap-2">
          {verifyMsg && <p className="text-[10px] text-amber-400">{verifyMsg}</p>}
          <button
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition disabled:opacity-50"
            onClick={verify} disabled={verifying}
          >
            {verifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Verify now
          </button>
        </div>
      </div>

      {records.map(r => (
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
            {!r.ok && <span className="text-[10px] text-amber-400">Not detected</span>}
          </div>
          <div className="grid grid-cols-[90px_1fr] gap-2 text-xs">
            <div>
              <p className="text-muted-foreground/50 text-[10px] mb-0.5">Name / Host</p>
              <p className="font-mono text-muted-foreground bg-white/05 rounded px-1.5 py-0.5 truncate">{r.name}</p>
            </div>
            <div className="min-w-0">
              <p className="text-muted-foreground/50 text-[10px] mb-0.5">Value</p>
              <div className="flex items-center gap-1.5">
                <p className="font-mono text-muted-foreground bg-white/05 rounded px-1.5 py-0.5 truncate flex-1 text-[11px] break-all">{r.value}</p>
                <button
                  className="shrink-0 p-1 rounded hover:bg-white/08 transition text-muted-foreground/50 hover:text-foreground"
                  onClick={() => copy(r.value, `${domain.id}-${r.label}`)}
                  title="Copy value"
                >
                  {copied === `${domain.id}-${r.label}`
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-teal" />
                    : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function EmailDomains() {
  const [domains, setDomains]   = useState<EmailDomain[]>([])
  const [clients, setClients]   = useState<Client[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showAdd, setShowAdd]   = useState(false)
  const [addClient, setAddClient] = useState('')
  const [addDomain, setAddDomain] = useState('')
  const [adding, setAdding]     = useState(false)
  const [addError, setAddError] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  const load = () => {
    setLoading(true); setError('')
    Promise.all([emailApi.listDomains(), commsApi.listClients()])
      .then(([d, c]) => { setDomains(d); setClients(c) })
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const openAdd = () => {
    setAddClient(''); setAddDomain(''); setAddError('')
    setShowAdd(true)
  }

  const submitAdd = async () => {
    if (!addClient) { setAddError('Select a client'); return }
    if (!addDomain.includes('.')) { setAddError('Enter a valid domain'); return }
    setAdding(true); setAddError('')
    try {
      const d = await emailApi.addDomain(addClient, addDomain)
      setDomains(prev => [d, ...prev])
      setShowAdd(false)
      setExpanded(d.id)
    } catch (e) {
      setAddError(e instanceof Error ? e.message : 'Failed to add domain')
    } finally {
      setAdding(false)
    }
  }

  const deleteDomain = async (id: string) => {
    if (!window.confirm('Remove this domain?')) return
    setDeleting(id)
    try {
      await emailApi.deleteDomain(id)
      setDomains(prev => prev.filter(d => d.id !== id))
    } catch {
      // leave as-is
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">Email</h1>
          <p className="caption mt-0.5">Manage sending domains · configure DNS · verify records</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Add domain
        </button>
      </div>

      <EmailTabs />

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-red-500/20 bg-red-500/05">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading domains…
        </div>
      ) : domains.length === 0 ? (
        <div className="rounded-2xl border border-white/07 bg-card flex flex-col items-center justify-center py-16 gap-3 text-center">
          <Globe className="w-10 h-10 text-muted-foreground/20" />
          <p className="font-semibold text-foreground">No domains added yet</p>
          <p className="text-sm text-muted-foreground max-w-sm">
            Add a sending domain for each client that wants to send email campaigns.
            You'll get DNS records to configure at their registrar.
          </p>
          <button onClick={openAdd} className="btn-primary mt-1 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add first domain
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {domains.map(d => {
            const open = expanded === d.id
            return (
              <div key={d.id} className="rounded-2xl border border-white/07 bg-card overflow-hidden">
                <div
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                  onClick={() => setExpanded(open ? null : d.id)}
                >
                  <Globe className="w-5 h-5 text-muted-foreground/40 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-foreground font-mono text-sm">{d.domain}</p>
                      {d.verified ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-teal/10 text-teal border border-teal/20">Verified</span>
                      ) : (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">Setup needed</span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground/50 mt-0.5">{d.clientName}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="hidden sm:flex items-center gap-2">
                      {(['SPF', 'DKIM', 'DMARC', 'MX'] as const).map((label, i) => {
                        const vals = [d.spfVerified, d.dkimVerified, d.dmarcVerified, d.mxVerified]
                        return (
                          <div key={label} className="flex flex-col items-center gap-0.5">
                            <Check ok={vals[i]} />
                            <span className="text-[9px] text-muted-foreground/40">{label}</span>
                          </div>
                        )
                      })}
                    </div>
                    <HealthBar domain={d} />
                    <button
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition"
                      onClick={e => { e.stopPropagation(); void deleteDomain(d.id) }}
                      disabled={deleting === d.id}
                    >
                      {deleting === d.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                    {open ? <ChevronUp className="w-4 h-4 text-muted-foreground/40" /> : <ChevronDown className="w-4 h-4 text-muted-foreground/40" />}
                  </div>
                </div>

                {open && <DomainDnsPanel domain={d} />}
              </div>
            )
          })}
        </div>
      )}

      {/* Add domain modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAdd(false)} />
          <div className="relative z-10 bg-[#1a1624] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-5 border-b border-white/08">
              <h2 className="font-semibold text-foreground">Add sending domain</h2>
              <p className="text-xs text-muted-foreground mt-0.5">After adding, configure the DNS records shown at your domain registrar.</p>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="label">Client</label>
                <select
                  className="input"
                  value={addClient}
                  onChange={e => setAddClient(e.target.value)}
                >
                  <option value="">Select client…</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Domain</label>
                <input
                  className="input font-mono"
                  placeholder="example.com"
                  value={addDomain}
                  onChange={e => setAddDomain(e.target.value.toLowerCase().trim())}
                  onKeyDown={e => e.key === 'Enter' && void submitAdd()}
                />
                <p className="text-[10px] text-muted-foreground/50 mt-1">
                  The domain this client will send email from. DNS records will appear after adding.
                </p>
              </div>
              {addError && <p className="text-xs text-red-400">{addError}</p>}
            </div>
            <div className="px-6 py-4 border-t border-white/08 flex gap-2 justify-end">
              <button className="btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn-primary flex items-center gap-2" onClick={() => void submitAdd()} disabled={adding}>
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                Add domain
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

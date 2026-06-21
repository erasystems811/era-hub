import { useEffect, useState, useRef } from 'react'
import {
  Loader2, Search, CheckCircle2, XCircle, Clock, Users,
  Smartphone, Code2, Mail, Phone, FileText, AlertCircle,
} from 'lucide-react'
import { commsApi, OnboardingRequest } from '../../lib/comms-api'
import { pageCache } from '../../lib/cache'

type Tab = 'pending' | 'all'

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function isToday(iso: string) {
  const d = new Date(iso)
  const n = new Date()
  return d.getDate() === n.getDate() && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear()
}

function TierBadge({ tier }: { tier: OnboardingRequest['tier'] }) {
  return tier === 'ai_agent'
    ? (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/12 text-primary">
        <Smartphone className="w-3 h-3" /> AI Agent
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal/12 text-teal">
        <Code2 className="w-3 h-3" /> Developer
      </span>
    )
}

function StatusBadge({ status }: { status: OnboardingRequest['status'] }) {
  if (status === 'approved') return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal/12 text-teal">
      <CheckCircle2 className="w-3 h-3" /> Approved
    </span>
  )
  if (status === 'rejected') return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-500/12 text-red-400">
      <XCircle className="w-3 h-3" /> Rejected
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/12 text-amber-400">
      <Clock className="w-3 h-3" /> Pending
    </span>
  )
}

function RequestCard({
  req,
  onApprove,
  onReject,
}: {
  req: OnboardingRequest
  onApprove: (id: string) => Promise<void>
  onReject:  (id: string, reason: string) => Promise<void>
}) {
  const [acting, setActing]       = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason]       = useState('')
  const [error, setError]         = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleApprove = async () => {
    setActing(true); setError(null)
    try { await onApprove(req.id) }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed'); setActing(false) }
  }

  const handleReject = async () => {
    if (!reason.trim()) { inputRef.current?.focus(); return }
    setActing(true); setError(null)
    try { await onReject(req.id, reason.trim()) }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed'); setActing(false) }
  }

  return (
    <div className="rounded-2xl border border-white/07 bg-card p-5 flex flex-col gap-4">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <TierBadge tier={req.tier} />
          <h3 className="font-bold text-foreground text-base">{req.businessName}</h3>
        </div>
        <span className="text-xs text-muted-foreground/50 shrink-0 whitespace-nowrap">{timeAgo(req.createdAt)}</span>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mail className="w-3.5 h-3.5 shrink-0 text-muted-foreground/40" />
          <span className="truncate">{req.contactEmail}</span>
        </div>
        {req.contactPhone && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="w-3.5 h-3.5 shrink-0 text-muted-foreground/40" />
            <span>{req.contactPhone}</span>
          </div>
        )}
        {req.description && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground sm:col-span-2">
            <FileText className="w-3.5 h-3.5 shrink-0 text-muted-foreground/40 mt-0.5" />
            <span className="line-clamp-2">{req.description}</span>
          </div>
        )}
        {req.planName && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="text-muted-foreground/40 text-xs font-bold uppercase tracking-wide">Plan requested:</span>
            <span className="font-medium text-foreground capitalize">{req.planName}</span>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/8 border border-red-500/15 rounded-lg px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Bottom row — actions or status */}
      {req.status === 'pending' ? (
        <div className="flex flex-col gap-2 pt-1 border-t border-white/06">
          {rejecting ? (
            <div className="flex gap-2">
              <input
                ref={inputRef}
                className="input flex-1 text-sm"
                placeholder="Reason for rejection (required)"
                value={reason}
                onChange={e => setReason(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') void handleReject() }}
                autoFocus
              />
              <button
                onClick={() => void handleReject()}
                disabled={acting || !reason.trim()}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-500/15 text-red-400 border border-red-500/25 hover:bg-red-500/25 disabled:opacity-50 transition"
              >
                {acting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirm'}
              </button>
              <button
                onClick={() => { setRejecting(false); setReason('') }}
                disabled={acting}
                className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/06 transition"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => void handleApprove()}
                disabled={acting}
                className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm"
              >
                {acting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Approve
              </button>
              <button
                onClick={() => setRejecting(true)}
                disabled={acting}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/18 disabled:opacity-50 transition"
              >
                <XCircle className="w-3.5 h-3.5 inline mr-1.5" />
                Reject
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3 pt-1 border-t border-white/06">
          <StatusBadge status={req.status} />
          {req.rejectedReason && (
            <p className="text-xs text-muted-foreground/50 truncate">"{req.rejectedReason}"</p>
          )}
        </div>
      )}
    </div>
  )
}

export function Requests() {
  const [requests, setRequests] = useState<OnboardingRequest[]>(() => pageCache.get<OnboardingRequest[]>('comms:requests') ?? [])
  const [loading, setLoading]   = useState(() => !pageCache.get('comms:requests'))
  const [tab, setTab]           = useState<Tab>('pending')
  const [search, setSearch]     = useState('')
  const [tierFilter, setTierFilter] = useState<'all' | 'ai_agent' | 'developer'>('all')

  const load = async () => {
    try {
      const data = await commsApi.listRequests()
      pageCache.set('comms:requests', data)
      setRequests(data)
    } catch { /* keep existing */ }
    finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [])

  // Auto-refresh every 60s on pending tab
  useEffect(() => {
    if (tab !== 'pending') return
    const id = setInterval(() => void load(), 60_000)
    return () => clearInterval(id)
  }, [tab])

  const handleApprove = async (id: string) => {
    await commsApi.approveRequest(id)
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' as const } : r))
    pageCache.bust('comms:requests')
  }

  const handleReject = async (id: string, reason: string) => {
    await commsApi.rejectRequest(id, reason)
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' as const, rejectedReason: reason } : r))
    pageCache.bust('comms:requests')
  }

  const pending       = requests.filter(r => r.status === 'pending')
  const approvedToday = requests.filter(r => r.status === 'approved' && isToday(r.createdAt))
  const rejected      = requests.filter(r => r.status === 'rejected')

  const filtered = requests
    .filter(r => tab === 'pending' ? r.status === 'pending' : true)
    .filter(r => tierFilter === 'all' || r.tier === tierFilter)
    .filter(r => {
      if (!search) return true
      const q = search.toLowerCase()
      return r.businessName.toLowerCase().includes(q) || r.contactEmail.toLowerCase().includes(q)
    })

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="page-title">Requests</h1>
            {pending.length > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                {pending.length} pending
              </span>
            )}
          </div>
          <p className="caption mt-0.5">Business applications waiting for your approval</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Pending',          value: pending.length,       color: 'text-amber-400' },
          { label: 'Approved today',   value: approvedToday.length, color: 'text-teal'      },
          { label: 'Rejected',         value: rejected.length,      color: 'text-muted-foreground' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-white/07 bg-card px-5 py-4">
            <p className="text-xs text-muted-foreground font-medium mb-1">{s.label}</p>
            <p className={`text-2xl font-bold tabular-nums ${s.color}`}>{loading ? '—' : s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        {([['pending', 'Pending'], ['all', 'All requests']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              tab === id ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-white/06'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
          <input className="input pl-10 text-sm" placeholder="Search by name or email…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input text-sm w-40"
          value={tierFilter} onChange={e => setTierFilter(e.target.value as typeof tierFilter)}>
          <option value="all">All tiers</option>
          <option value="ai_agent">AI Agent</option>
          <option value="developer">Developer</option>
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading requests…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/07 bg-card flex flex-col items-center justify-center py-16 gap-3">
          <Users className="w-10 h-10 text-muted-foreground/20" />
          <p className="font-semibold text-foreground">
            {tab === 'pending' ? 'No pending requests' : 'No requests yet'}
          </p>
          <p className="caption text-sm">
            {tab === 'pending'
              ? 'All caught up — no businesses waiting for approval'
              : 'Requests will appear here once businesses apply'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(r => (
            <RequestCard key={r.id} req={r} onApprove={handleApprove} onReject={handleReject} />
          ))}
        </div>
      )}
    </div>
  )
}

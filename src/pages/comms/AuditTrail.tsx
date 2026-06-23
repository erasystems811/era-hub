import { useEffect, useState, useMemo } from 'react'
import { Search, Download, X, Loader2, FileText, ChevronLeft, ChevronRight } from 'lucide-react'
import { eventsApi, AuditEntry } from '../../lib/events-api'
import { MonitoringTabs } from '../../components/MonitoringTabs'

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function fmtDatetime(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

type Actor = 'all' | 'operator' | 'business' | 'system' | 'ai'

const ACTOR_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  operator: { bg: 'bg-primary/20',   text: 'text-primary', label: 'OP' },
  business: { bg: 'bg-teal/20',      text: 'text-teal',    label: 'BS' },
  system:   { bg: 'bg-white/10',     text: 'text-muted-foreground', label: 'SY' },
  ai:       { bg: 'bg-purple-500/20',text: 'text-purple-400', label: 'AI' },
}

const PAGE_SIZE = 100

function exportCsv(entries: AuditEntry[]) {
  const header = ['Time', 'Actor', 'Actor Label', 'Action', 'Target', 'Detail']
  const rows = entries.map(e => [
    fmtDatetime(e.createdAt),
    e.actor,
    e.actorLabel,
    e.action,
    e.target,
    e.detail,
  ])
  const csv = [header, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a'); a.href = url; a.download = 'audit-trail.csv'; a.click()
  URL.revokeObjectURL(url)
}

export function AuditTrail() {
  const [entries, setEntries]   = useState<AuditEntry[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [search, setSearch]     = useState('')
  const [actor, setActor]       = useState<Actor>('all')
  const [from, setFrom]         = useState('')
  const [to, setTo]             = useState('')
  const [page, setPage]         = useState(0)

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const data = await eventsApi.listAudit({ limit: 500 })
      setEntries(data)
    } catch (e) {
      const msg = e instanceof Error ? e.message : ''
      if (msg.toLowerCase().includes('not found') || msg.includes('404')) {
        setEntries([])
      } else {
        setError(msg || 'Failed to load audit trail')
      }
    } finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return entries.filter(e => {
      if (actor !== 'all' && e.actor !== actor) return false
      if (from && new Date(e.createdAt) < new Date(from)) return false
      if (to   && new Date(e.createdAt) > new Date(to + 'T23:59:59')) return false
      if (q && ![e.actorLabel, e.action, e.target, e.detail].some(f => f.toLowerCase().includes(q))) return false
      return true
    })
  }, [entries, search, actor, from, to])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const clearFilters = () => { setSearch(''); setActor('all'); setFrom(''); setTo(''); setPage(0) }
  const hasFilters   = search || actor !== 'all' || from || to

  return (
    <div className="max-w-5xl">
      <MonitoringTabs />
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="page-title">Audit Trail</h1>
          <p className="caption mt-0.5">Permanent record of every action taken on ERA Comms</p>
        </div>
        <button
          onClick={() => exportCsv(filtered)}
          disabled={filtered.length === 0}
          className="btn-secondary flex items-center gap-2 text-sm disabled:opacity-40"
        >
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-white/07 bg-card p-4 mb-5 space-y-3">
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
            <input className="input pl-9 w-full text-sm" placeholder="Search actions, actors, targets…"
              value={search} onChange={e => { setSearch(e.target.value); setPage(0) }} />
          </div>

          <select className="input text-sm w-40"
            value={actor} onChange={e => { setActor(e.target.value as Actor); setPage(0) }}>
            <option value="all">All actors</option>
            <option value="operator">Operator</option>
            <option value="business">Business</option>
            <option value="system">System</option>
            <option value="ai">AI</option>
          </select>

          <input className="input text-sm w-36" type="date" value={from}
            onChange={e => { setFrom(e.target.value); setPage(0) }} placeholder="From" />
          <input className="input text-sm w-36" type="date" value={to}
            onChange={e => { setTo(e.target.value); setPage(0) }} placeholder="To" />

          {hasFilters && (
            <button onClick={clearFilters}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition px-3 py-2 rounded-lg border border-white/07 hover:bg-white/05">
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground/50">
          {loading ? 'Loading…' : `${filtered.length} entries${hasFilters ? ' matching filters' : ''}`}
        </p>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-start gap-4 px-2">
              <div className="w-8 h-8 rounded-full bg-white/05 animate-pulse shrink-0 mt-1" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-white/05 animate-pulse rounded w-48" />
                <div className="h-3 bg-white/05 animate-pulse rounded w-72" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center">
          <p className="text-sm font-medium text-foreground mb-1">Failed to load audit trail</p>
          <p className="text-xs text-muted-foreground mb-3">{error}</p>
          <button onClick={load} className="btn-secondary text-sm">Try again</button>
        </div>
      ) : paged.length === 0 ? (
        <div className="rounded-xl border border-white/07 bg-card flex flex-col items-center justify-center py-16 gap-3">
          <FileText className="w-8 h-8 text-muted-foreground/20" />
          <p className="font-semibold text-foreground">{hasFilters ? 'No entries match your filters' : 'No audit entries yet'}</p>
          <p className="caption text-sm">Actions taken on ERA Comms will appear here</p>
          {hasFilters && <button onClick={clearFilters} className="btn-secondary text-sm mt-1">Clear filters</button>}
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[15px] top-4 bottom-4 w-px bg-white/06 pointer-events-none" />

          <div className="space-y-0">
            {paged.map((entry, idx) => {
              const style = ACTOR_STYLES[entry.actor] ?? ACTOR_STYLES.system
              return (
                <div key={entry.id} className={`relative flex items-start gap-4 py-3.5 px-2 rounded-xl transition-colors hover:bg-white/[0.025] ${idx !== paged.length - 1 ? 'border-b border-white/04' : ''}`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold z-10 mt-0.5 ${style.bg} ${style.text}`}>
                    {style.label}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-foreground">{entry.actorLabel}</span>
                          <span className="text-xs text-muted-foreground/50">·</span>
                          <span className="text-sm text-foreground">{entry.action}</span>
                          {entry.target && (
                            <>
                              <span className="text-xs text-muted-foreground/50">→</span>
                              <span className="text-sm text-muted-foreground">{entry.target}</span>
                            </>
                          )}
                        </div>
                        {entry.detail && (
                          <p className="text-xs text-muted-foreground/60 mt-0.5 truncate">{entry.detail}</p>
                        )}
                      </div>
                      <span
                        className="text-xs text-muted-foreground/40 shrink-0 whitespace-nowrap tabular-nums mt-0.5"
                        title={fmtDatetime(entry.createdAt)}
                      >
                        {timeAgo(entry.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/06">
              <p className="text-xs text-muted-foreground">
                Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => p - 1)} disabled={page === 0}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/07 text-xs text-muted-foreground hover:text-foreground hover:bg-white/05 disabled:opacity-30 transition">
                  <ChevronLeft className="w-3.5 h-3.5" /> Prev
                </button>
                <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/07 text-xs text-muted-foreground hover:text-foreground hover:bg-white/05 disabled:opacity-30 transition">
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

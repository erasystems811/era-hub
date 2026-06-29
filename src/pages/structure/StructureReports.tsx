import { useEffect, useState } from 'react'
import { structureApi, Report } from '../../lib/structure-api'
import { ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react'

const SECTION_LABELS: Record<string, string> = {
  executiveSummary: 'Executive Summary',
  ownerDependency: 'Owner Dependency',
  staffCapability: 'Staff Capability',
  processMaturity: 'Process Maturity',
  revenueLeak: 'Revenue Leak',
  priorityActions: 'Priority Actions',
  implementationRoadmap: 'Implementation Roadmap',
}

function ReportRow({ r, onRelease }: { r: Report; onRelease: (id: string, notes: string) => Promise<void> }) {
  const [expanded, setExpanded] = useState(false)
  const [notes, setNotes] = useState('')
  const [releasing, setReleasing] = useState(false)

  const biz = r.businesses as { name: string; owner_name: string; business_types: { name: string } | null } | null
  const content = r.generated_content as Record<string, unknown> | null

  const handleRelease = async () => {
    setReleasing(true)
    try { await onRelease(r.id, notes) } finally { setReleasing(false) }
  }

  return (
    <div className="border-b border-white/05 last:border-0">
      <div
        className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-white/[0.02] transition"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{biz?.name}</p>
          <p className="text-[11px] text-muted-foreground/40">{biz?.owner_name} · {(biz?.business_types as { name: string } | null)?.name ?? '—'}</p>
        </div>
        <span className="text-[11px] text-muted-foreground/40">{new Date(r.generated_at).toLocaleDateString('en-NG')}</span>
        {r.status === 'released' ? (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#4DBFB3]/10 text-[#4DBFB3] font-semibold">Released</span>
        ) : (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#CC7896]/10 text-[#CC7896] font-semibold">Pending</span>
        )}
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground/30 shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground/30 shrink-0" />}
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 bg-white/[0.02]">
          {content && (
            <div className="space-y-3">
              {Object.entries(SECTION_LABELS).map(([key, label]) => {
                const val = (content as Record<string, unknown>)[key]
                if (!val) return null
                return (
                  <div key={key} className="rounded-lg border border-white/08 p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#C9952B] mb-1.5">{label}</p>
                    {typeof val === 'string' ? (
                      <p className="text-sm text-muted-foreground/80 leading-relaxed">{val}</p>
                    ) : Array.isArray(val) ? (
                      <ul className="space-y-1">
                        {(val as string[]).map((item, i) => (
                          <li key={i} className="text-sm text-muted-foreground/80 flex gap-2">
                            <span className="text-[#C9952B] shrink-0">·</span>{item}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <pre className="text-xs text-muted-foreground/60 whitespace-pre-wrap">{JSON.stringify(val, null, 2)}</pre>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {r.status === 'pending' && (
            <div className="space-y-2 pt-2">
              <label className="text-[11px] text-muted-foreground/50 block">Admin notes before release (optional)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                placeholder="Any corrections or notes for the client…"
                className="w-full px-3 py-2 rounded-lg text-sm bg-white/[0.05] border border-white/10 text-foreground placeholder-muted-foreground/30 focus:outline-none focus:border-[#C9952B]/50 resize-none"
              />
              <button onClick={handleRelease} disabled={releasing}
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold text-background bg-[#C9952B] hover:bg-[#C9952B]/90 disabled:opacity-50 transition">
                <CheckCircle2 className="w-4 h-4" />
                {releasing ? 'Releasing…' : 'Release to Client'}
              </button>
            </div>
          )}

          {r.status === 'released' && r.admin_notes && (
            <div className="text-xs text-muted-foreground/50 border-t border-white/05 pt-2 mt-2">
              <span className="font-semibold">Notes: </span>{r.admin_notes}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function StructureReports() {
  const [pending, setPending] = useState<Report[]>([])
  const [released, setReleased] = useState<Report[]>([])
  const [tab, setTab] = useState<'pending' | 'released'>('pending')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([structureApi.listReports('pending'), structureApi.listReports('released')])
      .then(([p, r]) => { setPending(p); setReleased(r) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const handleRelease = async (id: string, notes: string) => {
    await structureApi.releaseReport(id, notes)
    const released = pending.find(r => r.id === id)
    if (released) {
      setPending(prev => prev.filter(r => r.id !== id))
      setReleased(prev => [{ ...released, status: 'released', released_at: new Date().toISOString(), admin_notes: notes }, ...prev])
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-bold text-foreground">Reports</h1>
        <p className="text-xs text-muted-foreground/50 mt-0.5">Review generated reports before releasing to clients</p>
      </div>

      {error && <div className="text-sm text-red-400 bg-red-500/5 border border-red-500/20 rounded-lg px-4 py-3">{error}</div>}

      <div className="flex gap-1 border-b border-white/08">
        {(['pending', 'released'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition -mb-px ${tab === t ? 'border-[#C9952B] text-[#C9952B]' : 'border-transparent text-muted-foreground/50 hover:text-foreground'}`}>
            {t === 'pending' ? 'Pending' : 'Released'}
            <span className="ml-2 text-[11px] px-1.5 py-0.5 rounded-full bg-white/05">
              {t === 'pending' ? pending.length : released.length}
            </span>
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-white/08 bg-white/[0.03] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground/40">Loading…</div>
        ) : (tab === 'pending' ? pending : released).length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground/40">
            {tab === 'pending' ? 'No reports awaiting review' : 'No released reports yet'}
          </div>
        ) : (
          (tab === 'pending' ? pending : released).map(r => (
            <ReportRow key={r.id} r={r} onRelease={handleRelease} />
          ))
        )}
      </div>
    </div>
  )
}

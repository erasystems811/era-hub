import { useEffect, useState } from 'react'
import { structureApi, Report } from '../../lib/structure-api'
import { ChevronDown, ChevronUp, CheckCircle2, Sparkles, Loader2 } from 'lucide-react'

const BLOCK_NAMES: Record<string, string> = {
  A: 'Business Fundamentals', B: 'Owner Load', C: 'Operations',
  D: 'People & Staff', E: 'Financial Visibility', F: 'Customer Management',
}

const AI_SECTIONS: Record<string, string> = {
  business_snapshot: 'Business Snapshot',
  contradiction: 'Reality vs Perception',
  gap_analysis: 'Gap Analysis',
  revenue_leaks: 'Revenue Leaks',
  delegation_readiness: 'Delegation Readiness',
  priority_sequence: 'Priority Action Sequence',
  structured_vision: 'Structured Vision',
}

type Responses = {
  layer1: Record<string, unknown>
  layer2: Record<string, unknown>
  questions: { id: string; block: string; question_text: string; layer: number }[]
  staff: { name: string; role: string }[]
}

function ReportRow({ r, onRelease, onUpdate }: { r: Report; onRelease: (id: string, notes: string) => Promise<void>; onUpdate: (r: Report) => void }) {
  const [expanded, setExpanded] = useState(false)
  const [notes, setNotes] = useState(r.admin_notes ?? '')
  const [releasing, setReleasing] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState('')
  const [responses, setResponses] = useState<Responses | null>(null)
  const [loadingResponses, setLoadingResponses] = useState(false)
  const [activeTab, setActiveTab] = useState<'answers' | 'analysis'>('answers')

  const biz = r.businesses as { name: string; owner_name: string; business_types: { name: string } | null } | null
  const content = r.generated_content as Record<string, unknown> | null
  const hasAnalysis = content && Object.keys(content).length > 0

  useEffect(() => {
    if (expanded && !responses) {
      setLoadingResponses(true)
      structureApi.getReportResponses(r.business_id)
        .then(setResponses)
        .catch(() => {})
        .finally(() => setLoadingResponses(false))
    }
  }, [expanded])

  const handleGenerate = async () => {
    setGenerating(true)
    setGenError('')
    try {
      const { report } = await structureApi.generateReportAnalysis(r.business_id)
      onUpdate(report)
      setActiveTab('analysis')
    } catch (e) {
      setGenError(e instanceof Error ? e.message : 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  const handleRelease = async () => {
    setReleasing(true)
    try { await onRelease(r.id, notes) } finally { setReleasing(false) }
  }

  const layer1Qs = responses?.questions.filter(q => q.layer === 1) ?? []
  const blocks = [...new Set(layer1Qs.map(q => q.block))].sort()

  return (
    <div className="border-b border-white/05 last:border-0">
      <div className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-white/[0.02] transition" onClick={() => setExpanded(v => !v)}>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{biz?.name}</p>
          <p className="text-[11px] text-muted-foreground/40">{biz?.owner_name} · {(biz?.business_types as { name: string } | null)?.name ?? '—'}</p>
        </div>
        <span className="text-[11px] text-muted-foreground/40">{new Date(r.generated_at).toLocaleDateString('en-NG')}</span>
        {hasAnalysis && <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#C9952B]/10 text-[#C9952B] font-semibold">Analysis ready</span>}
        {r.status === 'released'
          ? <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#4DBFB3]/10 text-[#4DBFB3] font-semibold">Released</span>
          : <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#CC7896]/10 text-[#CC7896] font-semibold">Pending</span>}
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground/30 shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground/30 shrink-0" />}
      </div>

      {expanded && (
        <div className="bg-white/[0.02] border-t border-white/05">

          {/* Tab bar */}
          <div className="flex gap-1 px-4 border-b border-white/05">
            {(['answers', 'analysis'] as const).map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`px-3 py-2 text-xs font-medium border-b-2 transition -mb-px ${activeTab === t ? 'border-[#C9952B] text-[#C9952B]' : 'border-transparent text-muted-foreground/50 hover:text-foreground'}`}>
                {t === 'answers' ? 'What they filled in' : 'AI Analysis'}
              </button>
            ))}
          </div>

          {/* Answers tab */}
          {activeTab === 'answers' && (
            <div className="p-4 space-y-4">
              {loadingResponses ? (
                <p className="text-xs text-muted-foreground/40 text-center py-4">Loading responses…</p>
              ) : !responses ? (
                <p className="text-xs text-muted-foreground/40 text-center py-4">Could not load responses</p>
              ) : (
                <>
                  {/* Layer 1 — Assessment */}
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#C9952B]">Business Assessment (Layer 1)</p>
                  {blocks.map(block => {
                    const qs = layer1Qs.filter(q => q.block === block)
                    return (
                      <div key={block} className="space-y-2">
                        <p className="text-xs font-semibold text-foreground/60">{BLOCK_NAMES[block] ?? `Block ${block}`}</p>
                        {qs.map(q => {
                          const ans = responses.layer1[q.id]
                          return (
                            <div key={q.id} className="rounded-lg bg-white/[0.03] border border-white/06 px-3 py-2.5">
                              <p className="text-[11px] text-muted-foreground/50 mb-1">{q.question_text}</p>
                              <p className="text-sm text-foreground/80">{ans !== undefined && ans !== null && ans !== '' ? String(ans) : <span className="text-muted-foreground/30 italic">No answer</span>}</p>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}

                  {/* Layer 2 — Interview */}
                  {Object.keys(responses.layer2).length > 0 && (
                    <>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[#C9952B] pt-2">Owner Interview (Layer 2)</p>
                      {Object.entries(responses.layer2).map(([key, val]) => (
                        <div key={key} className="rounded-lg bg-white/[0.03] border border-white/06 px-3 py-2.5">
                          <p className="text-[11px] text-muted-foreground/50 mb-1">{key.replace(/_/g, ' ')}</p>
                          <p className="text-sm text-foreground/80">{val !== undefined && val !== null && String(val) !== '' ? String(val) : <span className="text-muted-foreground/30 italic">No answer</span>}</p>
                        </div>
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* Analysis tab */}
          {activeTab === 'analysis' && (
            <div className="p-4 space-y-4">
              {!hasAnalysis ? (
                <div className="text-center py-6 space-y-3">
                  <p className="text-sm text-muted-foreground/50">No analysis generated yet.</p>
                  {genError && <p className="text-xs text-red-400">{genError}</p>}
                  <button onClick={handleGenerate} disabled={generating}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-[#C9952B] text-background hover:bg-[#C9952B]/90 disabled:opacity-50 transition">
                    {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {generating ? 'Generating…' : 'Generate AI Analysis'}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#C9952B]">AI Analysis</p>
                    <button onClick={handleGenerate} disabled={generating}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-white/05 text-muted-foreground/60 hover:text-foreground hover:bg-white/10 disabled:opacity-50 transition">
                      {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      {generating ? 'Regenerating…' : 'Regenerate'}
                    </button>
                  </div>
                  {genError && <p className="text-xs text-red-400">{genError}</p>}
                  {Object.entries(AI_SECTIONS).map(([key, label]) => {
                    const val = content?.[key]
                    if (!val) return null
                    return (
                      <div key={key} className="rounded-lg border border-white/08 p-3">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-[#C9952B] mb-1.5">{label}</p>
                        {typeof val === 'string' ? (
                          <p className="text-sm text-muted-foreground/80 leading-relaxed whitespace-pre-line">{val}</p>
                        ) : Array.isArray(val) ? (
                          <div className="space-y-2">
                            {(val as Record<string, unknown>[]).map((item, i) => (
                              <div key={i} className="rounded bg-white/[0.03] p-2.5">
                                {typeof item === 'string' ? (
                                  <p className="text-sm text-muted-foreground/80">{item}</p>
                                ) : (
                                  <>
                                    {item.title && <p className="text-sm font-semibold text-foreground/80">{String(item.title)}</p>}
                                    {item.description && <p className="text-xs text-muted-foreground/60 mt-0.5">{String(item.description)}</p>}
                                    {item.monthly_naira && <p className="text-xs text-[#CC7896] mt-1 font-semibold">₦{Number(item.monthly_naira).toLocaleString()} / month</p>}
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <pre className="text-xs text-muted-foreground/60 whitespace-pre-wrap">{JSON.stringify(val, null, 2)}</pre>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Admin notes + release */}
          {r.status === 'pending' && (
            <div className="px-4 pb-4 space-y-2 border-t border-white/05 pt-4">
              <label className="text-[11px] text-muted-foreground/50 block">Your corrections or notes for the client (optional)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                placeholder="Add any corrections, context, or specific recommendations before releasing…"
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
            <div className="px-4 pb-4 text-xs text-muted-foreground/50 border-t border-white/05 pt-3">
              <span className="font-semibold">Your notes: </span>{r.admin_notes}
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
    const r = pending.find(r => r.id === id)
    if (r) {
      setPending(prev => prev.filter(x => x.id !== id))
      setReleased(prev => [{ ...r, status: 'released', released_at: new Date().toISOString(), admin_notes: notes }, ...prev])
    }
  }

  const handleUpdate = (updated: Report) => {
    setPending(prev => prev.map(r => r.id === updated.id ? { ...r, generated_content: updated.generated_content } : r))
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-bold text-foreground">Reports</h1>
        <p className="text-xs text-muted-foreground/50 mt-0.5">Review everything the client filled in, generate AI analysis, then release</p>
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
            <ReportRow key={r.id} r={r} onRelease={handleRelease} onUpdate={handleUpdate} />
          ))
        )}
      </div>
    </div>
  )
}

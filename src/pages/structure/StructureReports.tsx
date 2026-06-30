import { useEffect, useState } from 'react'
import { structureApi, Report } from '../../lib/structure-api'
import { ChevronDown, ChevronUp, CheckCircle2, Sparkles, Loader2, AlertTriangle, AlertCircle, Info } from 'lucide-react'

const BLOCK_NAMES: Record<string, string> = {
  A: 'Business Fundamentals', B: 'Owner Load', C: 'Operations',
  D: 'People & Staff', E: 'Financial Visibility', F: 'Customer Management',
}

const CATEGORY_LABELS: Record<string, string> = {
  owner_dependency: 'Owner Dependency', process_gap: 'Process Gap',
  financial_visibility: 'Financial Visibility', staff_clarity: 'Staff Clarity',
  customer_experience: 'Customer Experience', revenue_leakage: 'Revenue Leakage',
  decision_bottleneck: 'Decision Bottleneck', growth_ceiling: 'Growth Ceiling',
}

const SEVERITY_STYLE: Record<string, string> = {
  Critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  High: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  Medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
}

const PRIORITY_STYLE: Record<string, string> = {
  Urgent: 'bg-red-500/10 text-red-400',
  Important: 'bg-orange-500/10 text-orange-400',
  Standard: 'bg-white/05 text-muted-foreground/50',
}

type MatrixTask = { task?: string; source?: string; note?: string }
type ReportContent = {
  executive_summary?: { situation?: string; complication?: string; resolution?: string[] }
  business_snapshot?: { type?: string; staff_count?: number; owner_stated_problem?: string; current_stage?: string; one_line_diagnosis?: string }
  key_findings?: { headline?: string; evidence?: string; root_cause?: string; impact?: string; category?: string }[]
  contradiction_analysis?: { owner_stated?: string; reality?: string }[]
  revenue_leakage?: { title?: string; description?: string; frequency?: string; monthly_min?: number; monthly_max?: number; calculation_note?: string }[]
  structural_gaps?: { gap?: string; severity?: string; impact?: string }[]
  priority_actions?: {
    immediate?: { action?: string; owner?: string; success_looks_like?: string; time_estimate?: string }[]
    short_term?: { action?: string; owner?: string; success_looks_like?: string; time_estimate?: string }[]
    medium_term?: { action?: string; owner?: string; success_looks_like?: string; time_estimate?: string }[]
  }
  sop_list?: { title?: string; responsible?: string; priority?: string }[]
  delegation_readiness?: { person?: string; role?: string; tasks_to_absorb?: string; what_they_need_first?: string; risk_note?: string }[]
  vision_90_days?: string[]
  closing_assessment?: string
  eisenhower_matrix?: {
    q1_do?: MatrixTask[]
    q2_schedule?: MatrixTask[]
    q3_delegate?: MatrixTask[]
    q4_eliminate?: MatrixTask[]
  }
}

type Responses = {
  layer1: Record<string, unknown>
  layer2: Record<string, unknown>
  questions: { id: string; block: string; question_text: string; layer: number }[]
  staff: { name: string; role: string }[]
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-bold uppercase tracking-widest text-[#C9952B] mb-3">{children}</p>
}

const QUADRANTS = [
  {
    key: 'q1_do' as const,
    label: 'DO NOW',
    sub: 'Urgent + Important',
    description: 'Handle these personally — today.',
    border: 'border-red-500/30',
    tag: 'bg-red-500/10 text-red-400',
    dot: 'bg-red-400',
    num: '1',
    numColor: 'text-red-400',
  },
  {
    key: 'q2_schedule' as const,
    label: 'SCHEDULE',
    sub: 'Important, Not Urgent',
    description: 'Block time for this. This is where growth lives.',
    border: 'border-[#4DBFB3]/30',
    tag: 'bg-[#4DBFB3]/10 text-[#4DBFB3]',
    dot: 'bg-[#4DBFB3]',
    num: '2',
    numColor: 'text-[#4DBFB3]',
  },
  {
    key: 'q3_delegate' as const,
    label: 'DELEGATE',
    sub: 'Urgent, Not Important',
    description: 'Someone else or a system should handle this.',
    border: 'border-[#C9952B]/30',
    tag: 'bg-[#C9952B]/10 text-[#C9952B]',
    dot: 'bg-[#C9952B]',
    num: '3',
    numColor: 'text-[#C9952B]',
  },
  {
    key: 'q4_eliminate' as const,
    label: 'ELIMINATE',
    sub: 'Not Urgent, Not Important',
    description: 'Stop doing this. It costs time and returns nothing.',
    border: 'border-white/10',
    tag: 'bg-white/05 text-muted-foreground/40',
    dot: 'bg-muted-foreground/30',
    num: '4',
    numColor: 'text-muted-foreground/30',
  },
]

function EisenhowerMatrix({ matrix, businessName, isSolo }: { matrix: ReportContent['eisenhower_matrix']; businessName: string; isSolo: boolean }) {
  if (!matrix) return null
  return (
    <div className="rounded-2xl border border-[#C9952B]/20 overflow-hidden bg-[#0A1628]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/06 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#C9952B]">Eisenhower Priority Matrix</p>
          <p className="text-[11px] text-muted-foreground/40 mt-0.5">{businessName} · ERA Structure Diagnostic</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground/30 uppercase tracking-wider">Urgency →</p>
        </div>
      </div>

      {/* Axis labels */}
      <div className="flex">
        <div className="w-6 flex items-center justify-center py-4">
          <p className="text-[9px] text-muted-foreground/30 uppercase tracking-widest" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Importance ↑</p>
        </div>
        <div className="flex-1 grid grid-cols-2 gap-px bg-white/05 p-px">
          {QUADRANTS.map(q => {
            const tasks = matrix[q.key] ?? []
            return (
              <div key={q.key} className={`bg-[#0A1628] p-4 min-h-[220px] border ${q.border}`}>
                {/* Quadrant header */}
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-2xl font-black opacity-20 ${q.numColor}`}>{q.num}</span>
                  <div>
                    <p className={`text-[11px] font-black tracking-widest ${q.numColor}`}>{q.label}</p>
                    <p className="text-[10px] text-muted-foreground/30">{q.sub}</p>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground/30 mb-3 border-b border-white/04 pb-2 italic">{q.description}</p>

                {/* Tasks */}
                <div className="space-y-2">
                  {tasks.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground/20 italic">No tasks identified here</p>
                  ) : tasks.map((t, i) => (
                    <div key={i} className="group">
                      <div className="flex items-start gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${t.source === 'suggested' ? 'opacity-40' : ''} ${q.dot}`} />
                        <div className="flex-1">
                          <p className="text-xs text-foreground/80 leading-snug">{t.task}</p>
                          {t.source === 'suggested' && <span className="text-[9px] text-muted-foreground/25 uppercase tracking-wider">suggested</span>}
                          {t.note && <p className="text-[10px] text-muted-foreground/35 mt-0.5 leading-snug hidden group-hover:block">{t.note}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer note for solopreneurs */}
      {isSolo && (
        <div className="px-6 py-3 border-t border-white/06 bg-[#C9952B]/05">
          <p className="text-[10px] text-[#C9952B]/70">
            <span className="font-bold">Solo operator note:</span> Quadrant 3 shows tasks to automate or outsource as the business grows — not tasks to hand off today.
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="px-6 py-3 border-t border-white/06 flex gap-4">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-white/40" />
          <p className="text-[10px] text-muted-foreground/40">From your assessment</p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-white/15" />
          <p className="text-[10px] text-muted-foreground/30">Suggested (hover for why)</p>
        </div>
      </div>
    </div>
  )
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-lg border border-white/08 p-3.5 ${className}`}>{children}</div>
}

type ActionItem = { action?: string; owner?: string; success_looks_like?: string; time_estimate?: string }
function ActionTier({ label, color, items }: { label: string; color: string; items: ActionItem[] | undefined }) {
  if (!items?.length) return null
  return (
    <div>
      <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${color}`}>{label}</p>
      <div className="space-y-2">
        {items.map((a: ActionItem, i: number) => (
          <div key={i} className="rounded-lg border border-white/06 bg-white/[0.02] p-3">
            <p className="text-sm font-semibold text-foreground/90 mb-1">{a.action}</p>
            <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground/50 mt-1.5">
              {a.owner && <span>Owner: <span className="text-foreground/60">{a.owner}</span></span>}
              {a.time_estimate && <span>Time: <span className="text-foreground/60">{a.time_estimate}</span></span>}
            </div>
            {a.success_looks_like && <p className="text-[11px] text-muted-foreground/40 mt-1.5 border-t border-white/05 pt-1.5">Done when: {a.success_looks_like}</p>}
          </div>
        ))}
      </div>
    </div>
  )
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
  const content = r.generated_content as ReportContent | null
  const hasAnalysis = content && Object.keys(content).length > 0

  useEffect(() => {
    if (expanded && !responses) {
      setLoadingResponses(true)
      structureApi.getReportResponses(r.business_id)
        .then(setResponses).catch(() => {}).finally(() => setLoadingResponses(false))
    }
  }, [expanded])

  const handleGenerate = async () => {
    setGenerating(true); setGenError('')
    try {
      const { report } = await structureApi.generateReportAnalysis(r.business_id)
      onUpdate(report); setActiveTab('analysis')
    } catch (e) { setGenError(e instanceof Error ? e.message : 'Generation failed') }
    finally { setGenerating(false) }
  }

  const handleRelease = async () => {
    setReleasing(true)
    try { await onRelease(r.id, notes) } finally { setReleasing(false) }
  }

  const layer1Qs = responses?.questions.filter(q => q.layer === 1) ?? []
  const blocks = [...new Set(layer1Qs.map(q => q.block))].sort()
  const totalLeak = (content?.revenue_leakage ?? []).reduce((sum, l) => sum + (l.monthly_max ?? 0), 0)

  return (
    <div className="border-b border-white/05 last:border-0">
      <div className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-white/[0.02] transition" onClick={() => setExpanded(v => !v)}>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{biz?.name}</p>
          <p className="text-[11px] text-muted-foreground/40">{biz?.owner_name} · {(biz?.business_types as { name: string } | null)?.name ?? '—'}</p>
        </div>
        {totalLeak > 0 && <span className="text-[11px] text-[#CC7896] font-semibold">₦{totalLeak.toLocaleString()} leak/mo</span>}
        <span className="text-[11px] text-muted-foreground/40">{new Date(r.generated_at).toLocaleDateString('en-NG')}</span>
        {hasAnalysis && <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#C9952B]/10 text-[#C9952B] font-semibold">Analysis ready</span>}
        {r.status === 'released'
          ? <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#4DBFB3]/10 text-[#4DBFB3] font-semibold">Released</span>
          : <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#CC7896]/10 text-[#CC7896] font-semibold">Pending</span>}
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground/30 shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground/30 shrink-0" />}
      </div>

      {expanded && (
        <div className="bg-white/[0.02] border-t border-white/05">
          <div className="flex gap-1 px-4 border-b border-white/05">
            {(['answers', 'analysis'] as const).map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`px-3 py-2 text-xs font-medium border-b-2 transition -mb-px ${activeTab === t ? 'border-[#C9952B] text-[#C9952B]' : 'border-transparent text-muted-foreground/50 hover:text-foreground'}`}>
                {t === 'answers' ? 'What they filled in' : 'AI Analysis'}
              </button>
            ))}
          </div>

          {/* RAW ANSWERS TAB */}
          {activeTab === 'answers' && (
            <div className="p-4 space-y-5">
              {loadingResponses ? (
                <p className="text-xs text-muted-foreground/40 text-center py-4">Loading…</p>
              ) : !responses ? (
                <p className="text-xs text-muted-foreground/40 text-center py-4">Could not load responses</p>
              ) : (
                <>
                  <div>
                    <SectionTitle>Business Assessment (Layer 1)</SectionTitle>
                    <div className="space-y-4">
                      {blocks.map(block => {
                        const qs = layer1Qs.filter(q => q.block === block)
                        return (
                          <div key={block}>
                            <p className="text-xs font-semibold text-foreground/50 mb-2">{BLOCK_NAMES[block] ?? `Block ${block}`}</p>
                            <div className="space-y-1.5">
                              {qs.map(q => {
                                const ans = responses.layer1[q.id]
                                return (
                                  <div key={q.id} className="rounded-lg bg-white/[0.02] border border-white/05 px-3 py-2.5">
                                    <p className="text-[11px] text-muted-foreground/40 mb-1">{q.question_text}</p>
                                    <p className="text-sm text-foreground/80">{ans !== undefined && ans !== null && ans !== '' ? String(ans) : <span className="italic text-muted-foreground/25">No answer</span>}</p>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  {Object.keys(responses.layer2).length > 0 && (
                    <div>
                      <SectionTitle>Owner & Team Interview (Layer 2)</SectionTitle>
                      <div className="space-y-1.5">
                        {Object.entries(responses.layer2).map(([key, val]) => (
                          <div key={key} className="rounded-lg bg-white/[0.02] border border-white/05 px-3 py-2.5">
                            <p className="text-[11px] text-muted-foreground/40 mb-1">{key.replace(/_/g, ' ')}</p>
                            <p className="text-sm text-foreground/80">{val !== null && val !== undefined && String(val) !== '' ? String(val) : <span className="italic text-muted-foreground/25">No answer</span>}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* AI ANALYSIS TAB */}
          {activeTab === 'analysis' && (
            <div className="p-4 space-y-6">
              {!hasAnalysis ? (
                <div className="rounded-xl border border-[#C9952B]/20 bg-[#C9952B]/05 p-6 text-center space-y-4">
                  <Sparkles className="w-8 h-8 text-[#C9952B] mx-auto opacity-60" />
                  <div>
                    <p className="text-sm font-semibold text-white mb-1">No analysis generated yet</p>
                    <p className="text-xs text-white/40">Click the button below to run the AI diagnostic report for this business.</p>
                  </div>
                  {genError && <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{genError}</p>}
                  <button onClick={handleGenerate} disabled={generating}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold bg-[#C9952B] text-[#0B1220] hover:bg-[#C9952B]/90 disabled:opacity-50 transition">
                    {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {generating ? 'Generating — this takes 30–60 seconds…' : 'Generate AI Analysis'}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground/40">AI-generated diagnostic report</p>
                    <button onClick={handleGenerate} disabled={generating}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-white/05 text-muted-foreground/50 hover:text-foreground disabled:opacity-40 transition">
                      {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      {generating ? 'Regenerating…' : 'Regenerate'}
                    </button>
                  </div>
                  {genError && <p className="text-xs text-red-400">{genError}</p>}

                  {/* Executive Summary */}
                  {content?.executive_summary && (
                    <div>
                      <SectionTitle>Executive Summary</SectionTitle>
                      <Card className="space-y-3">
                        {content.executive_summary.situation && <p className="text-sm text-muted-foreground/70 leading-relaxed">{content.executive_summary.situation}</p>}
                        {content.executive_summary.complication && (
                          <div className="border-l-2 border-[#CC7896] pl-3">
                            <p className="text-sm text-foreground/80 leading-relaxed font-medium">{content.executive_summary.complication}</p>
                          </div>
                        )}
                        {content.executive_summary.resolution && content.executive_summary.resolution.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            {content.executive_summary.resolution.map((r, i) => (
                              <div key={i} className="flex gap-2">
                                <span className="text-[#C9952B] font-bold text-xs mt-0.5 shrink-0">{i + 1}.</span>
                                <p className="text-sm text-foreground/80">{r}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </Card>
                    </div>
                  )}

                  {/* Business Snapshot */}
                  {content?.business_snapshot && (
                    <div>
                      <SectionTitle>Business Snapshot</SectionTitle>
                      <Card>
                        {content.business_snapshot.one_line_diagnosis && (
                          <div className="bg-[#C9952B]/10 border border-[#C9952B]/20 rounded-lg px-3 py-2 mb-3">
                            <p className="text-sm font-semibold text-[#C9952B]">{content.business_snapshot.one_line_diagnosis}</p>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {content.business_snapshot.current_stage && <div><span className="text-muted-foreground/40 text-xs">Stage</span><p className="text-foreground/80">{content.business_snapshot.current_stage}</p></div>}
                          {content.business_snapshot.staff_count !== undefined && <div><span className="text-muted-foreground/40 text-xs">Staff</span><p className="text-foreground/80">{content.business_snapshot.staff_count}</p></div>}
                        </div>
                        {content.business_snapshot.owner_stated_problem && (
                          <div className="mt-3 pt-3 border-t border-white/06">
                            <p className="text-[11px] text-muted-foreground/40 mb-1">Owner stated problem</p>
                            <p className="text-sm text-foreground/70 italic">"{content.business_snapshot.owner_stated_problem}"</p>
                          </div>
                        )}
                      </Card>
                    </div>
                  )}

                  {/* Key Findings */}
                  {content?.key_findings && content.key_findings.length > 0 && (
                    <div>
                      <SectionTitle>Key Findings</SectionTitle>
                      <div className="space-y-3">
                        {content.key_findings.map((f, i) => (
                          <Card key={i}>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <p className="text-sm font-semibold text-foreground/90 leading-snug">{f.headline}</p>
                              {f.category && <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/05 text-muted-foreground/40 shrink-0">{CATEGORY_LABELS[f.category] ?? f.category}</span>}
                            </div>
                            {f.evidence && <p className="text-xs text-muted-foreground/60 mb-2 border-l-2 border-white/10 pl-2">{f.evidence}</p>}
                            {f.root_cause && <p className="text-xs text-muted-foreground/50 mb-1"><span className="text-muted-foreground/30 font-semibold">Root cause: </span>{f.root_cause}</p>}
                            {f.impact && <p className="text-xs text-[#CC7896]"><span className="font-semibold">Impact: </span>{f.impact}</p>}
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contradiction Analysis */}
                  {content?.contradiction_analysis && content.contradiction_analysis.length > 0 && (
                    <div>
                      <SectionTitle>Reality vs Perception</SectionTitle>
                      <div className="space-y-2">
                        {content.contradiction_analysis.map((c, i) => (
                          <div key={i} className="rounded-lg border border-white/08 overflow-hidden">
                            <div className="px-3 py-2 bg-white/[0.02]">
                              <p className="text-[10px] text-muted-foreground/30 font-semibold uppercase mb-1">Owner stated</p>
                              <p className="text-sm text-foreground/60 italic">"{c.owner_stated}"</p>
                            </div>
                            <div className="px-3 py-2 bg-[#CC7896]/5 border-t border-white/05">
                              <p className="text-[10px] text-[#CC7896] font-semibold uppercase mb-1">Reality</p>
                              <p className="text-sm text-foreground/80">{c.reality}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Revenue Leakage */}
                  {content?.revenue_leakage && content.revenue_leakage.length > 0 && (
                    <div>
                      <SectionTitle>Revenue Leakage</SectionTitle>
                      <div className="space-y-2">
                        {content.revenue_leakage.map((l, i) => (
                          <Card key={i}>
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className="text-sm font-semibold text-foreground/90">{l.title}</p>
                              {l.monthly_min !== undefined && l.monthly_max !== undefined && (
                                <span className="text-sm font-bold text-[#CC7896] shrink-0">₦{l.monthly_min?.toLocaleString()}–₦{l.monthly_max?.toLocaleString()}/mo</span>
                              )}
                            </div>
                            {l.frequency && <span className="text-[10px] text-muted-foreground/30 bg-white/05 px-2 py-0.5 rounded-full">{l.frequency}</span>}
                            {l.description && <p className="text-xs text-muted-foreground/60 mt-2">{l.description}</p>}
                            {l.calculation_note && <p className="text-[11px] text-muted-foreground/30 mt-1.5 border-t border-white/05 pt-1.5">{l.calculation_note}</p>}
                          </Card>
                        ))}
                        <div className="rounded-lg bg-[#CC7896]/10 border border-[#CC7896]/20 px-4 py-3 flex items-center justify-between">
                          <p className="text-sm font-semibold text-[#CC7896]">Total estimated monthly leakage</p>
                          <p className="text-lg font-bold text-[#CC7896]">₦{totalLeak.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Structural Gaps */}
                  {content?.structural_gaps && content.structural_gaps.length > 0 && (
                    <div>
                      <SectionTitle>Structural Gaps</SectionTitle>
                      <div className="space-y-2">
                        {content.structural_gaps.map((g, i) => (
                          <div key={i} className="rounded-lg border border-white/08 px-3 py-2.5 flex gap-3">
                            <div className="shrink-0 mt-0.5">
                              {g.severity === 'Critical' ? <AlertTriangle className="w-4 h-4 text-red-400" /> : g.severity === 'High' ? <AlertCircle className="w-4 h-4 text-orange-400" /> : <Info className="w-4 h-4 text-yellow-400" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-medium text-foreground/85">{g.gap}</p>
                                {g.severity && <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-semibold ${SEVERITY_STYLE[g.severity] ?? ''}`}>{g.severity}</span>}
                              </div>
                              {g.impact && <p className="text-xs text-muted-foreground/50">{g.impact}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Priority Actions */}
                  {content?.priority_actions && (
                    <div>
                      <SectionTitle>Priority Action Sequence</SectionTitle>
                      <div className="space-y-4">
                        <ActionTier label="Immediate — Week 1–2" color="text-red-400" items={content.priority_actions.immediate} />
                        <ActionTier label="Short Term — Month 1–2" color="text-orange-400" items={content.priority_actions.short_term} />
                        <ActionTier label="Medium Term — Month 3–6" color="text-yellow-400" items={content.priority_actions.medium_term} />
                      </div>
                    </div>
                  )}

                  {/* SOP List */}
                  {content?.sop_list && content.sop_list.length > 0 && (
                    <div>
                      <SectionTitle>SOPs to Create</SectionTitle>
                      <div className="space-y-1.5">
                        {content.sop_list.map((s, i) => (
                          <div key={i} className="rounded-lg border border-white/06 px-3 py-2 flex items-center justify-between">
                            <div>
                              <p className="text-sm text-foreground/80">{s.title}</p>
                              {s.responsible && <p className="text-[11px] text-muted-foreground/40">Responsible: {s.responsible}</p>}
                            </div>
                            {s.priority && <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${PRIORITY_STYLE[s.priority] ?? ''}`}>{s.priority}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Delegation Readiness */}
                  {content?.delegation_readiness && content.delegation_readiness.length > 0 && (
                    <div>
                      <SectionTitle>Delegation Readiness</SectionTitle>
                      <div className="space-y-2">
                        {content.delegation_readiness.map((d, i) => (
                          <Card key={i}>
                            <p className="text-sm font-semibold text-foreground/90 mb-2">{d.person} <span className="text-muted-foreground/40 font-normal">— {d.role}</span></p>
                            {d.tasks_to_absorb && <p className="text-xs text-muted-foreground/60 mb-1"><span className="text-muted-foreground/30 font-semibold">Can absorb: </span>{d.tasks_to_absorb}</p>}
                            {d.what_they_need_first && <p className="text-xs text-muted-foreground/60 mb-1"><span className="text-muted-foreground/30 font-semibold">Needs first: </span>{d.what_they_need_first}</p>}
                            {d.risk_note && <p className="text-xs text-[#CC7896] mt-1"><span className="font-semibold">Risk: </span>{d.risk_note}</p>}
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 90-Day Vision */}
                  {content?.vision_90_days && content.vision_90_days.length > 0 && (
                    <div>
                      <SectionTitle>90-Day Structured Vision</SectionTitle>
                      <Card className="space-y-2">
                        {content.vision_90_days.map((v, i) => (
                          <div key={i} className="flex gap-2">
                            <span className="text-[#4DBFB3] text-sm shrink-0">✓</span>
                            <p className="text-sm text-foreground/80">{v}</p>
                          </div>
                        ))}
                      </Card>
                    </div>
                  )}

                  {/* Closing Assessment */}
                  {content?.closing_assessment && (
                    <div>
                      <SectionTitle>Consultant's Assessment</SectionTitle>
                      <Card className="border-[#C9952B]/20">
                        <p className="text-sm text-foreground/80 leading-relaxed">{content.closing_assessment}</p>
                      </Card>
                    </div>
                  )}

                  {/* Eisenhower Matrix */}
                  {content?.eisenhower_matrix && (
                    <div>
                      <SectionTitle>Priority Matrix — How to Structure Your Time</SectionTitle>
                      <EisenhowerMatrix
                        matrix={content.eisenhower_matrix}
                        businessName={biz?.name ?? ''}
                        isSolo={(content.business_snapshot?.staff_count ?? 0) === 0}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Admin notes + release */}
          {r.status === 'pending' && (
            <div className="px-4 pb-4 border-t border-white/05 pt-4 space-y-2">
              <label className="text-[11px] text-muted-foreground/50 block">Your corrections or notes for the client (optional)</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                placeholder="Add corrections, context, or specific recommendations before releasing…"
                className="w-full px-3 py-2 rounded-lg text-sm bg-white/[0.05] border border-white/10 text-foreground placeholder-muted-foreground/30 focus:outline-none focus:border-[#C9952B]/50 resize-none" />
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
    setReleased(prev => prev.map(r => r.id === updated.id ? { ...r, generated_content: updated.generated_content } : r))
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-bold text-foreground">Reports</h1>
        <p className="text-xs text-muted-foreground/50 mt-0.5">Review answers, generate analysis, add corrections, then release</p>
      </div>
      {error && <div className="text-sm text-red-400 bg-red-500/5 border border-red-500/20 rounded-lg px-4 py-3">{error}</div>}
      <div className="flex gap-1 border-b border-white/08">
        {(['pending', 'released'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition -mb-px ${tab === t ? 'border-[#C9952B] text-[#C9952B]' : 'border-transparent text-muted-foreground/50 hover:text-foreground'}`}>
            {t === 'pending' ? 'Pending' : 'Released'}
            <span className="ml-2 text-[11px] px-1.5 py-0.5 rounded-full bg-white/05">{t === 'pending' ? pending.length : released.length}</span>
          </button>
        ))}
      </div>
      <div className="rounded-xl border border-white/08 bg-white/[0.03] overflow-hidden">
        {loading ? <div className="p-8 text-center text-sm text-muted-foreground/40">Loading…</div>
          : (tab === 'pending' ? pending : released).length === 0
            ? <div className="p-8 text-center text-sm text-muted-foreground/40">{tab === 'pending' ? 'No reports awaiting review' : 'No released reports yet'}</div>
            : (tab === 'pending' ? pending : released).map(r => <ReportRow key={r.id} r={r} onRelease={handleRelease} onUpdate={handleUpdate} />)
        }
      </div>
    </div>
  )
}

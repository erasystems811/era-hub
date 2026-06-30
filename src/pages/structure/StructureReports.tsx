import { useEffect, useState } from 'react'
import { structureApi, Report } from '../../lib/structure-api'
import { ChevronDown, ChevronUp, CheckCircle2, Sparkles, Loader2, AlertTriangle, AlertCircle, Info, Pencil, X, Save } from 'lucide-react'

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
  sop_list?: { title?: string; responsible?: string; priority?: string; current_state?: string }[]
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

// ── Edit helpers ──────────────────────────────────────────────────────────────

function EF({ val, onChange, rows = 2, placeholder = '' }: { val: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  return (
    <textarea value={val} onChange={e => onChange(e.target.value)} rows={rows} placeholder={placeholder}
      className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-2.5 py-1.5 text-sm text-foreground/90 resize-y focus:outline-none focus:border-[#C9952B]/50 placeholder-muted-foreground/20" />
  )
}

function EI({ val, onChange, placeholder = '', className = '' }: { val: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <input type="text" value={val} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className={`w-full bg-white/[0.05] border border-white/10 rounded px-2.5 py-1 text-sm text-foreground/90 focus:outline-none focus:border-[#C9952B]/50 ${className}`} />
  )
}

function EN({ val, onChange }: { val: number | undefined; onChange: (v: number) => void }) {
  return (
    <input type="number" value={val ?? ''} onChange={e => onChange(Number(e.target.value))}
      className="w-full bg-white/[0.05] border border-white/10 rounded px-2.5 py-1 text-sm text-foreground/90 focus:outline-none focus:border-[#C9952B]/50" />
  )
}

function ES({ val, onChange, options }: { val: string | undefined; onChange: (v: string) => void; options: string[] }) {
  return (
    <select value={val ?? ''} onChange={e => onChange(e.target.value)}
      className="bg-[#0A1628] border border-white/10 rounded px-2.5 py-1 text-sm text-foreground/90 focus:outline-none focus:border-[#C9952B]/50">
      <option value="">—</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

function AddBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button onClick={onClick}
      className="mt-2 w-full py-1.5 rounded-lg border border-dashed border-white/10 text-xs text-muted-foreground/40 hover:border-[#C9952B]/40 hover:text-[#C9952B]/60 transition">
      + {label}
    </button>
  )
}

function RemoveBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} title="Remove"
      className="ml-2 text-xs text-red-400/40 hover:text-red-400 transition shrink-0 px-1">
      ×
    </button>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] text-muted-foreground/30 mb-0.5 uppercase tracking-wide font-semibold">{children}</p>
}

// ── View components ───────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-bold uppercase tracking-widest text-[#C9952B] mb-3">{children}</p>
}

const QUADRANTS = [
  { key: 'q1_do' as const, label: 'DO NOW', sub: 'Urgent + Important', description: 'Handle these personally — today.', border: 'border-red-500/30', tag: 'bg-red-500/10 text-red-400', dot: 'bg-red-400', num: '1', numColor: 'text-red-400' },
  { key: 'q2_schedule' as const, label: 'SCHEDULE', sub: 'Important, Not Urgent', description: 'Block time for this. This is where growth lives.', border: 'border-[#4DBFB3]/30', tag: 'bg-[#4DBFB3]/10 text-[#4DBFB3]', dot: 'bg-[#4DBFB3]', num: '2', numColor: 'text-[#4DBFB3]' },
  { key: 'q3_delegate' as const, label: 'DELEGATE', sub: 'Urgent, Not Important', description: 'Someone else or a system should handle this.', border: 'border-[#C9952B]/30', tag: 'bg-[#C9952B]/10 text-[#C9952B]', dot: 'bg-[#C9952B]', num: '3', numColor: 'text-[#C9952B]' },
  { key: 'q4_eliminate' as const, label: 'ELIMINATE', sub: 'Not Urgent, Not Important', description: 'Stop doing this. It costs time and returns nothing.', border: 'border-white/10', tag: 'bg-white/05 text-muted-foreground/40', dot: 'bg-muted-foreground/30', num: '4', numColor: 'text-muted-foreground/30' },
]

function EisenhowerMatrix({ matrix, businessName, isSolo }: { matrix: ReportContent['eisenhower_matrix']; businessName: string; isSolo: boolean }) {
  if (!matrix) return null
  return (
    <div className="rounded-2xl border border-[#C9952B]/20 overflow-hidden bg-[#0A1628]">
      <div className="px-6 py-4 border-b border-white/06 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#C9952B]">Eisenhower Priority Matrix</p>
          <p className="text-[11px] text-muted-foreground/40 mt-0.5">{businessName} · ERA Structure Diagnostic</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground/30 uppercase tracking-wider">Urgency →</p>
        </div>
      </div>
      <div className="flex">
        <div className="w-6 flex items-center justify-center py-4">
          <p className="text-[9px] text-muted-foreground/30 uppercase tracking-widest" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Importance ↑</p>
        </div>
        <div className="flex-1 grid grid-cols-2 gap-px bg-white/05 p-px">
          {QUADRANTS.map(q => {
            const tasks = matrix[q.key] ?? []
            return (
              <div key={q.key} className={`bg-[#0A1628] p-4 min-h-[220px] border ${q.border}`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-2xl font-black opacity-20 ${q.numColor}`}>{q.num}</span>
                  <div>
                    <p className={`text-[11px] font-black tracking-widest ${q.numColor}`}>{q.label}</p>
                    <p className="text-[10px] text-muted-foreground/30">{q.sub}</p>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground/30 mb-3 border-b border-white/04 pb-2 italic">{q.description}</p>
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
      {isSolo && (
        <div className="px-6 py-3 border-t border-white/06 bg-[#C9952B]/05">
          <p className="text-[10px] text-[#C9952B]/70">
            <span className="font-bold">Solo operator note:</span> Quadrant 3 shows tasks to automate or outsource as the business grows — not tasks to hand off today.
          </p>
        </div>
      )}
      <div className="px-6 py-3 border-t border-white/06 flex gap-4">
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-white/40" /><p className="text-[10px] text-muted-foreground/40">From your assessment</p></div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-white/15" /><p className="text-[10px] text-muted-foreground/30">Suggested (hover for why)</p></div>
      </div>
    </div>
  )
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-lg border border-white/08 p-3.5 ${className}`}>{children}</div>
}

type ActionItem = { action?: string; owner?: string; success_looks_like?: string; time_estimate?: string }
function ActionTier({ label, color, items }: { label: string; color: string; items: ActionItem[] | undefined }) {
  if (!Array.isArray(items) || !items.length) return null
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

// ── ReportRow ─────────────────────────────────────────────────────────────────

function ReportRow({ r, onRelease, onUpdate }: { r: Report; onRelease: (id: string, notes: string) => Promise<void>; onUpdate: (r: Report) => void }) {
  const [expanded, setExpanded] = useState(false)
  const [notes, setNotes] = useState(r.admin_notes ?? '')
  const [releasing, setReleasing] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState('')
  const [responses, setResponses] = useState<Responses | null>(null)
  const [loadingResponses, setLoadingResponses] = useState(false)
  const [activeTab, setActiveTab] = useState<'answers' | 'analysis'>('answers')

  // Edit mode
  const [editMode, setEditMode] = useState(false)
  const [draft, setDraft] = useState<ReportContent>({})
  const [saving, setSaving] = useState(false)

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

  const enterEdit = () => {
    setDraft(JSON.parse(JSON.stringify(content ?? {})))
    setEditMode(true)
  }

  const cancelEdit = () => setEditMode(false)

  const handleSave = async () => {
    setSaving(true); setGenError('')
    try {
      await structureApi.updateReportContent(r.business_id, draft)
      onUpdate({ ...r, generated_content: draft })
      setEditMode(false)
    } catch (e) { setGenError(e instanceof Error ? e.message : 'Save failed') }
    finally { setSaving(false) }
  }

  // Draft update helpers
  const setTop = <K extends keyof ReportContent>(key: K, val: ReportContent[K]) =>
    setDraft(p => ({ ...p, [key]: val }))

  const setNested = <K extends keyof ReportContent>(key: K, field: string, val: unknown) =>
    setDraft(p => ({ ...p, [key]: { ...(p[key] as object ?? {}), [field]: val } }))

  const setItem = <K extends keyof ReportContent>(key: K, i: number, field: string, val: unknown) =>
    setDraft(p => ({ ...p, [key]: ((p[key] as Record<string, unknown>[]) ?? []).map((item, idx) => idx === i ? { ...item, [field]: val } : item) }))

  const setActionItem = (tier: 'immediate' | 'short_term' | 'medium_term', i: number, field: string, val: string) =>
    setDraft(p => ({
      ...p,
      priority_actions: {
        ...p.priority_actions,
        [tier]: (p.priority_actions?.[tier] ?? []).map((item, idx) => idx === i ? { ...item, [field]: val } : item)
      }
    }))

  const addItem = <K extends keyof ReportContent>(key: K, template: unknown) =>
    setDraft(p => ({ ...p, [key]: [...((p[key] as unknown[]) ?? []), template] }))

  const addActionItem = (tier: 'immediate' | 'short_term' | 'medium_term') =>
    setDraft(p => ({
      ...p,
      priority_actions: {
        ...p.priority_actions,
        [tier]: [...(p.priority_actions?.[tier] ?? []), { action: '', owner: '', success_looks_like: '', time_estimate: '' }]
      }
    }))

  const removeItem = <K extends keyof ReportContent>(key: K, i: number) =>
    setDraft(p => ({ ...p, [key]: ((p[key] as unknown[]) ?? []).filter((_, idx) => idx !== i) }))

  const removeActionItem = (tier: 'immediate' | 'short_term' | 'medium_term', i: number) =>
    setDraft(p => ({
      ...p,
      priority_actions: {
        ...p.priority_actions,
        [tier]: (p.priority_actions?.[tier] ?? []).filter((_, idx) => idx !== i)
      }
    }))

  const layer1Qs = responses?.questions.filter(q => q.layer === 1) ?? []
  const blocks = [...new Set(layer1Qs.map(q => q.block))].sort()
  const leakArray = Array.isArray(content?.revenue_leakage) ? content!.revenue_leakage! : []
  const totalLeak = leakArray.reduce((sum, l) => sum + (l.monthly_max ?? 0), 0)

  // The active content to display (draft in edit mode, content in view mode)
  const c = editMode ? draft : (content ?? {})

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
                    <p className="text-xs text-white/40">Click the button below to run the diagnostic report for this business.</p>
                  </div>
                  {genError && <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{genError}</p>}
                  <button onClick={handleGenerate} disabled={generating}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold bg-[#C9952B] text-[#0B1220] hover:bg-[#C9952B]/90 disabled:opacity-50 transition">
                    {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {generating ? 'Generating — this takes 30–60 seconds…' : 'Generate Analysis'}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">

                  {/* Header bar — Edit / Save / Cancel / Regenerate */}
                  <div className="flex items-center justify-between">
                    {editMode ? (
                      <>
                        <p className="text-xs text-[#C9952B] font-semibold">Editing report — changes are not saved yet</p>
                        <div className="flex items-center gap-2">
                          <button onClick={cancelEdit} disabled={saving}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-white/05 text-muted-foreground/50 hover:text-foreground disabled:opacity-40 transition">
                            <X className="w-3 h-3" /> Cancel
                          </button>
                          <button onClick={handleSave} disabled={saving}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#C9952B] text-[#0B1220] hover:bg-[#C9952B]/90 disabled:opacity-50 transition">
                            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                            {saving ? 'Saving…' : 'Save Changes'}
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-xs text-muted-foreground/40">Diagnostic report</p>
                        <div className="flex items-center gap-2">
                          <button onClick={enterEdit}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-white/05 text-muted-foreground/50 hover:text-foreground transition">
                            <Pencil className="w-3 h-3" /> Edit
                          </button>
                          <button onClick={handleGenerate} disabled={generating}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-white/05 text-muted-foreground/50 hover:text-foreground disabled:opacity-40 transition">
                            {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                            {generating ? 'Regenerating…' : 'Regenerate'}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                  {genError && <p className="text-xs text-red-400">{genError}</p>}

                  {/* ── Executive Summary ── */}
                  {c.executive_summary && (
                    <div>
                      <SectionTitle>Executive Summary</SectionTitle>
                      {editMode ? (
                        <Card className="space-y-3">
                          <div><FieldLabel>Situation</FieldLabel><EF val={draft.executive_summary?.situation ?? ''} onChange={v => setNested('executive_summary', 'situation', v)} rows={2} /></div>
                          <div><FieldLabel>Complication</FieldLabel><EF val={draft.executive_summary?.complication ?? ''} onChange={v => setNested('executive_summary', 'complication', v)} rows={3} /></div>
                          <div>
                            <FieldLabel>Resolution points</FieldLabel>
                            <div className="space-y-1.5">
                              {(draft.executive_summary?.resolution ?? []).map((res, i) => (
                                <div key={i} className="flex items-start gap-1">
                                  <span className="text-[#C9952B] font-bold text-xs mt-2 shrink-0">{i + 1}.</span>
                                  <EF val={res} onChange={v => setTop('executive_summary', { ...draft.executive_summary, resolution: (draft.executive_summary?.resolution ?? []).map((r, idx) => idx === i ? v : r) })} rows={1} />
                                  <RemoveBtn onClick={() => setTop('executive_summary', { ...draft.executive_summary, resolution: (draft.executive_summary?.resolution ?? []).filter((_, idx) => idx !== i) })} />
                                </div>
                              ))}
                            </div>
                            <AddBtn onClick={() => setTop('executive_summary', { ...draft.executive_summary, resolution: [...(draft.executive_summary?.resolution ?? []), ''] })} label="Add point" />
                          </div>
                        </Card>
                      ) : (
                        <Card className="space-y-3">
                          {c.executive_summary.situation && <p className="text-sm text-muted-foreground/70 leading-relaxed">{c.executive_summary.situation}</p>}
                          {c.executive_summary.complication && (
                            <div className="border-l-2 border-[#CC7896] pl-3">
                              <p className="text-sm text-foreground/80 leading-relaxed font-medium">{c.executive_summary.complication}</p>
                            </div>
                          )}
                          {c.executive_summary.resolution && c.executive_summary.resolution.length > 0 && (
                            <div className="space-y-1.5 pt-1">
                              {c.executive_summary.resolution.map((res, i) => (
                                <div key={i} className="flex gap-2">
                                  <span className="text-[#C9952B] font-bold text-xs mt-0.5 shrink-0">{i + 1}.</span>
                                  <p className="text-sm text-foreground/80">{res}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </Card>
                      )}
                    </div>
                  )}

                  {/* ── Business Snapshot ── */}
                  {c.business_snapshot && (
                    <div>
                      <SectionTitle>Business Snapshot</SectionTitle>
                      {editMode ? (
                        <Card className="space-y-3">
                          <div><FieldLabel>One-line diagnosis</FieldLabel><EF val={draft.business_snapshot?.one_line_diagnosis ?? ''} onChange={v => setNested('business_snapshot', 'one_line_diagnosis', v)} rows={2} /></div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <FieldLabel>Stage</FieldLabel>
                              <ES val={draft.business_snapshot?.current_stage} onChange={v => setNested('business_snapshot', 'current_stage', v)} options={['Survival', 'Stabilisation', 'Growth']} />
                            </div>
                            <div>
                              <FieldLabel>Staff count</FieldLabel>
                              <EN val={draft.business_snapshot?.staff_count} onChange={v => setNested('business_snapshot', 'staff_count', v)} />
                            </div>
                          </div>
                          <div><FieldLabel>Owner stated problem</FieldLabel><EF val={draft.business_snapshot?.owner_stated_problem ?? ''} onChange={v => setNested('business_snapshot', 'owner_stated_problem', v)} rows={2} /></div>
                        </Card>
                      ) : (
                        <Card>
                          {c.business_snapshot.one_line_diagnosis && (
                            <div className="bg-[#C9952B]/10 border border-[#C9952B]/20 rounded-lg px-3 py-2 mb-3">
                              <p className="text-sm font-semibold text-[#C9952B]">{c.business_snapshot.one_line_diagnosis}</p>
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {c.business_snapshot.current_stage && <div><span className="text-muted-foreground/40 text-xs">Stage</span><p className="text-foreground/80">{c.business_snapshot.current_stage}</p></div>}
                            {c.business_snapshot.staff_count !== undefined && <div><span className="text-muted-foreground/40 text-xs">Staff</span><p className="text-foreground/80">{c.business_snapshot.staff_count}</p></div>}
                          </div>
                          {c.business_snapshot.owner_stated_problem && (
                            <div className="mt-3 pt-3 border-t border-white/06">
                              <p className="text-[11px] text-muted-foreground/40 mb-1">Owner stated problem</p>
                              <p className="text-sm text-foreground/70 italic">"{c.business_snapshot.owner_stated_problem}"</p>
                            </div>
                          )}
                        </Card>
                      )}
                    </div>
                  )}

                  {/* ── Key Findings ── */}
                  {(Array.isArray(c.key_findings) && c.key_findings.length > 0 || editMode) && (
                    <div>
                      <SectionTitle>Key Findings</SectionTitle>
                      {editMode ? (
                        <div className="space-y-3">
                          {(draft.key_findings ?? []).map((f, i) => (
                            <Card key={i} className="space-y-2.5">
                              <div className="flex items-center justify-between">
                                <ES val={f.category} onChange={v => setItem('key_findings', i, 'category', v)}
                                  options={['owner_dependency','process_gap','financial_visibility','staff_clarity','customer_experience','revenue_leakage','decision_bottleneck','growth_ceiling']} />
                                <RemoveBtn onClick={() => removeItem('key_findings', i)} />
                              </div>
                              <div><FieldLabel>Headline (what the owner didn't know)</FieldLabel><EF val={f.headline ?? ''} onChange={v => setItem('key_findings', i, 'headline', v)} rows={2} /></div>
                              <div><FieldLabel>Evidence (quote from their data)</FieldLabel><EF val={f.evidence ?? ''} onChange={v => setItem('key_findings', i, 'evidence', v)} rows={2} /></div>
                              <div><FieldLabel>Root cause (structural reason)</FieldLabel><EF val={f.root_cause ?? ''} onChange={v => setItem('key_findings', i, 'root_cause', v)} rows={2} /></div>
                              <div><FieldLabel>Impact (naira / time / risk)</FieldLabel><EF val={f.impact ?? ''} onChange={v => setItem('key_findings', i, 'impact', v)} rows={2} /></div>
                            </Card>
                          ))}
                          <AddBtn onClick={() => addItem('key_findings', { headline: '', evidence: '', root_cause: '', impact: '', category: 'process_gap' })} label="Add finding" />
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {(c.key_findings ?? []).map((f, i) => (
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
                      )}
                    </div>
                  )}

                  {/* ── Contradiction Analysis ── */}
                  {(Array.isArray(c.contradiction_analysis) && c.contradiction_analysis.length > 0 || editMode) && (
                    <div>
                      <SectionTitle>Reality vs Perception</SectionTitle>
                      {editMode ? (
                        <div className="space-y-2">
                          {(draft.contradiction_analysis ?? []).map((con, i) => (
                            <div key={i} className="rounded-lg border border-white/08 overflow-hidden">
                              <div className="px-3 py-2 bg-white/[0.02] space-y-1.5">
                                <div className="flex items-center justify-between"><FieldLabel>Owner stated</FieldLabel><RemoveBtn onClick={() => removeItem('contradiction_analysis', i)} /></div>
                                <EF val={con.owner_stated ?? ''} onChange={v => setItem('contradiction_analysis', i, 'owner_stated', v)} rows={2} />
                              </div>
                              <div className="px-3 py-2 bg-[#CC7896]/5 border-t border-white/05 space-y-1.5">
                                <FieldLabel>Reality</FieldLabel>
                                <EF val={con.reality ?? ''} onChange={v => setItem('contradiction_analysis', i, 'reality', v)} rows={2} />
                              </div>
                            </div>
                          ))}
                          <AddBtn onClick={() => addItem('contradiction_analysis', { owner_stated: '', reality: '' })} label="Add contradiction" />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {(c.contradiction_analysis ?? []).map((con, i) => (
                            <div key={i} className="rounded-lg border border-white/08 overflow-hidden">
                              <div className="px-3 py-2 bg-white/[0.02]">
                                <p className="text-[10px] text-muted-foreground/30 font-semibold uppercase mb-1">Owner stated</p>
                                <p className="text-sm text-foreground/60 italic">"{con.owner_stated}"</p>
                              </div>
                              <div className="px-3 py-2 bg-[#CC7896]/5 border-t border-white/05">
                                <p className="text-[10px] text-[#CC7896] font-semibold uppercase mb-1">Reality</p>
                                <p className="text-sm text-foreground/80">{con.reality}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Revenue Leakage ── */}
                  {(() => {
                    const arr = Array.isArray(c.revenue_leakage) ? c.revenue_leakage : []
                    const draftArr = Array.isArray(draft.revenue_leakage) ? draft.revenue_leakage : []
                    const draftTotal = draftArr.reduce((s, l) => s + (l.monthly_max ?? 0), 0)
                    if (!arr.length && !editMode) return null
                    return (
                      <div>
                        <SectionTitle>Revenue Leakage</SectionTitle>
                        {editMode ? (
                          <div className="space-y-2">
                            {draftArr.map((l, i) => (
                              <Card key={i} className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <FieldLabel>Leak title</FieldLabel><RemoveBtn onClick={() => removeItem('revenue_leakage', i)} />
                                </div>
                                <EI val={l.title ?? ''} onChange={v => setItem('revenue_leakage', i, 'title', v)} placeholder="Title" />
                                <div className="grid grid-cols-3 gap-2">
                                  <div><FieldLabel>Frequency</FieldLabel><EI val={l.frequency ?? ''} onChange={v => setItem('revenue_leakage', i, 'frequency', v)} placeholder="Daily" /></div>
                                  <div><FieldLabel>Min ₦/mo</FieldLabel><EN val={l.monthly_min} onChange={v => setItem('revenue_leakage', i, 'monthly_min', v)} /></div>
                                  <div><FieldLabel>Max ₦/mo</FieldLabel><EN val={l.monthly_max} onChange={v => setItem('revenue_leakage', i, 'monthly_max', v)} /></div>
                                </div>
                                <div><FieldLabel>Description</FieldLabel><EF val={l.description ?? ''} onChange={v => setItem('revenue_leakage', i, 'description', v)} rows={2} /></div>
                                <div><FieldLabel>Calculation note</FieldLabel><EF val={l.calculation_note ?? ''} onChange={v => setItem('revenue_leakage', i, 'calculation_note', v)} rows={2} /></div>
                              </Card>
                            ))}
                            <AddBtn onClick={() => addItem('revenue_leakage', { title: '', description: '', frequency: '', monthly_min: 0, monthly_max: 0, calculation_note: '' })} label="Add leak" />
                            {draftTotal > 0 && (
                              <div className="rounded-lg bg-[#CC7896]/10 border border-[#CC7896]/20 px-4 py-3 flex items-center justify-between">
                                <p className="text-sm font-semibold text-[#CC7896]">Total estimated monthly leakage</p>
                                <p className="text-lg font-bold text-[#CC7896]">₦{draftTotal.toLocaleString()}</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {arr.map((l, i) => (
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
                            {totalLeak > 0 && (
                              <div className="rounded-lg bg-[#CC7896]/10 border border-[#CC7896]/20 px-4 py-3 flex items-center justify-between">
                                <p className="text-sm font-semibold text-[#CC7896]">Total estimated monthly leakage</p>
                                <p className="text-lg font-bold text-[#CC7896]">₦{totalLeak.toLocaleString()}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })()}

                  {/* ── Structural Gaps ── */}
                  {(Array.isArray(c.structural_gaps) && c.structural_gaps.length > 0 || editMode) && (
                    <div>
                      <SectionTitle>Structural Gaps</SectionTitle>
                      {editMode ? (
                        <div className="space-y-2">
                          {(draft.structural_gaps ?? []).map((g, i) => (
                            <Card key={i} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <ES val={g.severity} onChange={v => setItem('structural_gaps', i, 'severity', v)} options={['Critical', 'High', 'Medium']} />
                                <RemoveBtn onClick={() => removeItem('structural_gaps', i)} />
                              </div>
                              <div><FieldLabel>Gap</FieldLabel><EF val={g.gap ?? ''} onChange={v => setItem('structural_gaps', i, 'gap', v)} rows={2} /></div>
                              <div><FieldLabel>Impact</FieldLabel><EF val={g.impact ?? ''} onChange={v => setItem('structural_gaps', i, 'impact', v)} rows={2} /></div>
                            </Card>
                          ))}
                          <AddBtn onClick={() => addItem('structural_gaps', { gap: '', severity: 'High', impact: '' })} label="Add gap" />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {(c.structural_gaps ?? []).map((g, i) => (
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
                      )}
                    </div>
                  )}

                  {/* ── Priority Actions ── */}
                  {c.priority_actions && (
                    <div>
                      <SectionTitle>Priority Action Sequence</SectionTitle>
                      {editMode ? (
                        <div className="space-y-5">
                          {(['immediate', 'short_term', 'medium_term'] as const).map((tier, ti) => {
                            const labels = ['Immediate — Week 1–2', 'Short Term — Month 1–2', 'Medium Term — Month 3–6']
                            const colors = ['text-red-400', 'text-orange-400', 'text-yellow-400']
                            const items = draft.priority_actions?.[tier] ?? []
                            return (
                              <div key={tier}>
                                <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${colors[ti]}`}>{labels[ti]}</p>
                                <div className="space-y-2">
                                  {items.map((a, i) => (
                                    <Card key={i} className="space-y-2">
                                      <div className="flex items-center justify-between"><FieldLabel>Action</FieldLabel><RemoveBtn onClick={() => removeActionItem(tier, i)} /></div>
                                      <EF val={a.action ?? ''} onChange={v => setActionItem(tier, i, 'action', v)} rows={2} placeholder="Verb-led instruction — what exactly to do" />
                                      <div className="grid grid-cols-2 gap-2">
                                        <div><FieldLabel>Owner</FieldLabel><EI val={a.owner ?? ''} onChange={v => setActionItem(tier, i, 'owner', v)} placeholder="Name or role" /></div>
                                        <div><FieldLabel>Time estimate</FieldLabel><EI val={a.time_estimate ?? ''} onChange={v => setActionItem(tier, i, 'time_estimate', v)} placeholder="e.g. 2 hours" /></div>
                                      </div>
                                      <div><FieldLabel>Done when</FieldLabel><EI val={a.success_looks_like ?? ''} onChange={v => setActionItem(tier, i, 'success_looks_like', v)} placeholder="How you know this is complete" /></div>
                                    </Card>
                                  ))}
                                </div>
                                <AddBtn onClick={() => addActionItem(tier)} label="Add action" />
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <ActionTier label="Immediate — Week 1–2" color="text-red-400" items={c.priority_actions.immediate} />
                          <ActionTier label="Short Term — Month 1–2" color="text-orange-400" items={c.priority_actions.short_term} />
                          <ActionTier label="Medium Term — Month 3–6" color="text-yellow-400" items={c.priority_actions.medium_term} />
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── SOP List ── */}
                  {(Array.isArray(c.sop_list) && c.sop_list.length > 0 || editMode) && (
                    <div>
                      <SectionTitle>SOPs to Document</SectionTitle>
                      {editMode ? (
                        <div className="space-y-1.5">
                          {(draft.sop_list ?? []).map((s, i) => (
                            <div key={i} className="rounded-lg border border-white/06 px-3 py-2.5 space-y-2">
                              <div className="flex items-center justify-between"><FieldLabel>Process name</FieldLabel><RemoveBtn onClick={() => removeItem('sop_list', i)} /></div>
                              <EI val={s.title ?? ''} onChange={v => setItem('sop_list', i, 'title', v)} placeholder="e.g. How to handle a customer complaint" />
                              <div className="grid grid-cols-3 gap-2">
                                <div><FieldLabel>Responsible</FieldLabel><EI val={s.responsible ?? ''} onChange={v => setItem('sop_list', i, 'responsible', v)} placeholder="Name or role" /></div>
                                <div><FieldLabel>Priority</FieldLabel><ES val={s.priority} onChange={v => setItem('sop_list', i, 'priority', v)} options={['Urgent', 'Important', 'Standard']} /></div>
                                <div><FieldLabel>Current state</FieldLabel><ES val={s.current_state} onChange={v => setItem('sop_list', i, 'current_state', v)} options={['Exists and documented', 'Exists but undocumented', 'Inconsistent', 'Missing entirely']} /></div>
                              </div>
                            </div>
                          ))}
                          <AddBtn onClick={() => addItem('sop_list', { title: '', responsible: '', priority: 'Important', current_state: 'Missing entirely' })} label="Add SOP" />
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {(c.sop_list ?? []).map((s, i) => (
                            <div key={i} className="rounded-lg border border-white/06 px-3 py-2 flex items-center justify-between">
                              <div>
                                <p className="text-sm text-foreground/80">{s.title}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  {s.responsible && <p className="text-[11px] text-muted-foreground/40">Responsible: {s.responsible}</p>}
                                  {s.current_state && <span className="text-[10px] text-muted-foreground/30 bg-white/04 px-1.5 py-0.5 rounded">{s.current_state}</span>}
                                </div>
                              </div>
                              {s.priority && <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${PRIORITY_STYLE[s.priority] ?? ''}`}>{s.priority}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Delegation Readiness ── */}
                  {(Array.isArray(c.delegation_readiness) && c.delegation_readiness.length > 0 || editMode) && (
                    <div>
                      <SectionTitle>Delegation Readiness</SectionTitle>
                      {editMode ? (
                        <div className="space-y-2">
                          {(draft.delegation_readiness ?? []).map((d, i) => (
                            <Card key={i} className="space-y-2">
                              <div className="flex items-center justify-between"><FieldLabel>Person</FieldLabel><RemoveBtn onClick={() => removeItem('delegation_readiness', i)} /></div>
                              <div className="grid grid-cols-2 gap-2">
                                <EI val={d.person ?? ''} onChange={v => setItem('delegation_readiness', i, 'person', v)} placeholder="Name" />
                                <EI val={d.role ?? ''} onChange={v => setItem('delegation_readiness', i, 'role', v)} placeholder="Role" />
                              </div>
                              <div><FieldLabel>Tasks to absorb</FieldLabel><EF val={d.tasks_to_absorb ?? ''} onChange={v => setItem('delegation_readiness', i, 'tasks_to_absorb', v)} rows={2} /></div>
                              <div><FieldLabel>Needs first</FieldLabel><EI val={d.what_they_need_first ?? ''} onChange={v => setItem('delegation_readiness', i, 'what_they_need_first', v)} /></div>
                              <div><FieldLabel>Risk note</FieldLabel><EF val={d.risk_note ?? ''} onChange={v => setItem('delegation_readiness', i, 'risk_note', v)} rows={2} /></div>
                            </Card>
                          ))}
                          <AddBtn onClick={() => addItem('delegation_readiness', { person: '', role: '', tasks_to_absorb: '', what_they_need_first: '', risk_note: '' })} label="Add person" />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {(c.delegation_readiness ?? []).map((d, i) => (
                            <Card key={i}>
                              <p className="text-sm font-semibold text-foreground/90 mb-2">{d.person} <span className="text-muted-foreground/40 font-normal">— {d.role}</span></p>
                              {d.tasks_to_absorb && <p className="text-xs text-muted-foreground/60 mb-1"><span className="text-muted-foreground/30 font-semibold">Can absorb: </span>{d.tasks_to_absorb}</p>}
                              {d.what_they_need_first && <p className="text-xs text-muted-foreground/60 mb-1"><span className="text-muted-foreground/30 font-semibold">Needs first: </span>{d.what_they_need_first}</p>}
                              {d.risk_note && <p className="text-xs text-[#CC7896] mt-1"><span className="font-semibold">Risk: </span>{d.risk_note}</p>}
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── 90-Day Vision ── */}
                  {(Array.isArray(c.vision_90_days) && c.vision_90_days.length > 0 || editMode) && (
                    <div>
                      <SectionTitle>90-Day Structured Vision</SectionTitle>
                      {editMode ? (
                        <Card className="space-y-2">
                          {(draft.vision_90_days ?? []).map((v, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <span className="text-[#4DBFB3] text-sm shrink-0 mt-2">✓</span>
                              <EF val={v} onChange={nv => setTop('vision_90_days', (draft.vision_90_days ?? []).map((x, idx) => idx === i ? nv : x))} rows={1} />
                              <RemoveBtn onClick={() => setTop('vision_90_days', (draft.vision_90_days ?? []).filter((_, idx) => idx !== i))} />
                            </div>
                          ))}
                          <AddBtn onClick={() => setTop('vision_90_days', [...(draft.vision_90_days ?? []), ''])} label="Add outcome" />
                        </Card>
                      ) : (
                        <Card className="space-y-2">
                          {(c.vision_90_days ?? []).map((v, i) => (
                            <div key={i} className="flex gap-2">
                              <span className="text-[#4DBFB3] text-sm shrink-0">✓</span>
                              <p className="text-sm text-foreground/80">{v}</p>
                            </div>
                          ))}
                        </Card>
                      )}
                    </div>
                  )}

                  {/* ── Closing Assessment ── */}
                  {(c.closing_assessment || editMode) && (
                    <div>
                      <SectionTitle>Consultant's Assessment</SectionTitle>
                      {editMode ? (
                        <Card className="border-[#C9952B]/20">
                          <EF val={draft.closing_assessment ?? ''} onChange={v => setTop('closing_assessment', v)} rows={6} />
                        </Card>
                      ) : (
                        <Card className="border-[#C9952B]/20">
                          <p className="text-sm text-foreground/80 leading-relaxed">{c.closing_assessment}</p>
                        </Card>
                      )}
                    </div>
                  )}

                  {/* ── Eisenhower Matrix (view only) ── */}
                  {c.eisenhower_matrix && (
                    <div>
                      <SectionTitle>Priority Matrix — How to Structure Your Time</SectionTitle>
                      <EisenhowerMatrix
                        matrix={c.eisenhower_matrix}
                        businessName={biz?.name ?? ''}
                        isSolo={(c.business_snapshot?.staff_count ?? 0) === 0}
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

// ── StructureReports ──────────────────────────────────────────────────────────

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
        <p className="text-xs text-muted-foreground/50 mt-0.5">Review answers, generate analysis, edit if needed, then release</p>
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

import { useState, useEffect, useCallback } from 'react'
import {
  Plus, Zap, Play, Pause, Trash2, Users, ChevronDown, ChevronUp,
  Copy, Check, MessageSquare, Clock, X, Loader2, RefreshCw,
} from 'lucide-react'
import { bizApi, type AutomationFlow, type AutomationFlowDetail, type AutomationEnrollment, type AutomationStepInput } from './business-api'
import { COMMS_API } from '../../lib/config'

const TEAL   = '#4AA89D'
const PINK   = '#BF7C93'
const CARD   = 'hsl(262 20% 10%)'
const BORDER = 'rgba(255,255,255,0.07)'

// ── Delay helpers ─────────────────────────────────────────────────────────────

function minutesToHuman(m: number): string {
  if (m === 0) return 'immediately'
  if (m < 60) return `${m} min`
  if (m < 1440) return `${Math.round(m / 60)} hr`
  return `${Math.round(m / 1440)} day${Math.round(m / 1440) === 1 ? '' : 's'}`
}

// ── Step Builder ──────────────────────────────────────────────────────────────

function StepRow({
  step, index, total, onChange, onRemove,
}: {
  step: AutomationStepInput & { _key: number }
  index: number; total: number
  onChange: (s: AutomationStepInput & { _key: number }) => void
  onRemove: () => void
}) {
  const [delayUnit, setDelayUnit] = useState<'min' | 'hr' | 'day'>('min')
  const [delayVal, setDelayVal]   = useState(String(step.delayMinutes ?? 0))

  function commitDelay(val: string, unit: typeof delayUnit) {
    const n = parseInt(val, 10) || 0
    const mins = unit === 'min' ? n : unit === 'hr' ? n * 60 : n * 1440
    onChange({ ...step, delayMinutes: mins })
  }

  return (
    <div className="rounded-xl border p-4 space-y-3" style={{ background: 'hsl(262 20% 8%)', borderColor: BORDER }}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(237,233,245,0.35)' }}>
          Step {index + 1}
        </span>
        {total > 1 && (
          <button onClick={onRemove} className="p-1 rounded hover:bg-white/5">
            <X className="w-3.5 h-3.5 text-red-400" />
          </button>
        )}
      </div>

      {/* Wait delay (shown for every step > 0) */}
      {index > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
            Wait before this step
          </p>
          <div className="flex gap-2">
            <input
              type="number" min={0}
              value={delayVal}
              onChange={e => { setDelayVal(e.target.value); commitDelay(e.target.value, delayUnit) }}
              className="w-20 px-2.5 py-1.5 rounded-lg text-sm bg-white/5 border text-foreground"
              style={{ borderColor: BORDER }}
            />
            <select
              value={delayUnit}
              onChange={e => { const u = e.target.value as typeof delayUnit; setDelayUnit(u); commitDelay(delayVal, u) }}
              className="px-2.5 py-1.5 rounded-lg text-sm bg-white/5 border text-foreground"
              style={{ borderColor: BORDER }}
            >
              <option value="min">minutes</option>
              <option value="hr">hours</option>
              <option value="day">days</option>
            </select>
          </div>
        </div>
      )}

      {/* Step type */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Action</p>
        <div className="flex gap-2">
          {(['send_message', 'wait'] as const).map(t => (
            <button key={t} onClick={() => onChange({ ...step, stepType: t })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
              style={{
                background: step.stepType === t ? 'rgba(74,168,157,0.1)' : 'transparent',
                borderColor: step.stepType === t ? TEAL : BORDER,
                color: step.stepType === t ? TEAL : 'var(--muted-foreground)',
              }}>
              {t === 'send_message' ? <MessageSquare className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
              {t === 'send_message' ? 'Send message' : 'Wait only'}
            </button>
          ))}
        </div>
      </div>

      {step.stepType === 'send_message' && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Message</p>
          <textarea
            rows={3}
            value={step.content ?? ''}
            onChange={e => onChange({ ...step, content: e.target.value })}
            placeholder="Type the message to send…"
            className="w-full px-3 py-2 rounded-lg text-sm border text-foreground placeholder:text-muted-foreground/40 bg-white/5 resize-none"
            style={{ borderColor: BORDER }}
          />
        </div>
      )}
    </div>
  )
}

// ── Flow Form Modal ────────────────────────────────────────────────────────────

type Session = { id: string; phoneNumber: string; status: string }

function FlowModal({
  initial,
  sessions,
  onSave,
  onClose,
}: {
  initial?: AutomationFlowDetail | null
  sessions: Session[]
  onSave: () => void
  onClose: () => void
}) {
  const editing = !!initial
  const [name,        setName]        = useState(initial?.name ?? '')
  const [desc,        setDesc]        = useState(initial?.description ?? '')
  const [sessionId,   setSessionId]   = useState(initial?.sessionId ?? sessions[0]?.id ?? '')
  const [triggerType, setTriggerType] = useState<'api' | 'manual'>(initial?.triggerType ?? 'manual')
  const [steps, setSteps] = useState<(AutomationStepInput & { _key: number })[]>(() => {
    const src = initial?.steps?.length
      ? initial.steps.map((s, i) => ({ stepType: s.stepType, content: s.content ?? '', delayMinutes: s.delayMinutes, _key: i }))
      : [{ stepType: 'send_message' as const, content: '', delayMinutes: 0, _key: 0 }]
    return src
  })
  const [keyCounter, setKeyCounter] = useState(steps.length)
  const [saving, setSaving]         = useState(false)
  const [error,  setError]          = useState('')

  function addStep() {
    setSteps(s => [...s, { stepType: 'send_message', content: '', delayMinutes: 60, _key: keyCounter }])
    setKeyCounter(k => k + 1)
  }

  async function save() {
    if (!name.trim()) { setError('Name is required'); return }
    if (!sessionId)   { setError('Select a WhatsApp number'); return }
    const invalid = steps.find(s => s.stepType === 'send_message' && !s.content?.trim())
    if (invalid) { setError('All "Send message" steps need content'); return }

    setSaving(true); setError('')
    try {
      const payload = { name: name.trim(), description: desc.trim() || undefined, sessionId, triggerType, steps }
      if (editing) {
        await bizApi.updateAutomation(initial!.id, { name: name.trim(), description: desc.trim() || undefined })
        await bizApi.updateSteps(initial!.id, steps)
      } else {
        await bizApi.createAutomation(payload)
      }
      onSave()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-lg rounded-2xl border" style={{ background: CARD, borderColor: 'rgba(255,255,255,0.12)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: BORDER }}>
          <h2 className="font-bold text-foreground">{editing ? 'Edit automation' : 'New automation'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5"><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Appointment reminder"
              className="w-full px-3 py-2 rounded-lg text-sm border bg-white/5 text-foreground placeholder:text-muted-foreground/40"
              style={{ borderColor: BORDER }} />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Description (optional)</label>
            <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="What this automation does"
              className="w-full px-3 py-2 rounded-lg text-sm border bg-white/5 text-foreground placeholder:text-muted-foreground/40"
              style={{ borderColor: BORDER }} />
          </div>

          {!editing && (
            <>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Send from (WhatsApp number)</label>
                <select value={sessionId} onChange={e => setSessionId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm border bg-white/5 text-foreground"
                  style={{ borderColor: BORDER }}>
                  {sessions.map(s => <option key={s.id} value={s.id}>{s.phoneNumber}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">How contacts enter this automation</label>
                <div className="flex gap-2">
                  {(['manual', 'api'] as const).map(t => (
                    <button key={t} onClick={() => setTriggerType(t)}
                      className="flex-1 py-2 rounded-lg text-sm font-semibold border transition-all"
                      style={{
                        background: triggerType === t ? 'rgba(74,168,157,0.1)' : 'transparent',
                        borderColor: triggerType === t ? TEAL : BORDER,
                        color: triggerType === t ? TEAL : 'var(--muted-foreground)',
                      }}>
                      {t === 'manual' ? 'You enroll them manually' : 'Via API / developer trigger'}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Steps */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Steps</p>
            <div className="space-y-3">
              {steps.map((s, i) => (
                <StepRow
                  key={s._key} step={s} index={i} total={steps.length}
                  onChange={updated => setSteps(ss => ss.map((x, j) => j === i ? updated : x))}
                  onRemove={() => setSteps(ss => ss.filter((_, j) => j !== i))}
                />
              ))}
            </div>
            <button onClick={addStep}
              className="mt-3 w-full py-2 rounded-lg text-xs font-semibold border border-dashed transition-all hover:border-white/20 flex items-center justify-center gap-1.5"
              style={{ borderColor: BORDER, color: 'var(--muted-foreground)' }}>
              <Plus className="w-3.5 h-3.5" /> Add step
            </button>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all hover:bg-white/5"
              style={{ borderColor: BORDER, color: 'var(--muted-foreground)' }}>
              Cancel
            </button>
            <button onClick={() => void save()} disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
              style={{ background: TEAL }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (editing ? 'Save changes' : 'Create automation')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Enroll Modal ──────────────────────────────────────────────────────────────

function EnrollModal({ flowId, onDone, onClose }: { flowId: string; onDone: () => void; onClose: () => void }) {
  const [text,    setText]    = useState('')
  const [saving,  setSaving]  = useState(false)
  const [result,  setResult]  = useState<{ enrolled: number } | null>(null)
  const [error,   setError]   = useState('')

  async function enroll() {
    const lines = text.split(/[\n,]+/).map(l => l.trim()).filter(Boolean)
    const contacts = lines.map(l => {
      const [phoneNumber, ...rest] = l.split(/\s+/)
      return { phoneNumber: phoneNumber ?? l, name: rest.join(' ') || undefined }
    })
    if (!contacts.length) { setError('Enter at least one phone number'); return }
    setSaving(true); setError('')
    try {
      const res = await bizApi.enrollContacts(flowId, contacts)
      setResult(res)
      onDone()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Enroll failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-md rounded-2xl border" style={{ background: CARD, borderColor: 'rgba(255,255,255,0.12)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: BORDER }}>
          <h2 className="font-bold text-foreground">Enroll contacts</h2>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <div className="p-6 space-y-4">
          {result ? (
            <div className="text-center py-4">
              <p className="text-2xl font-bold" style={{ color: TEAL }}>{result.enrolled}</p>
              <p className="text-sm text-muted-foreground mt-1">contacts enrolled</p>
              <button onClick={onClose} className="mt-4 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: TEAL }}>Done</button>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">One number per line (E.164 format). Optionally add a name after the number.</p>
              <div className="text-[10px] text-muted-foreground/50 font-mono space-y-0.5">
                <div>+2348012345678 John Doe</div>
                <div>+2348087654321</div>
              </div>
              <textarea rows={8} value={text} onChange={e => setText(e.target.value)}
                placeholder="+2348012345678 Patient Name&#10;+2348087654321"
                className="w-full px-3 py-2.5 rounded-lg text-sm border bg-white/5 text-foreground placeholder:text-muted-foreground/30 resize-none font-mono"
                style={{ borderColor: BORDER }} />
              {error && <p className="text-xs text-red-400">{error}</p>}
              <div className="flex gap-2">
                <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border" style={{ borderColor: BORDER, color: 'var(--muted-foreground)' }}>Cancel</button>
                <button onClick={() => void enroll()} disabled={saving}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                  style={{ background: TEAL }}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Enroll'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Enrollments Panel ─────────────────────────────────────────────────────────

function EnrollmentsPanel({ flowId, stepCount }: { flowId: string; stepCount: number }) {
  const [enrollments, setEnrollments] = useState<AutomationEnrollment[] | null>(null)
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    bizApi.listEnrollments(flowId)
      .then(setEnrollments)
      .finally(() => setLoading(false))
  }, [flowId])

  async function cancel(id: string) {
    await bizApi.cancelEnrollment(flowId, id)
    setEnrollments(e => e?.map(x => x.id === id ? { ...x, status: 'cancelled' } : x) ?? null)
  }

  if (loading) return <div className="py-4 flex justify-center"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
  if (!enrollments?.length) return <p className="text-xs text-muted-foreground py-4 text-center">No contacts enrolled yet</p>

  const STATUS_COLOR = { active: TEAL, completed: '#22c55e', cancelled: 'rgba(237,233,245,0.3)' }

  return (
    <div className="mt-3 space-y-1.5 max-h-64 overflow-y-auto pr-1">
      {enrollments.map(e => (
        <div key={e.id} className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: 'hsl(262 20% 8%)' }}>
          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: STATUS_COLOR[e.status] ?? BORDER }} />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-foreground truncate">{e.name ?? e.phoneNumber}</div>
            {e.name && <div className="text-[10px] text-muted-foreground">{e.phoneNumber}</div>}
          </div>
          <div className="text-[10px] text-muted-foreground shrink-0">
            {e.status === 'active' ? `Step ${e.currentStep + 1}/${stepCount}` : e.status}
          </div>
          {e.status === 'active' && (
            <button onClick={() => void cancel(e.id)} title="Cancel enrollment" className="p-1 hover:bg-white/5 rounded">
              <X className="w-3 h-3 text-muted-foreground" />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Flow Card ─────────────────────────────────────────────────────────────────

function FlowCard({
  flow, sessions, onRefresh,
}: {
  flow: AutomationFlow; sessions: Session[]; onRefresh: () => void
}) {
  const [expanded,     setExpanded]     = useState(false)
  const [detail,       setDetail]       = useState<AutomationFlowDetail | null>(null)
  const [showEnroll,   setShowEnroll]   = useState(false)
  const [showEdit,     setShowEdit]     = useState(false)
  const [toggling,     setToggling]     = useState(false)
  const [deleting,     setDeleting]     = useState(false)
  const [copied,       setCopied]       = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)

  async function loadDetail() {
    if (detail) return
    setLoadingDetail(true)
    try { setDetail(await bizApi.getAutomation(flow.id)) } finally { setLoadingDetail(false) }
  }

  async function toggleStatus() {
    setToggling(true)
    try {
      await bizApi.updateAutomation(flow.id, { status: flow.status === 'active' ? 'paused' : 'active' })
      onRefresh()
    } finally { setToggling(false) }
  }

  async function archive() {
    if (!confirm(`Delete "${flow.name}"? This cannot be undone.`)) return
    setDeleting(true)
    try { await bizApi.deleteAutomation(flow.id); onRefresh() }
    finally { setDeleting(false) }
  }

  function copyTriggerUrl() {
    const url = `${COMMS_API}/v1/admin/automations/public/trigger/${flow.triggerKey}`
    void navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isActive  = flow.status === 'active'
  const isPaused  = flow.status === 'paused'

  return (
    <>
      <div className="rounded-xl border" style={{ background: CARD, borderColor: BORDER }}>
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: isActive ? 'rgba(74,168,157,0.12)' : 'rgba(255,255,255,0.05)' }}>
              <Zap className="w-4 h-4" style={{ color: isActive ? TEAL : 'var(--muted-foreground)' }} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-foreground">{flow.name}</p>
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                  style={{
                    background: isActive ? 'rgba(74,168,157,0.12)' : isPaused ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.06)',
                    color:      isActive ? TEAL                      : isPaused ? '#f59e0b'               : 'var(--muted-foreground)',
                  }}>
                  {flow.status}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(237,233,245,0.4)' }}>
                  {flow.triggerType === 'api' ? 'API trigger' : 'Manual'}
                </span>
              </div>
              {flow.description && <p className="text-xs text-muted-foreground mt-0.5">{flow.description}</p>}
              <p className="text-[10px] text-muted-foreground mt-1">
                {flow.sessionPhone} · {flow.totalEnrolled} enrolled · {flow.totalCompleted} completed
              </p>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {flow.triggerType === 'api' && flow.triggerKey && (
                <button onClick={copyTriggerUrl} title="Copy API trigger URL"
                  className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                  {copied ? <Check className="w-3.5 h-3.5" style={{ color: TEAL }} /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                </button>
              )}
              <button onClick={() => { setShowEnroll(true) }} disabled={!isActive} title="Enroll contacts"
                className="p-2 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-30">
                <Users className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              <button onClick={() => { void loadDetail(); setShowEdit(true) }} title="Edit"
                className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              <button onClick={() => void toggleStatus()} disabled={toggling} title={isActive ? 'Pause' : 'Activate'}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50">
                {toggling
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                  : isActive
                    ? <Pause className="w-3.5 h-3.5 text-muted-foreground" />
                    : <Play  className="w-3.5 h-3.5 text-muted-foreground" />
                }
              </button>
              <button onClick={() => void archive()} disabled={deleting} title="Delete"
                className="p-2 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50">
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" /> : <Trash2 className="w-3.5 h-3.5 text-red-400" />}
              </button>
              <button onClick={() => { if (!expanded) void loadDetail(); setExpanded(x => !x) }}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                {expanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
              </button>
            </div>
          </div>
        </div>

        {expanded && (
          <div className="px-4 pb-4 border-t pt-3" style={{ borderColor: BORDER }}>
            {loadingDetail
              ? <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
              : detail ? (
                <>
                  {/* Steps summary */}
                  {detail.steps.length > 0 && (
                    <div className="mb-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Steps</p>
                      <div className="flex flex-col gap-1.5">
                        {detail.steps.map((s, i) => (
                          <div key={s.id} className="flex items-start gap-2.5 text-xs">
                            <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold"
                              style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--muted-foreground)' }}>
                              {i + 1}
                            </div>
                            <div>
                              {i > 0 && s.delayMinutes > 0 && (
                                <span className="text-[10px] text-muted-foreground/60">Wait {minutesToHuman(s.delayMinutes)} → </span>
                              )}
                              {s.stepType === 'send_message'
                                ? <span className="text-foreground">{s.content ?? '(no message)'}</span>
                                : <span className="text-muted-foreground italic">Wait only</span>
                              }
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* API trigger key */}
                  {detail.triggerType === 'api' && detail.triggerKey && (
                    <div className="mb-4 rounded-lg px-3 py-2" style={{ background: 'rgba(74,168,157,0.06)', border: `1px solid rgba(74,168,157,0.15)` }}>
                      <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: TEAL }}>Developer API trigger</p>
                      <p className="text-[10px] font-mono break-all text-muted-foreground">
                        POST {COMMS_API}/v1/admin/automations/public/trigger/{detail.triggerKey}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">Body: {'{ "phoneNumber": "+2348012345678", "name": "Optional" }'}</p>
                    </div>
                  )}

                  {/* Enrollments */}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                      Enrollments ({detail.enrollmentStats.active} active · {detail.enrollmentStats.completed} completed)
                    </p>
                    <EnrollmentsPanel flowId={flow.id} stepCount={detail.steps.length} />
                  </div>
                </>
              ) : null
            }
          </div>
        )}
      </div>

      {showEnroll && (
        <EnrollModal
          flowId={flow.id}
          onDone={() => { onRefresh(); void loadDetail() }}
          onClose={() => setShowEnroll(false)}
        />
      )}

      {showEdit && detail && (
        <FlowModal
          initial={detail}
          sessions={sessions}
          onSave={() => { setShowEdit(false); setDetail(null); onRefresh() }}
          onClose={() => setShowEdit(false)}
        />
      )}
    </>
  )
}

// ── Main Module ───────────────────────────────────────────────────────────────

export function AutomationsModule() {
  const [flows,    setFlows]    = useState<AutomationFlow[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [showNew,  setShowNew]  = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const [f, s] = await Promise.all([
        bizApi.listAutomations(),
        bizApi.listWhatsAppSessions(),
      ])
      setFlows(f)
      setSessions(s.filter(x => x.status === 'connected' || x.status === 'warming_up'))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  return (
    <div className="max-w-2xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Automations</h2>
          <p className="text-sm text-muted-foreground mt-1">Proactive message sequences — reminders, follow-ups, confirmations</p>
        </div>
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: TEAL }}>
          <Plus className="w-4 h-4" /> New automation
        </button>
      </div>

      {loading && (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      )}

      {error && !loading && (
        <p className="text-sm text-red-400 text-center py-8">{error}</p>
      )}

      {!loading && !error && flows.length === 0 && (
        <div className="text-center py-16 rounded-xl border" style={{ borderColor: BORDER }}>
          <Zap className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-sm font-semibold text-foreground mb-1">No automations yet</p>
          <p className="text-xs text-muted-foreground mb-4">Create your first automation to send proactive messages to contacts</p>
          {sessions.length === 0
            ? <p className="text-xs text-yellow-400">Connect a WhatsApp number first before creating automations</p>
            : <button onClick={() => setShowNew(true)}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                style={{ background: TEAL }}>
                Create automation
              </button>
          }
        </div>
      )}

      {!loading && flows.length > 0 && (
        <div className="space-y-3">
          {flows.map(f => (
            <FlowCard key={f.id} flow={f} sessions={sessions} onRefresh={() => void load()} />
          ))}
        </div>
      )}

      {showNew && (
        <FlowModal
          sessions={sessions}
          onSave={() => { setShowNew(false); void load() }}
          onClose={() => setShowNew(false)}
        />
      )}
    </div>
  )
}

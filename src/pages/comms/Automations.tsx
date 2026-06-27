import { useEffect, useState } from 'react'
import {
  Loader2, Zap, Plus, Play, Pause, X,
  Users, CheckCircle2, Copy, Check, ChevronRight,
} from 'lucide-react'
import {
  automationApi, commsApi,
  type AutomationFlow, type AutomationFlowDetail, type Client,
} from '../../lib/comms-api'
import { useToast } from '../../components/Toast'
import { normalizePhoneList } from '../../components/PhoneInput'

const STATUS_COLOURS: Record<string, string> = {
  active: 'bg-teal/15 text-teal',
  paused: 'bg-yellow-500/15 text-yellow-400',
  archived: 'bg-white/10 text-white/40',
}

function FlowDetailPanel({ flow, onClose, onChanged }: {
  flow: AutomationFlow; onClose: () => void; onChanged: () => void
}) {
  const showToast = useToast()
  const [detail, setDetail]   = useState<AutomationFlowDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied]   = useState(false)
  const [phones, setPhones]   = useState('')
  const [enrolling, setEnrolling] = useState(false)

  useEffect(() => {
    automationApi.get(flow.id)
      .then(setDetail)
      .catch(() => showToast('Could not load flow detail', 'error'))
      .finally(() => setLoading(false))
  }, [flow.id])

  function copyKey(key: string) {
    void navigator.clipboard.writeText(key).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    })
  }

  async function enroll() {
    const contacts = normalizePhoneList(phones)
    if (!contacts.length) { showToast('Enter at least one phone number', 'error'); return }
    setEnrolling(true)
    try {
      const res = await automationApi.enroll(flow.id, contacts)
      showToast(`Enrolled ${res.enrolled} contacts`, 'success')
      setPhones('')
      onChanged()
    } catch (e) {
      showToast((e as Error).message, 'error')
    } finally {
      setEnrolling(false)
    }
  }

  async function toggle() {
    const newStatus = flow.status === 'active' ? 'paused' : 'active'
    try {
      await automationApi.update(flow.id, { status: newStatus })
      showToast(`Flow ${newStatus}`, 'success')
      onChanged()
      onClose()
    } catch (e) {
      showToast((e as Error).message, 'error')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-card shadow-card-lg p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground">{flow.name}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{flow.description ?? 'No description'}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground ml-2 shrink-0"><X className="w-4 h-4" /></button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Enrolled', value: flow.totalEnrolled },
            { label: 'Completed', value: flow.totalCompleted },
            { label: 'Active', value: (detail?.enrollmentStats.active ?? '…') },
          ].map(s => (
            <div key={s.label} className="rounded-xl bg-white/04 border border-white/06 p-3 text-center">
              <div className="text-xl font-bold text-foreground">{s.value}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Trigger key */}
        {flow.triggerKey && (
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
              API Trigger Key
            </label>
            <div className="flex gap-2">
              <div className="flex-1 px-3 py-2 rounded-xl bg-[hsl(262_20%_11%)] border border-white/06 text-xs font-mono text-foreground truncate">
                {flow.triggerKey}
              </div>
              <button
                onClick={() => copyKey(flow.triggerKey!)}
                className="px-3 py-2 rounded-xl border border-white/10 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-teal" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">POST /v1/public/automations/trigger/{flow.triggerKey}</p>
          </div>
        )}

        {/* Steps */}
        {loading ? (
          <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
        ) : (
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-2">Steps</label>
            <div className="space-y-2">
              {detail?.steps.map(s => (
                <div key={s.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/04 border border-white/06">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold bg-white/08 text-muted-foreground shrink-0">
                    {s.stepOrder + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-foreground capitalize">{s.stepType.replace('_', ' ')}</div>
                    {s.content && <div className="text-[11px] text-muted-foreground truncate">{s.content}</div>}
                  </div>
                  {s.delayMinutes > 0 && (
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      wait {s.delayMinutes >= 60 ? `${Math.round(s.delayMinutes / 60)}h` : `${s.delayMinutes}m`}
                    </span>
                  )}
                </div>
              ))}
              {!detail?.steps.length && (
                <p className="text-xs text-muted-foreground px-1">No steps defined</p>
              )}
            </div>
          </div>
        )}

        {/* Enroll */}
        {flow.status === 'active' && (
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
              Enroll Contacts — one per line
            </label>
            <textarea
              value={phones}
              onChange={e => setPhones(e.target.value)}
              rows={3}
              placeholder={"08012345678\n+2348087654321\n8099990000"}
              className="w-full px-3 py-2 rounded-xl bg-[hsl(262_20%_11%)] border border-white/06 text-xs font-mono text-foreground placeholder:text-muted-foreground/40 resize-none"
            />
            <p className="text-[10px] text-muted-foreground/50 mt-1">Local (08012345678) and international (+2348012345678) formats both accepted</p>
            <button
              onClick={() => void enroll()}
              disabled={enrolling}
              className="mt-2 w-full px-4 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-50"
              style={{ background: '#C4286F' }}
            >
              {enrolling ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : 'Enroll Contacts'}
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={() => void toggle()}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/10 text-sm font-semibold text-foreground hover:bg-white/04 transition-colors"
          >
            {flow.status === 'active'
              ? <><Pause className="w-3.5 h-3.5" /> Pause</>
              : <><Play className="w-3.5 h-3.5" /> Activate</>}
          </button>
        </div>
      </div>
    </div>
  )
}

function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const showToast = useToast()
  const [clients, setClients]           = useState<Client[]>([])
  const [clientId, setClientId]         = useState('')
  const [sessionId, setSessionId]       = useState('')
  const [sessions, setSessions]         = useState<{ id: string; phoneNumber: string }[]>([])
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [name, setName]                 = useState('')
  const [description, setDescription]  = useState('')
  const [triggerType, setTriggerType]  = useState<'manual' | 'api'>('manual')
  type Step = { stepType: 'send_message' | 'wait'; content: string; contentType: string; delayMinutes: number }
  const [steps, setSteps] = useState<Step[]>([
    { stepType: 'send_message', content: '', contentType: 'text', delayMinutes: 0 },
  ])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    commsApi.listClients().then(setClients).catch(() => {})
  }, [])

  useEffect(() => {
    if (!clientId) { setSessions([]); setSessionId(''); return }
    setLoadingSessions(true)
    commsApi.getClient(clientId)
      .then(detail => {
        setSessions(detail.sessions.map(s => ({ id: s.id, phoneNumber: s.phoneNumber })))
        setSessionId(detail.sessions[0]?.id ?? '')
      })
      .catch(() => {})
      .finally(() => setLoadingSessions(false))
  }, [clientId])

  function addStep() {
    setSteps(prev => [...prev, { stepType: 'send_message', content: '', contentType: 'text', delayMinutes: 1440 }])
  }

  function removeStep(i: number) {
    setSteps(prev => prev.filter((_, idx) => idx !== i))
  }

  async function submit() {
    if (!clientId || !sessionId || !name.trim()) {
      showToast('Business, Session ID, and Name are required', 'error'); return
    }
    setSaving(true)
    try {
      await automationApi.create({ clientId, sessionId, name: name.trim(), description: description.trim() || undefined, triggerType, steps })
      showToast('Automation created', 'success')
      onCreated(); onClose()
    } catch (e) {
      showToast((e as Error).message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-card shadow-card-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">New Automation</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Business *</label>
            <select value={clientId} onChange={e => setClientId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-[hsl(262_20%_11%)] border border-white/06 text-sm text-foreground">
              <option value="">Select business…</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">WhatsApp Number *</label>
            <select value={sessionId} onChange={e => setSessionId(e.target.value)}
              disabled={!clientId || loadingSessions}
              className="w-full px-3 py-2.5 rounded-xl bg-[hsl(262_20%_11%)] border border-white/06 text-sm text-foreground disabled:opacity-50">
              {!clientId && <option value="">Pick a business first…</option>}
              {clientId && loadingSessions && <option value="">Loading numbers…</option>}
              {clientId && !loadingSessions && sessions.length === 0 && <option value="">No numbers connected</option>}
              {sessions.map(s => <option key={s.id} value={s.id}>{s.phoneNumber}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Flow Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. New Customer Welcome"
              className="w-full px-3 py-2.5 rounded-xl bg-[hsl(262_20%_11%)] border border-white/06 text-sm text-foreground placeholder:text-muted-foreground/40" />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Description</label>
            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional"
              className="w-full px-3 py-2.5 rounded-xl bg-[hsl(262_20%_11%)] border border-white/06 text-sm text-foreground placeholder:text-muted-foreground/40" />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Trigger Type</label>
            <div className="flex gap-2">
              {(['manual', 'api'] as const).map(t => (
                <button key={t} onClick={() => setTriggerType(t)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-colors capitalize ${triggerType === t ? 'border-pink-500/50 text-white' : 'border-white/10 text-muted-foreground'}`}
                  style={triggerType === t ? { background: 'rgba(196,40,111,0.15)' } : {}}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Steps */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-2">Steps</label>
            <div className="space-y-2">
              {steps.map((s, i) => (
                <div key={i} className="rounded-xl bg-white/04 border border-white/06 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-muted-foreground">Step {i + 1}</span>
                    {steps.length > 1 && (
                      <button onClick={() => removeStep(i)} className="text-muted-foreground hover:text-red-400">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <select value={s.stepType} onChange={e => setSteps(prev => prev.map((p, idx) => idx === i ? { ...p, stepType: e.target.value as 'send_message' | 'wait' } : p))}
                    className="w-full px-2.5 py-2 rounded-lg bg-[hsl(262_20%_11%)] border border-white/06 text-xs text-foreground">
                    <option value="send_message">Send Message</option>
                    <option value="wait">Wait</option>
                  </select>
                  {s.stepType === 'send_message' && (
                    <textarea value={s.content} onChange={e => setSteps(prev => prev.map((p, idx) => idx === i ? { ...p, content: e.target.value } : p))}
                      rows={2} placeholder="Message text…"
                      className="w-full px-2.5 py-2 rounded-lg bg-[hsl(262_20%_11%)] border border-white/06 text-xs text-foreground placeholder:text-muted-foreground/40 resize-none" />
                  )}
                  {i < steps.length - 1 && (
                    <div className="flex items-center gap-2">
                      <label className="text-[10px] text-muted-foreground">Wait before next step (min)</label>
                      <input type="number" min={0} value={steps[i + 1]?.delayMinutes ?? 0}
                        onChange={e => setSteps(prev => prev.map((p, idx) => idx === i + 1 ? { ...p, delayMinutes: parseInt(e.target.value) || 0 } : p))}
                        className="w-20 px-2 py-1 rounded-lg bg-[hsl(262_20%_11%)] border border-white/06 text-xs text-foreground text-right" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button onClick={addStep} className="mt-2 w-full py-2 rounded-xl border border-dashed border-white/15 text-xs text-muted-foreground hover:text-foreground hover:border-white/25 transition-colors">
              + Add Step
            </button>
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-sm text-muted-foreground hover:text-foreground transition-colors">
            Cancel
          </button>
          <button onClick={() => void submit()} disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: '#C4286F' }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Create Automation'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function Automations() {
  const showToast = useToast()
  const [flows, setFlows]         = useState<AutomationFlow[]>([])
  const [loading, setLoading]     = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [selected, setSelected]   = useState<AutomationFlow | null>(null)

  async function load() {
    setLoading(true)
    try {
      setFlows(await automationApi.list())
    } catch (e) {
      showToast((e as Error).message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(196,40,111,0.15)' }}>
            <Zap className="w-4 h-4" style={{ color: '#C4286F' }} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Automations</h1>
            <p className="text-xs text-muted-foreground">Drip sequences and message flows</p>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          style={{ background: '#C4286F' }}>
          <Plus className="w-3.5 h-3.5" /> New Automation
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : flows.length === 0 ? (
        <div className="text-center py-20">
          <Zap className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No automation flows yet</p>
          <button onClick={() => setShowCreate(true)} className="mt-3 text-sm font-medium" style={{ color: '#C4286F' }}>
            Create your first flow →
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {flows.map(f => (
            <button key={f.id} onClick={() => setSelected(f)}
              className="w-full text-left rounded-2xl border border-white/06 bg-card p-4 flex items-center gap-4 hover:border-white/12 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-foreground">{f.name}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_COLOURS[f.status] ?? ''}`}>
                    {f.status}
                  </span>
                  {f.triggerType === 'api' && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400">API</span>
                  )}
                </div>
                {f.description && <p className="text-xs text-muted-foreground truncate">{f.description}</p>}
                <div className="flex items-center gap-4 mt-1.5">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="w-3 h-3" /> {f.totalEnrolled} enrolled
                  </span>
                  <span className="text-xs text-teal flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {f.totalCompleted} completed
                  </span>
                  <span className="text-xs text-muted-foreground">{f.clientName}</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
            </button>
          ))}
        </div>
      )}

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreated={() => void load()} />}
      {selected && (
        <FlowDetailPanel
          flow={selected}
          onClose={() => setSelected(null)}
          onChanged={() => { void load(); setSelected(null) }}
        />
      )}
    </div>
  )
}

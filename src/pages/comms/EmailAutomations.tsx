import { useState, useEffect } from 'react'
import {
  Zap, Plus, Loader2, Trash2, ChevronRight, ChevronDown,
  Mail, Clock, Copy, CheckCircle2, Users,
} from 'lucide-react'
import {
  emailAutomationApi, emailApi,
  type EmailAutomationFlow, type EmailAutomationStep,
  type EmailTemplate, type EmailDomain, type Client,
} from '../../lib/comms-api'
import { commsApi } from '../../lib/comms-api'
import { useToast } from '../../components/Toast'
import { EmailTabs } from './EmailOverview'

const FIELD = 'w-full px-3 py-2.5 rounded-xl bg-[hsl(262_20%_11%)] border border-white/06 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-pink-500/40 transition-colors'
const LABEL = 'text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5'

type NewStep = {
  stepType: 'send_email' | 'wait'
  templateId: string
  domainId: string
  fromName: string
  fromEmail: string
  delayMinutes: number
}

function StepBadge({ s }: { s: EmailAutomationStep }) {
  if (s.stepType === 'wait') {
    const hrs = Math.floor(s.delayMinutes / 60)
    const min = s.delayMinutes % 60
    const label = hrs > 0 ? `Wait ${hrs}h${min > 0 ? ` ${min}m` : ''}` : `Wait ${min}m`
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/08 border border-amber-500/15 text-xs text-amber-400">
        <Clock className="w-3.5 h-3.5 shrink-0" />
        {label}
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-pink-500/08 border border-pink-500/15 text-xs text-foreground">
      <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
      Send email
      {s.fromEmail && <span className="text-muted-foreground">from {s.fromEmail}</span>}
    </div>
  )
}

export function EmailAutomations() {
  const showToast = useToast()
  const [flows, setFlows]       = useState<EmailAutomationFlow[]>([])
  const [clients, setClients]   = useState<Client[]>([])
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [domains, setDomains]   = useState<EmailDomain[]>([])
  const [loading, setLoading]   = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  // Create form
  const [newClient, setNewClient] = useState('')
  const [newName, setNewName]     = useState('')
  const [steps, setSteps]         = useState<NewStep[]>([
    { stepType: 'send_email', templateId: '', domainId: '', fromName: '', fromEmail: '', delayMinutes: 0 },
  ])
  const [creating, setCreating]   = useState(false)

  // Enroll form
  const [enrollText, setEnrollText] = useState('')
  const [enrolling, setEnrolling]   = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      emailAutomationApi.list(),
      commsApi.listClients(),
      emailApi.listTemplates(),
      emailApi.listDomains(),
    ])
      .then(([f, c, t, d]) => { setFlows(f); setClients(c); setTemplates(t); setDomains(d) })
      .catch(() => showToast('Failed to load', 'error'))
      .finally(() => setLoading(false))
  }, [])

  function addStep() {
    setSteps(prev => [...prev, { stepType: 'send_email', templateId: '', domainId: '', fromName: '', fromEmail: '', delayMinutes: 0 }])
  }

  function removeStep(i: number) {
    setSteps(prev => prev.filter((_, idx) => idx !== i))
  }

  function updateStep(i: number, patch: Partial<NewStep>) {
    setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, ...patch } : s))
  }

  async function createFlow() {
    if (!newClient || !newName) { showToast('Client and name required', 'error'); return }
    setCreating(true)
    try {
      const flow = await emailAutomationApi.create({
        clientId: newClient,
        name: newName,
        steps: steps.map(s => ({
          stepType:     s.stepType,
          templateId:   s.templateId || undefined,
          domainId:     s.domainId   || undefined,
          fromName:     s.fromName   || undefined,
          fromEmail:    s.fromEmail  || undefined,
          delayMinutes: s.delayMinutes,
        })),
      })
      setFlows(prev => [flow, ...prev])
      setShowCreate(false)
      setNewClient(''); setNewName('')
      setSteps([{ stepType: 'send_email', templateId: '', domainId: '', fromName: '', fromEmail: '', delayMinutes: 0 }])
      showToast('Automation created', 'success')
    } catch (e) {
      showToast((e as Error).message, 'error')
    } finally {
      setCreating(false)
    }
  }

  async function archive(id: string) {
    if (!window.confirm('Archive this automation?')) return
    try {
      await emailAutomationApi.archive(id)
      setFlows(prev => prev.filter(f => f.id !== id))
      showToast('Archived', 'success')
    } catch (e) {
      showToast((e as Error).message, 'error')
    }
  }

  async function enroll(flowId: string) {
    const lines = enrollText.split('\n').map(l => l.trim()).filter(l => l.includes('@'))
    if (!lines.length) { showToast('Enter at least one email', 'error'); return }
    setEnrolling(flowId)
    try {
      const res = await emailAutomationApi.enroll(flowId, lines.map(email => ({ email })))
      showToast(`${res.enrolled} enrolled`, 'success')
      setEnrollText('')
      setFlows(prev => prev.map(f => f.id === flowId
        ? { ...f, totalEnrolled: f.totalEnrolled + res.enrolled }
        : f))
    } catch (e) {
      showToast((e as Error).message, 'error')
    } finally {
      setEnrolling(null)
    }
  }

  function copyKey(key: string) {
    void navigator.clipboard.writeText(key).then(() => {
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(null), 2000)
    })
  }

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">Email</h1>
          <p className="caption mt-0.5">Automated drip sequences · time-delayed email journeys</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> New automation
        </button>
      </div>

      <EmailTabs />

      {loading ? (
        <div className="flex justify-center py-16 gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      ) : flows.length === 0 ? (
        <div className="rounded-2xl border border-white/07 bg-card flex flex-col items-center justify-center py-16 gap-3 text-center">
          <Zap className="w-10 h-10 text-muted-foreground/20" />
          <p className="font-semibold text-foreground">No automations yet</p>
          <p className="text-sm text-muted-foreground max-w-sm">
            Create a drip sequence — welcome series, onboarding, re-engagement — and enroll contacts or trigger via API.
          </p>
          <button onClick={() => setShowCreate(true)} className="btn-primary mt-1 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create first automation
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {flows.map(flow => {
            const open = expanded === flow.id
            return (
              <div key={flow.id} className="rounded-2xl border border-white/07 bg-card overflow-hidden">
                <div
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                  onClick={() => setExpanded(open ? null : flow.id)}
                >
                  <Zap className="w-4 h-4 text-primary/60 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm">{flow.name}</p>
                    <p className="text-[10px] text-muted-foreground/50">{flow.clientName}</p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs tabular-nums text-foreground">{flow.totalEnrolled}</p>
                      <p className="text-[10px] text-muted-foreground/50">enrolled</p>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-xs tabular-nums text-foreground">{flow.totalCompleted}</p>
                      <p className="text-[10px] text-muted-foreground/50">completed</p>
                    </div>
                    <button
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition"
                      onClick={e => { e.stopPropagation(); void archive(flow.id) }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    {open ? <ChevronDown className="w-4 h-4 text-muted-foreground/40" /> : <ChevronRight className="w-4 h-4 text-muted-foreground/40" />}
                  </div>
                </div>

                {open && (
                  <div className="border-t border-white/06 px-5 py-5 space-y-5">
                    {/* API trigger key */}
                    {flow.triggerKey && (
                      <div className="rounded-xl border border-white/07 bg-white/[0.02] px-4 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">API Trigger Key</p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-xs font-mono text-primary/80 truncate">{flow.triggerKey}</code>
                          <button
                            onClick={() => copyKey(flow.triggerKey!)}
                            className="shrink-0 p-1.5 rounded-lg hover:bg-white/08 transition text-muted-foreground hover:text-foreground"
                          >
                            {copiedKey === flow.triggerKey
                              ? <CheckCircle2 className="w-3.5 h-3.5 text-teal" />
                              : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <p className="text-[10px] text-muted-foreground/50 mt-1.5">
                          POST /v1/public/email-trigger/{flow.triggerKey} {'{'} email, firstName? {'}'}
                        </p>
                      </div>
                    )}

                    {/* Enroll contacts */}
                    <div>
                      <p className={LABEL}>Enroll contacts (one email per line)</p>
                      <textarea
                        rows={3}
                        value={enrollText}
                        onChange={e => setEnrollText(e.target.value)}
                        placeholder={"user@example.com\nanother@example.com"}
                        className={`${FIELD} resize-none font-mono text-xs`}
                      />
                      <button
                        onClick={() => void enroll(flow.id)}
                        disabled={enrolling === flow.id}
                        className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-50"
                        style={{ background: '#C4286F' }}
                      >
                        {enrolling === flow.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Users className="w-3.5 h-3.5" />}
                        Enroll
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className="relative z-10 bg-[#1a1624] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-white/08">
              <h2 className="font-semibold text-foreground">New email automation</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Build a sequence of emails with time delays between steps.</p>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className={LABEL}>Client</label>
                <select className={FIELD} value={newClient} onChange={e => setNewClient(e.target.value)}>
                  <option value="">Select client…</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL}>Automation name</label>
                <input className={FIELD} placeholder="e.g. Welcome Series" value={newName} onChange={e => setNewName(e.target.value)} />
              </div>

              {/* Steps builder */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={LABEL}>Steps</label>
                  <button onClick={addStep} className="flex items-center gap-1 text-xs text-primary hover:underline">
                    <Plus className="w-3.5 h-3.5" /> Add step
                  </button>
                </div>
                <div className="space-y-3">
                  {steps.map((s, i) => (
                    <div key={i} className="rounded-xl border border-white/08 bg-white/[0.02] p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Step {i + 1}</span>
                        {steps.length > 1 && (
                          <button onClick={() => removeStep(i)} className="text-muted-foreground hover:text-red-400 transition">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={LABEL}>Type</label>
                          <select className={FIELD} value={s.stepType} onChange={e => updateStep(i, { stepType: e.target.value as 'send_email' | 'wait' })}>
                            <option value="send_email">Send email</option>
                            <option value="wait">Wait</option>
                          </select>
                        </div>
                        <div>
                          <label className={LABEL}>Delay before this step (minutes)</label>
                          <input type="number" min={0} className={FIELD} value={s.delayMinutes}
                            onChange={e => updateStep(i, { delayMinutes: parseInt(e.target.value) || 0 })} />
                        </div>
                      </div>
                      {s.stepType === 'send_email' && (
                        <>
                          <div>
                            <label className={LABEL}>Template</label>
                            <select className={FIELD} value={s.templateId} onChange={e => updateStep(i, { templateId: e.target.value })}>
                              <option value="">Select template…</option>
                              {templates
                                .filter(t => !newClient || t.clientId === newClient)
                                .map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className={LABEL}>From name</label>
                              <input className={FIELD} placeholder="ERA Support" value={s.fromName} onChange={e => updateStep(i, { fromName: e.target.value })} />
                            </div>
                            <div>
                              <label className={LABEL}>From email</label>
                              <input className={FIELD} placeholder="hello@yourdomain.com" value={s.fromEmail} onChange={e => updateStep(i, { fromEmail: e.target.value })} />
                            </div>
                          </div>
                          <div>
                            <label className={LABEL}>Sending domain</label>
                            <select className={FIELD} value={s.domainId} onChange={e => updateStep(i, { domainId: e.target.value })}>
                              <option value="">Select domain…</option>
                              {domains
                                .filter(d => !newClient || d.clientId === newClient)
                                .map(d => <option key={d.id} value={d.id}>{d.domain}</option>)}
                            </select>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-white/08 flex gap-2 justify-end">
              <button className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn-primary flex items-center gap-2" onClick={() => void createFlow()} disabled={creating}>
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                Create automation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

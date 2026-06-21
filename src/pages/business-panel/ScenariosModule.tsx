import { useState, useEffect } from 'react'
import {
  ShoppingCart, Calendar, Tag, Package, AlertCircle, UserPlus,
  Moon, Pencil, Plus, Trash2, ChevronUp, ChevronDown, X,
} from 'lucide-react'
import { bizApi, type Scenario } from './business-api'

const INPUT = 'w-full px-3.5 py-2.5 rounded-xl bg-[hsl(262_20%_11%)] border border-white/[0.10] text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all'
const LABEL = 'text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-1.5 block'

type TemplateKey =
  | 'order_taking' | 'appointment' | 'price_enquiry' | 'availability'
  | 'complaint' | 'lead_capture' | 'after_hours' | 'custom'

interface Template {
  key: TemplateKey
  icon: React.ComponentType<{ className?: string }>
  name: string
  description: string
  triggerExamples: string[]
}

const TEMPLATES: Template[] = [
  { key: 'order_taking',   icon: ShoppingCart, name: 'Order Taking',         description: 'Collect order details from customers',        triggerExamples: ['I want to order', 'Can I buy', 'Place an order'] },
  { key: 'appointment',    icon: Calendar,     name: 'Appointment Booking',  description: 'Schedule appointments automatically',          triggerExamples: ['Book an appointment', 'I want to schedule', 'Available slots'] },
  { key: 'price_enquiry',  icon: Tag,          name: 'Price Enquiry',        description: 'Answer pricing questions',                     triggerExamples: ['How much is', 'What does it cost', 'Price for'] },
  { key: 'availability',   icon: Package,      name: 'Product Availability', description: 'Check what\'s in stock',                       triggerExamples: ['Do you have', 'Is X available', 'In stock'] },
  { key: 'complaint',      icon: AlertCircle,  name: 'Complaint Handling',   description: 'Handle complaints and escalate',               triggerExamples: ['I have a complaint', 'This is wrong', 'I\'m unhappy'] },
  { key: 'lead_capture',   icon: UserPlus,     name: 'Lead Capture',         description: 'Collect contact info from prospects',          triggerExamples: ['I\'m interested', 'Tell me more', 'I\'d like info'] },
  { key: 'after_hours',    icon: Moon,         name: 'After Hours Response', description: 'Custom message when closed',                   triggerExamples: ['Any message received outside hours'] },
  { key: 'custom',         icon: Pencil,       name: 'Custom',               description: 'Build your own scenario from scratch',         triggerExamples: ['Defined by your keywords'] },
]

type FormConfig = Record<string, string>

interface ScenarioForm {
  templateKey: TemplateKey
  config: FormConfig
  keywords: string[]
  followUp: string
}

const DEFAULT_FORM: ScenarioForm = {
  templateKey: 'custom',
  config: {},
  keywords: [],
  followUp: 'none',
}

function TemplateForm({ templateKey, form, setForm }: {
  templateKey: TemplateKey
  form: ScenarioForm
  setForm: (f: ScenarioForm) => void
}) {
  const set = (k: string, v: string) => setForm({ ...form, config: { ...form.config, [k]: v } })
  const c = form.config

  const confirmField = (
    <div>
      <label className={LABEL}>Confirmation message to customer</label>
      <textarea rows={2} className={INPUT} placeholder="Thanks! Your request has been received..."
        value={c.confirmation ?? ''} onChange={e => set('confirmation', e.target.value)} />
    </div>
  )

  if (templateKey === 'order_taking') return (
    <div className="space-y-4">
      <div>
        <label className={LABEL}>What do you sell?</label>
        <textarea rows={3} className={INPUT} placeholder="Describe your products so the AI knows what details to collect..."
          value={c.products ?? ''} onChange={e => set('products', e.target.value)} />
      </div>
      <div>
        <label className={LABEL}>Where to send order summaries?</label>
        <input className={INPUT} placeholder="Email or WhatsApp number"
          value={c.destination ?? ''} onChange={e => set('destination', e.target.value)} />
      </div>
      {confirmField}
    </div>
  )

  if (templateKey === 'appointment') return (
    <div className="space-y-4">
      <div>
        <label className={LABEL}>Available slots description</label>
        <textarea rows={3} className={INPUT} placeholder="e.g. Mon-Fri 9am-5pm, 30 minute slots, online only..."
          value={c.slots ?? ''} onChange={e => set('slots', e.target.value)} />
      </div>
      <div>
        <label className={LABEL}>How to confirm?</label>
        <div className="flex gap-3">
          {(['email', 'whatsapp'] as const).map(m => (
            <label key={m} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="confirmMode" value={m}
                checked={(c.confirmMode ?? 'whatsapp') === m}
                onChange={() => set('confirmMode', m)}
                className="accent-primary" />
              <span className="text-sm text-foreground capitalize">{m === 'whatsapp' ? 'WhatsApp' : 'Email'}</span>
            </label>
          ))}
        </div>
      </div>
      {confirmField}
    </div>
  )

  if (templateKey === 'custom') return (
    <div className="space-y-4">
      <div>
        <label className={LABEL}>Trigger keywords</label>
        <KeywordsInput keywords={form.keywords} setKeywords={kw => setForm({ ...form, keywords: kw })} />
      </div>
      <div>
        <label className={LABEL}>AI instruction</label>
        <textarea rows={3} className={INPUT} placeholder="What should the AI do when triggered? Be specific..."
          value={c.instruction ?? ''} onChange={e => set('instruction', e.target.value)} />
      </div>
      <div>
        <label className={LABEL}>Follow-up action</label>
        <select className={INPUT} value={form.followUp} onChange={e => setForm({ ...form, followUp: e.target.value })}>
          <option value="none">None</option>
          <option value="collect_info">Collect info</option>
          <option value="alert_human">Alert human</option>
          <option value="send_email">Send email</option>
        </select>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      <div>
        <label className={LABEL}>AI instruction</label>
        <textarea rows={3} className={INPUT} placeholder="Describe what the AI should do for this scenario..."
          value={c.instruction ?? ''} onChange={e => set('instruction', e.target.value)} />
      </div>
      {confirmField}
    </div>
  )
}

function KeywordsInput({ keywords, setKeywords }: { keywords: string[]; setKeywords: (k: string[]) => void }) {
  const [input, setInput] = useState('')

  const add = () => {
    const w = input.trim().toLowerCase()
    if (w && !keywords.includes(w)) setKeywords([...keywords, w])
    setInput('')
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input className={INPUT} placeholder="Type a keyword and press Enter"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }} />
        <button onClick={add} className="px-3 rounded-xl bg-primary/20 text-primary text-sm hover:bg-primary/30 transition-colors shrink-0">Add</button>
      </div>
      {keywords.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {keywords.map(kw => (
            <span key={kw} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.06] text-xs text-foreground">
              {kw}
              <button onClick={() => setKeywords(keywords.filter(k => k !== kw))} className="text-muted-foreground/50 hover:text-red-400 ml-0.5">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export function ScenariosModule() {
  const [scenarios, setScenarios]     = useState<Scenario[]>([])
  const [loading, setLoading]         = useState(true)
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState('')
  const [expandedKey, setExpandedKey] = useState<TemplateKey | null>(null)
  const [form, setForm]               = useState<ScenarioForm>(DEFAULT_FORM)
  const [editingId, setEditingId]     = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    bizApi.listScenarios()
      .then(setScenarios)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const openTemplate = (key: TemplateKey) => {
    if (expandedKey === key && !editingId) { setExpandedKey(null); return }
    setExpandedKey(key)
    setEditingId(null)
    setForm({ ...DEFAULT_FORM, templateKey: key })
  }

  const editScenario = (s: Scenario) => {
    const tpl = TEMPLATES.find(t => t.key === s.templateKey) ?? TEMPLATES[TEMPLATES.length - 1]
    setExpandedKey(tpl.key as TemplateKey)
    setEditingId(s.id)
    setForm({
      templateKey: s.templateKey as TemplateKey,
      config: { ...s.config },
      keywords: s.trigger ? s.trigger.split(',').map(k => k.trim()).filter(Boolean) : [],
      followUp: s.config.followUp ?? 'none',
    })
  }

  const save = async () => {
    if (!expandedKey) return
    const tpl = TEMPLATES.find(t => t.key === expandedKey)!
    const data: Omit<Scenario, 'id' | 'createdAt'> = {
      name: tpl.name,
      templateKey: expandedKey,
      trigger: form.keywords.join(', '),
      active: true,
      priority: editingId ? (scenarios.find(s => s.id === editingId)?.priority ?? 0) : scenarios.length,
      config: { ...form.config, followUp: form.followUp },
    }
    setSaving(true)
    try {
      if (editingId) {
        const updated = await bizApi.updateScenario(editingId, data)
        setScenarios(s => s.map(x => x.id === editingId ? updated : x))
      } else {
        const created = await bizApi.createScenario(data)
        setScenarios(s => [...s, created])
      }
      setExpandedKey(null)
      setEditingId(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const toggle = async (s: Scenario) => {
    try {
      const updated = await bizApi.updateScenario(s.id, { active: !s.active })
      setScenarios(prev => prev.map(x => x.id === s.id ? updated : x))
    } catch {}
  }

  const move = async (id: string, dir: -1 | 1) => {
    const idx = scenarios.findIndex(s => s.id === id)
    if (idx < 0) return
    const next = idx + dir
    if (next < 0 || next >= scenarios.length) return
    const arr = [...scenarios]
    ;[arr[idx], arr[next]] = [arr[next], arr[idx]]
    arr[idx]  = { ...arr[idx],  priority: idx }
    arr[next] = { ...arr[next], priority: next }
    setScenarios(arr)
    await bizApi.updateScenario(id, { priority: next }).catch(() => {})
  }

  const confirmDelete = async (id: string) => {
    try {
      await bizApi.deleteScenario(id)
      setScenarios(s => s.filter(x => x.id !== id))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Delete failed')
    } finally {
      setDeleteConfirm(null)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-foreground">Scenarios</h2>
        <p className="text-sm text-muted-foreground mt-1">Automated response flows triggered by customer messages</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between">
          {error}
          <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Template grid */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-4 uppercase tracking-widest">Available scenarios</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TEMPLATES.map(tpl => {
            const Icon = tpl.icon
            const isOpen = expandedKey === tpl.key && !editingId
            return (
              <div key={tpl.key} className="rounded-xl border border-white/[0.07] bg-card overflow-hidden">
                <button
                  onClick={() => openTemplate(tpl.key)}
                  className="w-full flex items-start gap-3 p-4 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{tpl.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{tpl.description}</p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-medium shrink-0 self-center">
                    {isOpen ? 'Cancel' : 'Add this'}
                  </span>
                </button>

                {isOpen && (
                  <div className="border-t border-white/[0.07] p-4 space-y-4">
                    {/* Trigger preview */}
                    <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Trigger phrase examples</p>
                      <div className="flex flex-wrap gap-1">
                        {tpl.triggerExamples.map(ex => (
                          <span key={ex} className="text-xs px-2 py-0.5 rounded-md bg-white/[0.05] text-muted-foreground">
                            "{ex}"
                          </span>
                        ))}
                      </div>
                    </div>

                    <TemplateForm templateKey={tpl.key} form={form} setForm={setForm} />

                    <button
                      onClick={save}
                      disabled={saving}
                      className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    >
                      {saving ? 'Saving...' : 'Save scenario'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Active scenarios */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-widest">Your active scenarios</p>
        <p className="text-xs text-muted-foreground/60 mb-4">Checked in this order when a customer sends a message</p>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>
        ) : scenarios.length === 0 ? (
          <div className="text-center py-10 rounded-xl border border-dashed border-white/[0.08]">
            <p className="text-sm text-muted-foreground">No scenarios yet. Add one above.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {scenarios.sort((a, b) => a.priority - b.priority).map((s, idx) => {
              const tpl = TEMPLATES.find(t => t.key === s.templateKey)
              const Icon = tpl?.icon ?? Pencil
              const isEditing = editingId === s.id
              return (
                <div key={s.id} className="rounded-xl border border-white/[0.07] bg-card overflow-hidden">
                  <div className="flex items-center gap-3 p-4">
                    <div className="flex flex-col gap-0.5">
                      <button onClick={() => move(s.id, -1)} disabled={idx === 0} className="text-muted-foreground/30 hover:text-muted-foreground disabled:opacity-20">
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => move(s.id, 1)} disabled={idx === scenarios.length - 1} className="text-muted-foreground/30 hover:text-muted-foreground disabled:opacity-20">
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{s.name}</p>
                      {s.trigger && <p className="text-xs text-muted-foreground truncate">Triggers: {s.trigger}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggle(s)}
                        className={`w-9 h-5 rounded-full transition-colors relative ${s.active ? 'bg-primary' : 'bg-white/10'}`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${s.active ? 'left-[18px]' : 'left-0.5'}`} />
                      </button>
                      <button onClick={() => editScenario(s)} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-muted-foreground hover:text-foreground transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {deleteConfirm === s.id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => confirmDelete(s.id)} className="text-xs text-red-400 hover:text-red-300 font-medium px-2 py-1 rounded-lg hover:bg-red-400/10">Confirm</button>
                          <button onClick={() => setDeleteConfirm(null)} className="text-xs text-muted-foreground px-2 py-1 rounded-lg hover:bg-white/[0.04]">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirm(s.id)} className="p-1.5 rounded-lg hover:bg-red-400/10 text-muted-foreground/40 hover:text-red-400 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {isEditing && expandedKey && (
                    <div className="border-t border-white/[0.07] p-4 space-y-4">
                      <TemplateForm templateKey={expandedKey} form={form} setForm={setForm} />
                      <div className="flex gap-2">
                        <button onClick={save} disabled={saving}
                          className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors">
                          {saving ? 'Saving...' : 'Save changes'}
                        </button>
                        <button onClick={() => { setEditingId(null); setExpandedKey(null) }}
                          className="px-4 py-2.5 rounded-xl bg-white/[0.05] text-sm text-muted-foreground hover:bg-white/[0.08] transition-colors">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {!loading && (
          <button
            onClick={() => openTemplate('custom')}
            className="mt-3 w-full py-3 rounded-xl border border-dashed border-white/[0.12] text-sm text-muted-foreground hover:text-foreground hover:border-white/[0.2] transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add custom scenario
          </button>
        )}
      </div>
    </div>
  )
}

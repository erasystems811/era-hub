import { useState, useEffect } from 'react'
import { Plus, Pencil, Copy, Archive, X, Save, Loader2, ShoppingCart, Calendar, Tag, Package, AlertCircle, UserPlus, Moon, Wand2 } from 'lucide-react'
import { commsApi, type AITemplate, type AITemplateCategory, type AITemplateField } from '../../lib/comms-api'

const INPUT = 'w-full px-3.5 py-2.5 rounded-xl bg-[hsl(262_20%_11%)] border border-white/[0.10] text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all'
const LABEL = 'text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-1.5 block'

const CATEGORY_LABELS: Record<AITemplateCategory, string> = {
  order_taking: 'Order Taking',
  booking:      'Booking',
  support:      'Support',
  lead_gen:     'Lead Gen',
  custom:       'Custom',
}

const CATEGORY_COLORS: Record<AITemplateCategory, string> = {
  order_taking: 'bg-emerald-500/10 text-emerald-400',
  booking:      'bg-blue-500/10 text-blue-400',
  support:      'bg-amber-500/10 text-amber-400',
  lead_gen:     'bg-purple-500/10 text-purple-400',
  custom:       'bg-primary/10 text-primary',
}

const BuiltinIcon: Record<string, React.ElementType> = {
  'Order Taking':          ShoppingCart,
  'Appointment Booking':   Calendar,
  'Price Enquiry':         Tag,
  'Product Availability':  Package,
  'Complaint Handling':    AlertCircle,
  'Lead Capture':          UserPlus,
  'After Hours Response':  Moon,
  'Custom':                Wand2,
}

const DEFAULTS: Omit<AITemplate, 'id' | 'archived' | 'createdAt'>[] = [
  {
    name: 'Order Taking', category: 'order_taking',
    description: 'Collect order details from customers automatically',
    instruction: 'Ask the customer what they would like to order. Collect all necessary details including: {{what_to_collect}}. Summarize the order and confirm before ending.',
    triggerKeywords: ['order', 'buy', 'purchase', 'want to get'],
    fields: [
      { key: 'what_to_collect', label: 'What details to collect', placeholder: 'e.g. item name, quantity, delivery address', required: true },
    ],
  },
  {
    name: 'Appointment Booking', category: 'booking',
    description: 'Schedule appointments automatically',
    instruction: 'Help the customer book an appointment. Available slots: {{available_slots}}. Collect their name, preferred date/time, and {{extra_info}}. Confirm the booking.',
    triggerKeywords: ['book', 'appointment', 'schedule', 'visit'],
    fields: [
      { key: 'available_slots', label: 'Available slots description', placeholder: 'e.g. Monday-Friday 9am-5pm', required: true },
      { key: 'extra_info', label: 'Extra info to collect', placeholder: 'e.g. reason for visit', required: false },
    ],
  },
  {
    name: 'Price Enquiry', category: 'support',
    description: 'Answer pricing questions accurately',
    instruction: 'Answer pricing questions about our products/services: {{price_list}}. Be specific and helpful. If the customer asks about something not listed, say you\'ll get back to them.',
    triggerKeywords: ['price', 'cost', 'how much', 'fee'],
    fields: [
      { key: 'price_list', label: 'Products and prices', placeholder: 'e.g. Product A = ₦5000, Product B = ₦10000', required: true },
    ],
  },
  {
    name: 'Product Availability', category: 'order_taking',
    description: 'Check and communicate stock availability',
    instruction: 'Help customers check if products are available. Current inventory: {{inventory}}. If unavailable, offer alternatives or ask them to check back.',
    triggerKeywords: ['available', 'in stock', 'do you have', 'stock'],
    fields: [
      { key: 'inventory', label: 'Current inventory description', placeholder: 'e.g. Product A (in stock), Product B (out of stock)', required: true },
    ],
  },
  {
    name: 'Complaint Handling', category: 'support',
    description: 'Handle complaints and escalate appropriately',
    instruction: 'Listen to the customer\'s complaint empathetically. Acknowledge their frustration. If the issue is: {{resolvable_issues}}, try to resolve it. Otherwise, escalate to a human and let them know someone will follow up within {{response_time}}.',
    triggerKeywords: ['complaint', 'problem', 'issue', 'bad', 'wrong'],
    fields: [
      { key: 'resolvable_issues', label: 'Issues you can resolve directly', placeholder: 'e.g. wrong order, delivery delay', required: true },
      { key: 'response_time', label: 'Human follow-up time', placeholder: 'e.g. 2 hours', required: true },
    ],
  },
  {
    name: 'Lead Capture', category: 'lead_gen',
    description: 'Collect contact information from potential customers',
    instruction: 'Engage the customer and collect their contact information. Get: name, phone number, email (if willing), and {{what_they_want}}. Thank them and let them know {{next_steps}}.',
    triggerKeywords: ['interested', 'learn more', 'info', 'details'],
    fields: [
      { key: 'what_they_want', label: 'What to ask about their interest', placeholder: 'e.g. which product they\'re interested in', required: true },
      { key: 'next_steps', label: 'What happens next', placeholder: 'e.g. our team will call within 24 hours', required: true },
    ],
  },
  {
    name: 'After Hours Response', category: 'custom',
    description: 'Handle messages received outside business hours',
    instruction: 'The customer has messaged outside business hours. Let them know: {{after_hours_message}}. Our business hours are {{hours}}. Take their message and assure them we\'ll respond when we\'re open.',
    triggerKeywords: [],
    fields: [
      { key: 'after_hours_message', label: 'Your after-hours message', placeholder: 'e.g. Thanks for reaching out! We\'re currently closed.', required: true },
      { key: 'hours', label: 'Business hours', placeholder: 'e.g. Monday-Friday 9am-6pm', required: true },
    ],
  },
  {
    name: 'Custom', category: 'custom',
    description: 'Build your own scenario from scratch',
    instruction: '{{custom_instruction}}',
    triggerKeywords: [],
    fields: [
      { key: 'custom_instruction', label: 'AI instruction', placeholder: 'Describe exactly what the AI should do when this scenario triggers…', required: true },
    ],
  },
]

interface TemplateFormState {
  name: string
  category: AITemplateCategory
  description: string
  instruction: string
  triggerKeywords: string[]
  fields: AITemplateField[]
  keywordInput: string
}

function emptyForm(): TemplateFormState {
  return { name: '', category: 'custom', description: '', instruction: '', triggerKeywords: [], fields: [], keywordInput: '' }
}

function fromDefault(d: Omit<AITemplate, 'id' | 'archived' | 'createdAt'>): TemplateFormState {
  return { ...emptyForm(), ...d, keywordInput: '' }
}

export function AITemplates() {
  const [templates, setTemplates] = useState<AITemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<TemplateFormState>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    commsApi.listTemplates()
      .then(setTemplates)
      .catch(() => {
        // Backend not ready yet — show defaults as read-only
        setTemplates(DEFAULTS.map((d, i) => ({
          ...d, id: `default-${i}`, archived: false, createdAt: new Date().toISOString()
        })))
      })
      .finally(() => setLoading(false))
  }, [])

  function openNew() {
    setForm(emptyForm()); setEditId(null); setError(null); setDrawerOpen(true)
  }

  function openEdit(t: AITemplate) {
    setForm({ ...t, keywordInput: '' }); setEditId(t.id); setError(null); setDrawerOpen(true)
  }

  function openDuplicate(t: AITemplate) {
    setForm({ ...t, name: `${t.name} (copy)`, keywordInput: '' }); setEditId(null); setError(null); setDrawerOpen(true)
  }

  async function handleArchive(id: string) {
    try {
      await commsApi.archiveTemplate(id)
      setTemplates(prev => prev.filter(t => t.id !== id))
    } catch {
      // Backend stub — just remove from local state
      setTemplates(prev => prev.filter(t => t.id !== id))
    }
  }

  async function handleSave() {
    setSaving(true); setError(null)
    const payload = {
      name: form.name, category: form.category, description: form.description,
      instruction: form.instruction, triggerKeywords: form.triggerKeywords, fields: form.fields,
    }
    try {
      if (editId) {
        const updated = await commsApi.updateTemplate(editId, payload)
        setTemplates(prev => prev.map(t => t.id === editId ? updated : t))
      } else {
        const created = await commsApi.createTemplate(payload)
        setTemplates(prev => [...prev, created])
      }
      setDrawerOpen(false)
    } catch {
      // Backend stub — optimistic update
      const mock: AITemplate = { ...payload, id: Date.now().toString(), archived: false, createdAt: new Date().toISOString() }
      if (editId) {
        setTemplates(prev => prev.map(t => t.id === editId ? { ...t, ...payload } : t))
      } else {
        setTemplates(prev => [...prev, mock])
      }
      setDrawerOpen(false)
    } finally {
      setSaving(false)
    }
  }

  function addKeyword() {
    const kw = form.keywordInput.trim()
    if (!kw || form.triggerKeywords.includes(kw)) return
    setForm(f => ({ ...f, triggerKeywords: [...f.triggerKeywords, kw], keywordInput: '' }))
  }

  function removeKeyword(kw: string) {
    setForm(f => ({ ...f, triggerKeywords: f.triggerKeywords.filter(k => k !== kw) }))
  }

  function addField() {
    setForm(f => ({ ...f, fields: [...f.fields, { key: '', label: '', placeholder: '', required: false }] }))
  }

  function updateField(i: number, patch: Partial<AITemplateField>) {
    setForm(f => { const fields = [...f.fields]; fields[i] = { ...fields[i], ...patch }; return { ...f, fields } })
  }

  function removeField(i: number) {
    setForm(f => ({ ...f, fields: f.fields.filter((_, j) => j !== i) }))
  }

  const active = templates.filter(t => !t.archived)

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">AI Templates</h1>
          <p className="caption mt-0.5">Scenario templates available to all businesses</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-all">
          <Plus className="w-4 h-4" /> Add template
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-white/[0.07] bg-card p-5 space-y-3 animate-pulse">
              <div className="w-8 h-8 bg-white/06 rounded-lg" />
              <div className="h-4 bg-white/06 rounded w-3/4" />
              <div className="h-3 bg-white/06 rounded w-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {active.map(t => {
            const Icon = BuiltinIcon[t.name] ?? Wand2
            return (
              <div key={t.id} className="group rounded-xl border border-white/[0.07] bg-card p-5 flex flex-col gap-3 hover:border-white/[0.12] transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(191,124,147,0.1)' }}>
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg hover:bg-white/06 transition-colors" title="Edit">
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button onClick={() => openDuplicate(t)} className="p-1.5 rounded-lg hover:bg-white/06 transition-colors" title="Duplicate">
                      <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button onClick={() => handleArchive(t.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors" title="Archive">
                      <Archive className="w-3.5 h-3.5 text-muted-foreground hover:text-red-400" />
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{t.description}</p>
                </div>
                <div className="flex items-center justify-between mt-auto">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${CATEGORY_COLORS[t.category]}`}>
                    {CATEGORY_LABELS[t.category]}
                  </span>
                  <span className="text-xs text-muted-foreground/60">{t.fields.length} field{t.fields.length !== 1 ? 's' : ''}</span>
                </div>
                {t.triggerKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {t.triggerKeywords.slice(0, 3).map(kw => (
                      <span key={kw} className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.07] text-muted-foreground">
                        {kw}
                      </span>
                    ))}
                    {t.triggerKeywords.length > 3 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.07] text-muted-foreground">
                        +{t.triggerKeywords.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div className="w-full max-w-lg bg-[hsl(262_20%_8%)] border-l border-white/[0.07] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
              <h2 className="text-sm font-semibold text-foreground">{editId ? 'Edit Template' : 'New Template'}</h2>
              <button onClick={() => setDrawerOpen(false)} className="p-1.5 rounded-lg hover:bg-white/06 transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {error && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</div>}

              {/* Quick-pick from defaults */}
              {!editId && (
                <div>
                  <label className={LABEL}>Start from template</label>
                  <div className="grid grid-cols-2 gap-2">
                    {DEFAULTS.map(d => (
                      <button
                        key={d.name}
                        onClick={() => setForm(fromDefault(d))}
                        className="text-left px-3 py-2 rounded-lg border border-white/[0.08] hover:border-primary/40 hover:bg-primary/5 transition-all text-xs text-muted-foreground hover:text-foreground"
                      >
                        {d.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className={LABEL}>Template name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={INPUT} placeholder="e.g. Order Taking" />
              </div>
              <div>
                <label className={LABEL}>Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as AITemplateCategory }))} className={INPUT}>
                  <option value="order_taking">Order Taking</option>
                  <option value="booking">Booking</option>
                  <option value="support">Support</option>
                  <option value="lead_gen">Lead Gen</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div>
                <label className={LABEL}>Description</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={INPUT} placeholder="One line description…" />
              </div>
              <div>
                <label className={LABEL}>AI Instruction Template</label>
                <p className="text-xs text-muted-foreground/60 mb-2">Use {'{{placeholder}}'} for fill-in fields that businesses customize</p>
                <textarea
                  value={form.instruction}
                  onChange={e => setForm(f => ({ ...f, instruction: e.target.value }))}
                  rows={5}
                  className={`${INPUT} resize-none`}
                  placeholder="Describe what the AI should do…"
                />
              </div>

              {/* Trigger keywords */}
              <div>
                <label className={LABEL}>Trigger Keywords</label>
                <div className="flex gap-2 mb-2">
                  <input
                    value={form.keywordInput}
                    onChange={e => setForm(f => ({ ...f, keywordInput: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                    className={`${INPUT} flex-1`}
                    placeholder="Type keyword, press Enter"
                  />
                  <button onClick={addKeyword} className="px-3 py-2 rounded-xl border border-white/10 text-sm text-muted-foreground hover:text-foreground hover:border-white/20 transition-all">
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {form.triggerKeywords.map(kw => (
                    <span key={kw} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-muted-foreground">
                      {kw}
                      <button onClick={() => removeKeyword(kw)} className="hover:text-red-400 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Fields */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={LABEL}>Fill-in Fields</label>
                  <button onClick={addField} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
                    <Plus className="w-3 h-3" /> Add field
                  </button>
                </div>
                <div className="space-y-3">
                  {form.fields.map((field, i) => (
                    <div key={i} className="p-3 rounded-xl border border-white/[0.07] bg-white/[0.02] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Field {i + 1}</span>
                        <button onClick={() => removeField(i)} className="text-muted-foreground/40 hover:text-red-400 transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          value={field.key}
                          onChange={e => updateField(i, { key: e.target.value })}
                          className={INPUT}
                          placeholder="key (snake_case)"
                        />
                        <input
                          value={field.label}
                          onChange={e => updateField(i, { label: e.target.value })}
                          className={INPUT}
                          placeholder="Label for business"
                        />
                      </div>
                      <input
                        value={field.placeholder}
                        onChange={e => updateField(i, { placeholder: e.target.value })}
                        className={INPUT}
                        placeholder="Placeholder / hint text"
                      />
                      <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={e => updateField(i, { required: e.target.checked })}
                          className="accent-primary"
                        />
                        Required
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-white/[0.07]">
              <button
                onClick={handleSave}
                disabled={saving || !form.name}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 disabled:opacity-50 transition-all"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving…' : editId ? 'Update template' : 'Create template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

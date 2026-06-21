import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Bot, Mic, BarChart3, X, AlertCircle, Check } from 'lucide-react'
import { commsApi, Plan, CreatePlanData } from '../../lib/comms-api'
import { fmtNumber } from '../../lib/utils'

// ── helpers ──────────────────────────────────────────────────────────────────

const BILLING_LABELS: Record<string, string> = {
  none:        'Free / Internal',
  usage_based: 'Usage-based',
  plan_based:  'Fixed monthly',
}

function emptyForm(): CreatePlanData {
  return {
    name: '', displayName: '',
    aiEnabled: true, voiceEnabled: false, analyticsEnabled: true,
    billingModel: 'usage_based',
    monthlyFee: null,
    monthlyMessageCap: null, dailyMessageCap: null,
    hourlyMessageCap: null, maxSessions: 1,
  }
}

// ── Plan form modal ───────────────────────────────────────────────────────────

interface FormModalProps {
  plan: Plan | null   // null = create mode
  onClose: () => void
  onSaved: (p: Plan) => void
}

function PlanFormModal({ plan, onClose, onSaved }: FormModalProps) {
  const isEdit = plan !== null
  const [form, setForm] = useState<CreatePlanData>(() =>
    isEdit
      ? {
          name: plan.name, displayName: plan.displayName,
          aiEnabled: plan.aiEnabled, voiceEnabled: plan.voiceEnabled,
          analyticsEnabled: plan.analyticsEnabled,
          billingModel: plan.billingModel,
          monthlyFee: plan.monthlyFee,
          monthlyMessageCap: plan.limits.monthlyMessages,
          dailyMessageCap: plan.limits.dailyMessages,
          hourlyMessageCap: plan.limits.hourlyMessages,
          maxSessions: plan.limits.maxSessions,
        }
      : emptyForm()
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function setF<K extends keyof CreatePlanData>(k: K, v: CreatePlanData[K]) {
    setForm(f => ({ ...f, [k]: v }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      if (isEdit) {
        const { name: _n, ...rest } = form
        await commsApi.updatePlan(plan.id, rest)
        onSaved({ ...plan, ...form, limits: {
          monthlyMessages: form.monthlyMessageCap,
          dailyMessages: form.dailyMessageCap,
          hourlyMessages: form.hourlyMessageCap,
          maxSessions: form.maxSessions,
        }})
      } else {
        const created = await commsApi.createPlan(form)
        onSaved(created)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save plan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border border-white/10 rounded-2xl shadow-card-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/07">
          <h2 className="font-semibold text-foreground">
            {isEdit ? `Edit — ${plan.displayName}` : 'Create Plan'}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-5">
          {/* Name slug — create only */}
          {!isEdit && (
            <div>
              <label className="label">Plan slug (ID)</label>
              <input
                className="input"
                value={form.name}
                onChange={e => setF('name', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="e.g. growth"
                required
              />
              <p className="text-[11px] text-muted-foreground mt-1">Lowercase letters, numbers, underscores only.</p>
            </div>
          )}

          {/* Display name */}
          <div>
            <label className="label">Display name</label>
            <input
              className="input"
              value={form.displayName}
              onChange={e => setF('displayName', e.target.value)}
              placeholder="e.g. Growth"
              required
            />
          </div>

          {/* Billing */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Billing model</label>
              <select
                className="input"
                value={form.billingModel}
                onChange={e => setF('billingModel', e.target.value as CreatePlanData['billingModel'])}
              >
                <option value="none">Free / Internal</option>
                <option value="usage_based">Usage-based</option>
                <option value="plan_based">Fixed monthly</option>
              </select>
            </div>
            <div>
              <label className="label">Monthly fee (₦)</label>
              <input
                className="input"
                type="number"
                min="0"
                value={form.monthlyFee ?? ''}
                onChange={e => setF('monthlyFee', e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="Leave blank = free"
                disabled={form.billingModel === 'none'}
              />
            </div>
          </div>

          {/* Limits */}
          <div>
            <p className="label mb-2">Message limits (leave blank = unlimited)</p>
            <div className="grid grid-cols-3 gap-3">
              {([
                ['Monthly', 'monthlyMessageCap'],
                ['Daily',   'dailyMessageCap'],
                ['Hourly',  'hourlyMessageCap'],
              ] as const).map(([lbl, key]) => (
                <div key={key}>
                  <label className="text-[10px] text-muted-foreground block mb-1">{lbl}</label>
                  <input
                    className="input text-sm"
                    type="number"
                    min="1"
                    value={form[key] ?? ''}
                    onChange={e => setF(key, e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="∞"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Max WhatsApp sessions (blank = unlimited)</label>
            <input
              className="input"
              type="number"
              min="1"
              value={form.maxSessions ?? ''}
              onChange={e => setF('maxSessions', e.target.value ? parseInt(e.target.value) : null)}
              placeholder="∞"
            />
          </div>

          {/* Feature toggles */}
          <div>
            <p className="label mb-3">Features</p>
            <div className="space-y-2">
              {([
                ['aiEnabled',        'AI / Smart replies'],
                ['voiceEnabled',     'Voice calls'],
                ['analyticsEnabled', 'Analytics dashboard'],
              ] as const).map(([key, lbl]) => (
                <label key={key} className="flex items-center justify-between cursor-pointer select-none">
                  <span className="text-sm text-foreground">{lbl}</span>
                  <div
                    onClick={() => setF(key, !form[key])}
                    className={`relative w-9 h-5 rounded-full transition-colors duration-200 cursor-pointer ${form[key] ? 'bg-primary' : 'bg-white/10'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${form[key] ? 'translate-x-4' : ''}`} />
                  </div>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Delete confirm ────────────────────────────────────────────────────────────

interface DeleteModalProps {
  plan: Plan
  onClose: () => void
  onDeleted: (id: string) => void
}

function DeleteModal({ plan, onClose, onDeleted }: DeleteModalProps) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function confirm() {
    setError('')
    setDeleting(true)
    try {
      await commsApi.deletePlan(plan.id)
      onDeleted(plan.id)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete plan')
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border border-white/10 rounded-2xl shadow-card-lg w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center">
            <Trash2 className="w-4 h-4 text-destructive" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Delete plan</p>
            <p className="text-xs text-muted-foreground">{plan.displayName}</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          This will permanently delete this plan. Businesses on it must be reassigned first.
        </p>

        {error && (
          <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-3 py-2 mb-4">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={confirm} disabled={deleting} className="btn-danger flex-1">
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function Plans() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [formTarget, setFormTarget] = useState<Plan | null | 'create'>(undefined as unknown as Plan)
  const [deleteTarget, setDeleteTarget] = useState<Plan | null>(null)

  useEffect(() => {
    void commsApi.listPlans().then(setPlans).finally(() => setLoading(false))
  }, [])

  function handleSaved(saved: Plan) {
    setPlans(prev => {
      const idx = prev.findIndex(p => p.id === saved.id)
      return idx >= 0 ? prev.map(p => p.id === saved.id ? saved : p) : [...prev, saved]
    })
    setFormTarget(undefined as unknown as Plan)
  }

  function handleDeleted(id: string) {
    setPlans(prev => prev.filter(p => p.id !== id))
    setDeleteTarget(null)
  }

  const billable = plans.filter(p => p.billingModel !== 'none' && p.monthlyFee && p.monthlyFee > 0)
  const free     = plans.filter(p => p.billingModel === 'none' || !p.monthlyFee)

  if (loading) return <div className="text-center py-16 text-muted-foreground">Loading…</div>

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Plans</h1>
          <p className="caption mt-0.5">{plans.length} plan{plans.length !== 1 ? 's' : ''} configured</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setFormTarget('create')}>
          <Plus className="w-4 h-4" /> Create Plan
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Plans',   value: plans.length,    color: 'text-foreground' },
          { label: 'Paid Plans',    value: billable.length, color: 'text-primary' },
          { label: 'Free / Internal', value: free.length,  color: 'text-teal' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-white/07 bg-card px-4 py-3.5">
            <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
            <p className={`text-2xl font-bold tabular-nums mt-0.5 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      {plans.length === 0 ? (
        <div className="rounded-2xl border border-white/07 bg-card text-center py-14">
          <p className="font-medium text-foreground">No plans configured</p>
          <p className="caption mt-1">Create your first plan to onboard businesses.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/07 bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                {['Plan', 'Billing', 'Msg Cap / month', 'Sessions', 'Features', 'Businesses', ''].map(h => (
                  <th key={h} className="label text-left px-5 py-3.5 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {plans.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                  className="hover:bg-white/[0.02] last:border-0 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-foreground">{p.displayName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 font-mono">{p.name}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs text-muted-foreground">{BILLING_LABELS[p.billingModel] ?? p.billingModel}</span>
                    {p.monthlyFee != null && p.monthlyFee > 0 && (
                      <p className="text-xs font-medium text-foreground mt-0.5">₦{fmtNumber(p.monthlyFee)}/mo</p>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-foreground font-medium">
                    {p.limits.monthlyMessages ? fmtNumber(p.limits.monthlyMessages) : <span className="text-teal text-xs">Unlimited</span>}
                  </td>
                  <td className="px-5 py-3.5 text-foreground font-medium">
                    {p.limits.maxSessions ?? <span className="text-teal text-xs">Unlimited</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <span title="AI" className={p.aiEnabled ? 'text-primary' : 'text-muted-foreground/30'}>
                        <Bot className="w-3.5 h-3.5" />
                      </span>
                      <span title="Voice" className={p.voiceEnabled ? 'text-teal' : 'text-muted-foreground/30'}>
                        <Mic className="w-3.5 h-3.5" />
                      </span>
                      <span title="Analytics" className={p.analyticsEnabled ? 'text-foreground/60' : 'text-muted-foreground/30'}>
                        <BarChart3 className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`font-semibold ${p.clientCount > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {p.clientCount}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => setFormTarget(p)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/07 transition"
                        title="Edit plan"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(p)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                        title={p.clientCount > 0 ? `${p.clientCount} businesses on this plan` : 'Delete plan'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Feature legend */}
      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Bot className="w-3 h-3 text-primary" /> AI enabled</span>
        <span className="flex items-center gap-1"><Mic className="w-3 h-3 text-teal" /> Voice calls</span>
        <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3 text-foreground/60" /> Analytics</span>
        <span className="text-white/20">· dimmed = disabled</span>
      </div>

      {/* Modals */}
      {(formTarget === 'create' || (formTarget && formTarget !== undefined)) && (
        <PlanFormModal
          plan={formTarget === 'create' ? null : formTarget as Plan}
          onClose={() => setFormTarget(undefined as unknown as Plan)}
          onSaved={handleSaved}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          plan={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  )
}

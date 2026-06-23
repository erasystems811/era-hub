import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Loader2, Bot, MessageSquare, Zap } from 'lucide-react'
import { commsApi, type ClientDetail, type Plan } from '../../lib/comms-api'
import { eventsApi, type UsageRecord } from '../../lib/events-api'

const LABEL = 'text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-1.5 block'

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-white/10'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
  )
}

export function AIClientConfig() {
  const { clientId } = useParams<{ clientId: string }>()
  const nav = useNavigate()

  const [detail, setDetail]   = useState<ClientDetail | null>(null)
  const [plans, setPlans]     = useState<Plan[]>([])
  const [usage, setUsage]     = useState<UsageRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const [active, setActive]   = useState(true)
  const [planId, setPlanId]   = useState('')

  useEffect(() => {
    if (!clientId) return
    Promise.all([
      commsApi.getClient(clientId),
      commsApi.listPlans(),
      eventsApi.getBusinessUsage(clientId).catch(() => null),
    ]).then(([d, p, u]) => {
      setDetail(d)
      setPlans(p)
      setActive(d.active)
      setPlanId(d.planId)
      setUsage(u)
    }).catch(e => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [clientId])

  async function handleSave() {
    if (!clientId || !detail) return
    setSaving(true); setError(null)
    try {
      await commsApi.updateClient(clientId, { active, planId })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const currentPlan = plans.find(p => p.id === planId)

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <button
          onClick={() => nav('/comms/ai-engine')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> AI Engine
        </button>
        <h1 className="page-title">{detail?.name ?? 'Business'}</h1>
        <p className="caption mt-0.5">Account status and plan configuration</p>
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</div>
      )}

      {/* Account Status */}
      <div className="rounded-xl border border-white/[0.07] bg-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Account Active</p>
            <p className="text-xs text-muted-foreground mt-0.5">Suspending this account disables all messaging, WhatsApp sessions, and AI</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-medium ${active ? 'text-emerald-400' : 'text-red-400'}`}>
              {active ? 'Active' : 'Suspended'}
            </span>
            <Toggle checked={active} onChange={setActive} />
          </div>
        </div>
      </div>

      {/* Plan */}
      <div className="rounded-xl border border-white/[0.07] bg-card p-5 space-y-4">
        <div>
          <p className="text-sm font-semibold text-foreground">Subscription Plan</p>
          <p className="text-xs text-muted-foreground mt-0.5">The plan controls AI access, message caps, session limits, and features</p>
        </div>

        <div>
          <label className={LABEL}>Current plan</label>
          <select
            value={planId}
            onChange={e => setPlanId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[hsl(262_20%_11%)] border border-white/[0.10] text-foreground text-sm focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all"
          >
            {plans.map(p => (
              <option key={p.id} value={p.id}>{p.displayName}</option>
            ))}
          </select>
        </div>

        {currentPlan && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'AI',        value: currentPlan.aiEnabled        ? 'Enabled' : 'Disabled', ok: currentPlan.aiEnabled },
              { label: 'Voice',     value: currentPlan.voiceEnabled     ? 'Enabled' : 'Disabled', ok: currentPlan.voiceEnabled },
              { label: 'Analytics', value: currentPlan.analyticsEnabled ? 'Enabled' : 'Disabled', ok: currentPlan.analyticsEnabled },
            ].map(f => (
              <div key={f.label} className="rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{f.label}</p>
                <p className={`text-sm font-semibold mt-0.5 ${f.ok ? 'text-emerald-400' : 'text-muted-foreground'}`}>{f.value}</p>
              </div>
            ))}
          </div>
        )}

        {currentPlan && (
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Monthly message cap',  value: currentPlan.limits.monthlyMessages != null ? currentPlan.limits.monthlyMessages.toLocaleString() : 'Unlimited' },
              { label: 'Max sessions',         value: currentPlan.limits.maxSessions     != null ? String(currentPlan.limits.maxSessions)               : 'Unlimited' },
            ].map(f => (
              <div key={f.label} className="rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{f.label}</p>
                <p className="text-sm font-semibold text-foreground mt-0.5">{f.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Usage */}
      {usage && (
        <div className="rounded-xl border border-white/[0.07] bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Bot className="w-4 h-4 text-primary/70" />
            <p className="text-sm font-semibold text-foreground">AI Usage This Month</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Zap,           label: 'AI Tokens',   value: usage.aiTokensUsed.toLocaleString() },
              { icon: MessageSquare, label: 'Messages Out', value: usage.messagesOut.toLocaleString()  },
              { icon: MessageSquare, label: 'Messages In',  value: usage.messagesIn.toLocaleString()   },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className="w-3 h-3 text-muted-foreground/60" />
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
                </div>
                <p className="text-lg font-bold text-foreground">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI behavior note */}
      {currentPlan?.aiEnabled && (
        <div className="rounded-xl border border-white/[0.07] bg-card p-5">
          <div className="flex items-start gap-3">
            <Bot className="w-4 h-4 text-primary/70 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">AI Behavior is Configured by the Business</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                The business owner configures their AI system prompt, knowledge base, tone, language, and conversation scenarios from their own business portal. As the operator, your controls are account status and plan selection above.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 disabled:opacity-50 transition-all"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved!' : saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}

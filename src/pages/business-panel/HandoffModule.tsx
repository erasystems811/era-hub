import { useState, useEffect } from 'react'
import { Save, X } from 'lucide-react'
import { bizApi, type HandoffConfig } from './business-api'
import { PhoneInput } from '../../components/PhoneInput'

const INPUT = 'w-full px-3.5 py-2.5 rounded-xl bg-[hsl(262_20%_11%)] border border-white/[0.10] text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all'
const LABEL = 'text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-1.5 block'

const DEFAULT: HandoffConfig = {
  triggerOnRequest:   true,
  triggerOnConfusion: false,
  triggerOnComplaint: false,
  customKeywords:     '',
  urgentTopics:       '',
  alertWhatsApp:      '',
  alertEmail:         '',
  waitMessage:        'Please wait, connecting you with our team...',
  maxWaitMinutes:     30,
  onNoResponse:       'ai_retakes',
}

function Toggle({ checked, onChange, label, sub }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; sub?: string
}) {
  return (
    <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`w-10 h-5.5 rounded-full shrink-0 transition-colors relative mt-0.5 ${checked ? 'bg-primary' : 'bg-white/10'}`}
        style={{ minWidth: 40, height: 22 }}
      >
        <span className={`absolute top-[3px] w-4 h-4 rounded-full bg-white transition-all ${checked ? 'left-[20px]' : 'left-[3px]'}`} />
      </button>
    </div>
  )
}

export function HandoffModule() {
  const [cfg, setCfg]     = useState<HandoffConfig>(DEFAULT)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [error, setError]     = useState('')

  useEffect(() => {
    bizApi.getHandoff()
      .then(data => setCfg({ ...DEFAULT, ...data }))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const set = <K extends keyof HandoffConfig>(k: K, v: HandoffConfig[K]) =>
    setCfg(c => ({ ...c, [k]: v }))

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      await bizApi.updateHandoff(cfg)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-center py-16 text-muted-foreground text-sm">Loading...</div>

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-foreground">Human Handoff</h2>
        <p className="text-sm text-muted-foreground mt-1">When the AI stops and connects the customer to a real person</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between">
          {error} <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Section 1: When to hand off */}
      <section className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">When to hand off</p>

        <Toggle
          checked={cfg.triggerOnRequest}
          onChange={v => set('triggerOnRequest', v)}
          label="Customer explicitly asks for human"
          sub="Triggered by: 'talk to someone', 'human agent', 'speak to a person'"
        />
        <Toggle
          checked={cfg.triggerOnConfusion}
          onChange={v => set('triggerOnConfusion', v)}
          label="AI doesn't understand after 3 tries"
          sub="When the AI fails to handle the same conversation 3 times in a row"
        />
        <Toggle
          checked={cfg.triggerOnComplaint}
          onChange={v => set('triggerOnComplaint', v)}
          label="Complaint detected"
          sub="Triggered when a customer expresses dissatisfaction or frustration"
        />

        <div>
          <label className={LABEL}>Custom keyword triggers</label>
          <input className={INPUT} placeholder="e.g. refund, lawsuit, emergency (comma separated)"
            value={cfg.customKeywords}
            onChange={e => set('customKeywords', e.target.value)} />
          <p className="text-xs text-muted-foreground/50 mt-1">Separate multiple keywords with commas</p>
        </div>

        <div>
          <label className={LABEL}>Urgent topics (describe for your business)</label>
          <textarea rows={2} className={INPUT}
            placeholder="e.g. Any medical emergency, payment disputes over ₦100,000, delivery failures..."
            value={cfg.urgentTopics}
            onChange={e => set('urgentTopics', e.target.value)} />
        </div>
      </section>

      {/* Section 2: Who gets alerted */}
      <section className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">Who gets alerted</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={LABEL}>Alert via WhatsApp</label>
            <PhoneInput value={cfg.alertWhatsApp} onChange={v => set('alertWhatsApp', v)} inputClassName={INPUT} />
          </div>
          <div>
            <label className={LABEL}>Alert via email</label>
            <input className={INPUT} type="email" placeholder="you@example.com"
              value={cfg.alertEmail}
              onChange={e => set('alertEmail', e.target.value)} />
          </div>
        </div>
      </section>

      {/* Section 3: What happens */}
      <section className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">What happens during handoff</p>

        <div>
          <label className={LABEL}>Message to customer</label>
          <textarea rows={2} className={INPUT}
            value={cfg.waitMessage}
            onChange={e => set('waitMessage', e.target.value)} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={LABEL}>Max wait time before AI retakes</label>
            <select className={INPUT}
              value={cfg.maxWaitMinutes ?? ''}
              onChange={e => set('maxWaitMinutes', e.target.value === '' ? null : Number(e.target.value))}>
              <option value="5">5 minutes</option>
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="">Never</option>
            </select>
          </div>
          <div>
            <label className={LABEL}>If no human responds</label>
            <select className={INPUT}
              value={cfg.onNoResponse}
              onChange={e => set('onNoResponse', e.target.value as HandoffConfig['onNoResponse'])}>
              <option value="ai_retakes">AI retakes conversation</option>
              <option value="keep_waiting">Keep waiting</option>
              <option value="follow_up">Send follow-up message</option>
            </select>
          </div>
        </div>
      </section>

      <button onClick={save} disabled={saving}
        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors">
        <Save className="w-4 h-4" />
        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save settings'}
      </button>
    </div>
  )
}

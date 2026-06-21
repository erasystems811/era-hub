import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Copy, Eye, EyeOff } from 'lucide-react'
import { Glass } from '../../components/Glass'
import { QRModal } from '../../components/QRModal'
import { commsApi, Plan } from '../../lib/comms-api'
import { slugify } from '../../lib/utils'
import { useEffect } from 'react'

const SCOPES = ['messages:send', 'sessions:read', 'webhooks:manage']

const STEPS = [
  'Business details',
  'Choose plan',
  'API access',
  'WhatsApp number',
  'Scan QR code',
  'All done',
]

function StepTracker({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
              i < current ? 'bg-teal text-white' : i === current ? 'bg-teal text-white ring-4 ring-teal/20' : 'bg-pink-light text-charcoal-soft border border-pink-border'
            }`}>
              {i < current ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-[10px] mt-1 font-medium whitespace-nowrap ${i === current ? 'text-teal' : 'text-charcoal-soft'}`}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`h-0.5 w-8 mx-1 mb-4 rounded ${i < current ? 'bg-teal' : 'bg-pink-border'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

export function Onboarding() {
  const nav = useNavigate()
  const [step, setStep] = useState(0)
  const [plans, setPlans] = useState<Plan[]>([])

  // Step 1 — business details
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [autoSlug, setAutoSlug] = useState(true)

  // Step 2 — plan
  const [planId, setPlanId] = useState('')

  // Step 3 — API key
  const [clientId, setClientId] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(true)
  const [copied, setCopied] = useState(false)

  // Step 4 — WhatsApp
  const [waPhone, setWaPhone] = useState('+234')
  const [sessionId, setSessionId] = useState('')
  const [showQR, setShowQR] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { void commsApi.listPlans().then(setPlans).catch(() => null) }, [])
  useEffect(() => {
    if (autoSlug) setSlug(slugify(name))
  }, [name, autoSlug])

  const createBusiness = async () => {
    setLoading(true); setError(null)
    try {
      const client = await commsApi.createClient({
        name, slug, planId,
        contactEmail: email || undefined,
        contactPhone: phone || undefined,
      })
      setClientId(client.id)
      const key = await commsApi.createApiKey(client.id, 'Default key', SCOPES)
      setApiKey(key.key)
      setStep(2)
    } catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong') }
    finally { setLoading(false) }
  }

  const createSession = async () => {
    setLoading(true); setError(null)
    try {
      const s = await commsApi.createSession({ clientId, phoneNumber: waPhone })
      setSessionId(s.id)
      setStep(4)
      setShowQR(true)
    } catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong') }
    finally { setLoading(false) }
  }

  const copy = () => {
    void navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const selectedPlan = plans.find(p => p.id === planId)

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="page-title">Add a business</h1>
        <p className="caption mt-0.5">Set up a new business account in a few steps</p>
      </div>

      <StepTracker current={step} />

      {/* Step 0 — details */}
      {step === 0 && (
        <Glass>
          <h2 className="section-title mb-5">Business details</h2>
          {error && <p className="text-sm text-rose mb-4">{error}</p>}
          <div className="space-y-4">
            <div>
              <label className="label">Business name</label>
              <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Acme Health" />
            </div>
            <div>
              <label className="label">Slug (URL identifier)</label>
              <input
                className="input font-mono text-sm"
                value={slug}
                onChange={e => { setAutoSlug(false); setSlug(e.target.value) }}
                placeholder="acme-health"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Contact email (optional)</label>
                <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@acmehealth.com" />
              </div>
              <div>
                <label className="label">Contact phone (optional)</label>
                <input className="input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+2348012345678" />
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <button className="btn-primary" disabled={!name || !slug} onClick={() => setStep(1)}>
              Next: choose plan
            </button>
          </div>
        </Glass>
      )}

      {/* Step 1 — plan */}
      {step === 1 && (
        <Glass>
          <h2 className="section-title mb-5">Choose a plan for {name}</h2>
          <div className="space-y-3">
            {plans.map(p => (
              <label key={p.id} className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                planId === p.id ? 'border-teal bg-teal/10' : 'border-white/10 bg-white/[0.03] hover:border-teal/40'
              }`}>
                <input type="radio" name="plan" value={p.id} checked={planId === p.id} onChange={() => setPlanId(p.id)} className="mt-1 accent-teal" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-foreground">{p.displayName}</div>
                    <div className="text-sm font-medium text-foreground">
                      {p.monthlyFee ? `₦${p.monthlyFee.toLocaleString()}/mo` : 'Free'}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {p.limits.monthlyMessages ? `${p.limits.monthlyMessages.toLocaleString()} messages/month` : 'Unlimited messages'}
                    {' · '}
                    {p.limits.maxSessions ? `${p.limits.maxSessions} session${p.limits.maxSessions !== 1 ? 's' : ''}` : 'Unlimited sessions'}
                  </div>
                </div>
              </label>
            ))}
          </div>
          <div className="flex gap-2 justify-end mt-6">
            <button className="btn-secondary" onClick={() => setStep(0)}>Back</button>
            <button className="btn-primary" disabled={!planId || loading} onClick={createBusiness}>
              {loading ? 'Setting up…' : 'Create account'}
            </button>
          </div>
          {error && <p className="text-sm text-rose mt-3 text-right">{error}</p>}
        </Glass>
      )}

      {/* Step 2 — API key */}
      {step === 2 && (
        <Glass>
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-teal-light flex items-center justify-center mx-auto mb-3">
              <Check className="w-7 h-7 text-teal" />
            </div>
            <h2 className="section-title">Account created</h2>
            <p className="caption mt-1">{name} is set up on the <span className="font-medium text-charcoal capitalize">{selectedPlan?.name}</span> plan</p>
          </div>

          <div className="p-4 rounded-xl mb-4" style={{ background: 'rgba(74,155,168,0.06)', border: '1px solid rgba(74,155,168,0.15)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-charcoal-soft uppercase tracking-wide">API key — show this once only</span>
              <div className="flex gap-2">
                <button className="btn-ghost py-1 px-2" onClick={() => setShowKey(v => !v)}>
                  {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <button className="btn-ghost py-1 px-2 flex items-center gap-1" onClick={copy}>
                  {copied ? <Check className="w-3.5 h-3.5 text-teal" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="text-xs">{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
            <div className="font-mono text-sm text-charcoal break-all">
              {showKey ? apiKey : '•'.repeat(Math.min(apiKey.length, 40))}
            </div>
          </div>

          <p className="text-xs text-charcoal-soft text-center mb-6">
            Save this key now. You won't be able to see it again after leaving this screen.
          </p>

          <div className="flex justify-end">
            <button className="btn-primary" onClick={() => setStep(3)}>
              Next: connect WhatsApp
            </button>
          </div>
        </Glass>
      )}

      {/* Step 3 — WhatsApp number */}
      {step === 3 && (
        <Glass>
          <h2 className="section-title mb-2">Connect a WhatsApp number</h2>
          <p className="caption mb-5">
            Enter the WhatsApp number {name} will use to send messages. You'll scan a QR code on the next screen.
          </p>
          {error && <p className="text-sm text-rose mb-4">{error}</p>}
          <div>
            <label className="label">WhatsApp number</label>
            <input className="input" value={waPhone} onChange={e => setWaPhone(e.target.value)} placeholder="+2348012345678" />
            <p className="text-xs text-charcoal-soft mt-1.5">Include the country code, e.g. +234 for Nigeria</p>
          </div>
          <div className="flex gap-2 justify-end mt-6">
            <button className="btn-secondary" onClick={() => setStep(2)}>Back</button>
            <button className="btn-primary" disabled={!waPhone || loading} onClick={createSession}>
              {loading ? 'Starting…' : 'Show QR code'}
            </button>
          </div>
        </Glass>
      )}

      {/* Step 4 — QR (shown as modal, we show a waiting state) */}
      {step === 4 && !showQR && (
        <Glass className="text-center py-12">
          <h2 className="section-title mb-2">All done</h2>
          <p className="caption mb-5">{name} is ready. WhatsApp number is connecting.</p>
          <button className="btn-primary" onClick={() => nav('/comms/businesses')}>
            View all businesses
          </button>
        </Glass>
      )}

      {/* Step 5 — complete (after QR connected) */}
      {step === 5 && (
        <Glass className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-teal-light flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-teal" />
          </div>
          <h2 className="section-title mb-2">Everything is ready</h2>
          <p className="caption mb-6">{name} is live. Messages can now be sent through {waPhone}.</p>
          <div className="flex gap-2 justify-center">
            <button className="btn-secondary" onClick={() => nav('/comms/businesses')}>View businesses</button>
            <button className="btn-primary" onClick={() => nav('/comms/sessions')}>View sessions</button>
          </div>
        </Glass>
      )}

      {showQR && sessionId && step === 4 && (
        <QRModal
          sessionId={sessionId}
          phoneNumber={waPhone}
          onClose={() => { setShowQR(false); setStep(5) }}
          onConnected={() => { setShowQR(false); setStep(5) }}
        />
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Copy, Eye, EyeOff, Loader2 } from 'lucide-react'
import { QRModal } from '../../components/QRModal'
import { commsApi, Plan } from '../../lib/comms-api'
import { slugify } from '../../lib/utils'

const SCOPES = ['messages:send', 'sessions:read', 'webhooks:manage']

const STEPS = [
  'Business details',
  'Choose plan',
  'API access',
  'WhatsApp number',
  'Scan QR',
  'All done',
]

function StepTracker({ current }: { current: number }) {
  return (
    <div className="flex items-start mb-10 overflow-x-auto pb-1 gap-0">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-start shrink-0">
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 ${
              i < current
                ? 'bg-teal text-white shadow-[0_0_12px_rgba(74,168,157,0.4)]'
                : i === current
                ? 'bg-teal text-white ring-4 ring-teal/20'
                : 'bg-white/06 text-muted-foreground/50 border border-white/10'
            }`}>
              {i < current ? <Check className="w-3.5 h-3.5" /> : i + 1}
            </div>
            <span className={`text-[10px] mt-1.5 font-medium whitespace-nowrap text-center leading-tight ${
              i === current
                ? 'text-teal'
                : i < current
                ? 'text-muted-foreground/60'
                : 'text-muted-foreground/30'
            }`}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`h-0.5 w-10 mx-1 mt-4 shrink-0 rounded-full transition-all ${
              i < current ? 'bg-teal/50' : 'bg-white/08'
            }`} />
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

  const [name, setName]   = useState('')
  const [slug, setSlug]   = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [autoSlug, setAutoSlug] = useState(true)

  const [planId, setPlanId] = useState('')

  const [clientId, setClientId] = useState('')
  const [apiKey, setApiKey]     = useState('')
  const [showKey, setShowKey]   = useState(true)
  const [copied, setCopied]     = useState(false)

  const [waPhone, setWaPhone]     = useState('+234')
  const [sessionId, setSessionId] = useState('')
  const [showQR, setShowQR]       = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => { void commsApi.listPlans().then(setPlans).catch(() => null) }, [])
  useEffect(() => { if (autoSlug) setSlug(slugify(name)) }, [name, autoSlug])

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
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="page-title">Add a business</h1>
        <p className="caption mt-0.5">Set up a new business account in a few steps</p>
      </div>

      <StepTracker current={step} />

      {/* Step 0 — Business details */}
      {step === 0 && (
        <div className="rounded-2xl border border-white/10 bg-card p-6">
          <h2 className="section-title mb-5">Business details</h2>
          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">{error}</div>
          )}
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
        </div>
      )}

      {/* Step 1 — Plan */}
      {step === 1 && (
        <div className="rounded-2xl border border-white/10 bg-card p-6">
          <h2 className="section-title mb-5">Choose a plan for {name}</h2>
          <div className="space-y-3">
            {plans.map(p => (
              <label key={p.id} className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                planId === p.id
                  ? 'border-teal bg-teal/08'
                  : 'border-white/10 bg-white/[0.02] hover:border-teal/30 hover:bg-white/[0.04]'
              }`}>
                <input type="radio" name="plan" value={p.id} checked={planId === p.id} onChange={() => setPlanId(p.id)} className="mt-1 accent-teal" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold text-foreground truncate">{p.displayName}</div>
                    <div className="text-sm font-medium text-foreground shrink-0">
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
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin inline mr-1.5" />Setting up…</>
                : 'Create account'}
            </button>
          </div>
          {error && <p className="text-sm text-red-400 mt-3 text-right">{error}</p>}
        </div>
      )}

      {/* Step 2 — API key */}
      {step === 2 && (
        <div className="rounded-2xl border border-white/10 bg-card p-6">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-teal/10 border border-teal/20 flex items-center justify-center mx-auto mb-3">
              <Check className="w-7 h-7 text-teal" />
            </div>
            <h2 className="section-title">Account created</h2>
            <p className="caption mt-1">
              {name} is set up on the{' '}
              <span className="font-semibold text-foreground capitalize">{selectedPlan?.name}</span> plan
            </p>
          </div>

          <div className="p-4 rounded-xl mb-4 border" style={{ background: 'rgba(74,168,157,0.05)', borderColor: 'rgba(74,168,157,0.18)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">API key — shown once only</span>
              <div className="flex gap-1.5">
                <button className="btn-ghost py-1 px-2" onClick={() => setShowKey(v => !v)}>
                  {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <button className="btn-ghost py-1 px-2 flex items-center gap-1.5" onClick={copy}>
                  {copied ? <Check className="w-3.5 h-3.5 text-teal" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="text-xs">{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>
            <div className="font-mono text-sm text-foreground break-all leading-relaxed">
              {showKey ? apiKey : '•'.repeat(Math.min(apiKey.length, 40))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center mb-6">
            Save this key now. It won't be visible again after you leave this screen.
          </p>

          <div className="flex justify-end">
            <button className="btn-primary" onClick={() => setStep(3)}>
              Next: connect WhatsApp
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — WhatsApp number */}
      {step === 3 && (
        <div className="rounded-2xl border border-white/10 bg-card p-6">
          <h2 className="section-title mb-2">Connect a WhatsApp number</h2>
          <p className="caption mb-5">
            Enter the WhatsApp number {name} will use to send messages. You'll scan a QR code next.
          </p>
          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">{error}</div>
          )}
          <div>
            <label className="label">WhatsApp number</label>
            <input className="input" value={waPhone} onChange={e => setWaPhone(e.target.value)} placeholder="+2348012345678" />
            <p className="text-xs text-muted-foreground/50 mt-1.5">Include the country code, e.g. +234 for Nigeria</p>
          </div>
          <div className="flex gap-2 justify-end mt-6">
            <button className="btn-secondary" onClick={() => setStep(2)}>Back</button>
            <button className="btn-primary" disabled={!waPhone || loading} onClick={createSession}>
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin inline mr-1.5" />Starting…</>
                : 'Show QR code'}
            </button>
          </div>
        </div>
      )}

      {/* Step 4 — waiting for QR */}
      {step === 4 && !showQR && (
        <div className="rounded-2xl border border-white/10 bg-card px-6 py-14 text-center">
          <h2 className="section-title mb-2">All done</h2>
          <p className="caption mb-6">{name} is ready. WhatsApp number is connecting.</p>
          <button className="btn-primary" onClick={() => nav('/comms/businesses')}>
            View all businesses
          </button>
        </div>
      )}

      {/* Step 5 — complete */}
      {step === 5 && (
        <div className="rounded-2xl border border-white/10 bg-card px-6 py-14 text-center">
          <div className="w-16 h-16 rounded-2xl bg-teal/10 border border-teal/20 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-teal" />
          </div>
          <h2 className="section-title mb-2">Everything is ready</h2>
          <p className="caption mb-6">{name} is live. Messages can now be sent through {waPhone}.</p>
          <div className="flex gap-2 justify-center">
            <button className="btn-secondary" onClick={() => nav('/comms/businesses')}>View businesses</button>
            <button className="btn-primary" onClick={() => nav('/comms/sessions')}>View sessions</button>
          </div>
        </div>
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

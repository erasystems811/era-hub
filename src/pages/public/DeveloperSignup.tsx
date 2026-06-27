import { useState } from 'react'
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { COMMS_API } from '../../lib/config'

const FIELD = "w-full px-3.5 py-2.5 rounded-xl bg-[hsl(262_20%_11%)] border border-white/[0.10] text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-[#4AA89D]/50 focus:ring-2 focus:ring-[#4AA89D]/15 transition-all"
const SELECT = "w-full px-3.5 py-2.5 rounded-xl bg-[hsl(262_20%_11%)] border border-white/[0.10] text-foreground text-sm focus:outline-none focus:border-[#4AA89D]/50 focus:ring-2 focus:ring-[#4AA89D]/15 transition-all appearance-none cursor-pointer"
const LABEL = "text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/70 block mb-1.5"

const PLANS = [
  { slug: 'starter',    name: 'Starter',    desc: 'Up to 1,000 msg/mo · 1 session · Basic API' },
  { slug: 'growth',     name: 'Growth',     desc: 'Up to 10,000 msg/mo · 3 sessions · Webhooks' },
  { slug: 'enterprise', name: 'Enterprise', desc: 'Unlimited · Voice notes · SLA + priority support' },
]

const VOLUMES = [
  { value: 'under_1k',   label: 'Under 1,000 messages/month' },
  { value: '1k_10k',     label: '1,000 – 10,000 messages/month' },
  { value: '10k_100k',   label: '10,000 – 100,000 messages/month' },
  { value: 'over_100k',  label: '100,000+ messages/month' },
]

export function DeveloperSignup() {
  const [businessName,  setBusinessName]  = useState('')
  const [devName,       setDevName]       = useState('')
  const [email,         setEmail]         = useState('')
  const [phone,         setPhone]         = useState('')
  const [description,   setDescription]   = useState('')
  const [volume,        setVolume]        = useState('')
  const [plan,          setPlan]          = useState('growth')
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState('')
  const [success,       setSuccess]       = useState(false)

  const canSubmit = businessName.trim() && devName.trim() && email.trim() && description.trim() && volume && plan

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${COMMS_API}/v1/public/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: 'developer',
          businessName: businessName.trim(),
          developerName: devName.trim(),
          contactEmail: email.trim(),
          contactPhone: phone.trim() || null,
          description: description.trim(),
          expectedVolume: volume,
          planSlug: plan,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }))
        throw new Error((err as { message?: string; error?: string }).message ?? (err as { error?: string }).error ?? 'Submission failed')
      }
      setSuccess(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'hsl(262 22% 6%)', color: '#EDE9F5', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* Backgrounds */}
      <div className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -5%, hsl(175 40% 48% / 0.12) 0%, transparent 70%)' }} />
      <div className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 60% 35% at 50% 110%, hsl(340 35% 61% / 0.07) 0%, transparent 65%)' }} />
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, hsl(175 40% 48% / 0.4) 30%, hsl(340 35% 61% / 0.25) 50%, hsl(175 40% 48% / 0.4) 70%, transparent)' }} />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.018]">
        <div className="absolute w-[600px] h-px" style={{ background: '#EDE9F5' }} />
        <div className="absolute w-px h-[600px]" style={{ background: '#EDE9F5' }} />
        <div className="absolute w-[400px] h-[400px] rounded-full border border-current" />
      </div>

      <div className="w-full max-w-md relative z-10">

        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <img src="/erahub4.png" alt="ERA Systems" className="w-16 h-16 object-contain mb-3" />
          <p className="text-xs font-bold tracking-[0.25em] uppercase" style={{ color: '#EDE9F5' }}>ERA Comms</p>
          <p className="text-[10px] font-medium uppercase tracking-[0.3em] mt-0.5" style={{ color: 'rgba(74,168,157,0.8)' }}>
            Developer Access
          </p>
        </div>

        {success ? (
          <div className="rounded-2xl p-8 text-center"
            style={{ background: 'hsl(262 20% 10%)', border: '1px solid rgba(255,255,255,0.12)', borderTopColor: 'rgba(255,255,255,0.22)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10), 0 20px 60px rgba(0,0,0,0.60)' }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(74,168,157,0.15)' }}>
              <CheckCircle2 className="w-7 h-7" style={{ color: '#4AA89D' }} />
            </div>
            <h2 className="text-lg font-bold mb-2" style={{ color: '#EDE9F5' }}>Request received!</h2>
            <p className="text-sm mb-4" style={{ color: 'rgba(237,233,245,0.55)' }}>
              We'll review your developer request and get back to you within 24 hours at{' '}
              <span style={{ color: '#EDE9F5' }}>{email}</span>.
            </p>
            <p className="text-sm" style={{ color: 'rgba(237,233,245,0.55)' }}>
              On approval, you'll receive your API credentials and documentation via a secure link.
            </p>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="rounded-2xl"
              style={{ background: 'hsl(262 20% 10%)', border: '1px solid rgba(255,255,255,0.12)', borderTopColor: 'rgba(255,255,255,0.22)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10), 0 20px 60px rgba(0,0,0,0.60)' }}>

              <div className="px-6 pt-6 pb-4 border-b" style={{ borderBottomColor: 'rgba(255,255,255,0.07)' }}>
                <p className="text-[9px] font-bold uppercase tracking-[0.25em]" style={{ color: 'rgba(237,233,245,0.35)' }}>Developer request</p>
                <p className="text-sm font-semibold mt-0.5" style={{ color: '#EDE9F5' }}>API & integration access</p>
              </div>

              <div className="p-6 space-y-4">

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={LABEL}>Business / company name</label>
                    <input className={FIELD} value={businessName} onChange={e => setBusinessName(e.target.value)}
                      placeholder="Acme Ltd" required />
                  </div>
                  <div>
                    <label className={LABEL}>Your name</label>
                    <input className={FIELD} value={devName} onChange={e => setDevName(e.target.value)}
                      placeholder="John Doe" required />
                  </div>
                </div>

                <div>
                  <label className={LABEL}>Contact email</label>
                  <input className={FIELD} type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="dev@company.com" required />
                </div>

                <div>
                  <label className={LABEL}>Contact phone <span style={{ color: 'rgba(237,233,245,0.3)', fontWeight: 400, textTransform: 'none', letterSpacing: 'normal' }}>(optional)</span></label>
                  <div className="flex gap-2">
                    <span className="flex items-center px-3 rounded-xl text-sm font-medium shrink-0"
                      style={{ background: 'hsl(262 20% 11%)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(237,233,245,0.5)' }}>
                      +234
                    </span>
                    <input className={FIELD} type="tel" inputMode="numeric" value={phone}
                      onChange={e => { let v = e.target.value.replace(/\D/g, ''); if (v.startsWith('0')) v = v.slice(1); setPhone(v) }}
                      placeholder="801 234 5678" />
                  </div>
                </div>

                <div>
                  <label className={LABEL}>What are you building?</label>
                  <textarea className={FIELD} rows={3} value={description} onChange={e => setDescription(e.target.value)}
                    placeholder="e.g. Hospital appointment reminder system that sends WhatsApp notifications to patients"
                    required style={{ resize: 'none' }} />
                </div>

                <div>
                  <label className={LABEL}>Expected monthly message volume</label>
                  <select className={SELECT} value={volume} onChange={e => setVolume(e.target.value)} required>
                    <option value="">Select expected volume…</option>
                    {VOLUMES.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className={LABEL}>Plan</label>
                  <div className="space-y-2">
                    {PLANS.map(p => (
                      <button key={p.slug} type="button" onClick={() => setPlan(p.slug)}
                        className="w-full text-left p-4 rounded-xl border transition-all"
                        style={{
                          background: plan === p.slug ? 'rgba(74,168,157,0.08)' : 'hsl(262 20% 11%)',
                          borderColor: plan === p.slug ? 'rgba(74,168,157,0.45)' : 'rgba(255,255,255,0.08)',
                        }}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold" style={{ color: plan === p.slug ? '#4AA89D' : '#EDE9F5' }}>{p.name}</p>
                            <p className="text-[11px] mt-0.5" style={{ color: 'rgba(237,233,245,0.4)' }}>{p.desc}</p>
                          </div>
                          <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                            style={{ borderColor: plan === p.slug ? '#4AA89D' : 'rgba(255,255,255,0.2)' }}>
                            {plan === p.slug && <div className="w-2 h-2 rounded-full" style={{ background: '#4AA89D' }} />}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 text-xs rounded-lg px-3 py-2"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    {error}
                  </div>
                )}

                <button type="submit" disabled={!canSubmit || loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-[0.2em] transition-all disabled:opacity-40 disabled:cursor-not-allowed mt-2"
                  style={{ background: '#4AA89D', color: '#fff', boxShadow: '0 4px 20px rgba(74,168,157,0.2)' }}>
                  {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting…</> : 'Submit developer request'}
                </button>
              </div>
            </div>
          </form>
        )}

        <p className="text-center text-[9px] mt-8 uppercase tracking-[0.3em]" style={{ color: 'rgba(237,233,245,0.2)' }}>
          ERA Systems · ERA Comms Platform
        </p>
      </div>
    </div>
  )
}

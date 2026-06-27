import { useState } from 'react'
import { CheckCircle2, AlertCircle, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react'
import { COMMS_API } from '../../lib/config'

const FIELD = "w-full px-3.5 py-2.5 rounded-xl bg-[hsl(262_20%_11%)] border border-white/[0.10] text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-[#BF7C93]/50 focus:ring-2 focus:ring-[#BF7C93]/15 transition-all"
const LABEL = "text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/70 block mb-1.5"

const PLANS = [
  { slug: 'starter',    name: 'Starter',    desc: 'Basic AI messaging', detail: 'Up to 1,000 messages/mo · 1 WhatsApp session' },
  { slug: 'growth',     name: 'Growth',     desc: '+ AI scenarios',     detail: 'Up to 10,000 messages/mo · 3 sessions · Custom flows' },
  { slug: 'enterprise', name: 'Enterprise', desc: 'Unlimited + voice',  detail: 'Unlimited messages · Voice notes · Priority support' },
]

export function AIAgentSignup() {
  const [step, setStep]         = useState(1)
  const [businessName, setBusinessName] = useState('')
  const [description, setDescription]  = useState('')
  const [email, setEmail]       = useState('')
  const [phone, setPhone]       = useState('')
  const [waNumber, setWaNumber] = useState('')
  const [plan, setPlan]         = useState('growth')
  const [confirmed, setConfirmed] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState(false)

  const canNext1 = businessName.trim() && description.trim() && email.trim() && phone.trim()
  const canNext2 = waNumber.trim() && plan

  const submit = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${COMMS_API}/v1/public/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: 'ai_agent',
          businessName: businessName.trim(),
          contactEmail: email.trim(),
          contactPhone: phone.trim(),
          whatsappNumber: waNumber.trim(),
          description: description.trim(),
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
        style={{ background: 'radial-gradient(ellipse 90% 55% at 50% -5%, hsl(340 35% 61% / 0.14) 0%, transparent 70%)' }} />
      <div className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 60% 35% at 50% 110%, hsl(175 40% 48% / 0.08) 0%, transparent 65%)' }} />
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, hsl(340 35% 61% / 0.4) 30%, hsl(175 40% 48% / 0.3) 50%, hsl(340 35% 61% / 0.4) 70%, transparent)' }} />
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
          <p className="text-[10px] font-medium uppercase tracking-[0.3em] mt-0.5" style={{ color: 'rgba(237,233,245,0.45)' }}>AI Agent Setup</p>
        </div>

        {success ? (
          /* Success state */
          <div className="rounded-2xl p-8 text-center"
            style={{ background: 'hsl(262 20% 10%)', border: '1px solid rgba(255,255,255,0.12)', borderTopColor: 'rgba(255,255,255,0.22)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10), 0 20px 60px rgba(0,0,0,0.60)' }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(74,168,157,0.15)' }}>
              <CheckCircle2 className="w-7 h-7" style={{ color: '#4AA89D' }} />
            </div>
            <h2 className="text-lg font-bold mb-2" style={{ color: '#EDE9F5' }}>Application submitted!</h2>
            <p className="text-sm mb-4" style={{ color: 'rgba(237,233,245,0.55)' }}>
              We'll review your application and get back to you within 24 hours at <span style={{ color: '#EDE9F5' }}>{email}</span>.
            </p>
            <p className="text-sm" style={{ color: 'rgba(237,233,245,0.55)' }}>
              Once approved, you'll receive a WhatsApp message on <span style={{ color: '#EDE9F5' }}>{phone}</span> with next steps.
            </p>
          </div>
        ) : (
          <>
            {/* Step pills */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {[1, 2, 3].map(s => (
                <div key={s} className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all"
                    style={{
                      background: s === step ? '#BF7C93' : s < step ? 'rgba(191,124,147,0.25)' : 'rgba(255,255,255,0.07)',
                      color: s === step ? '#fff' : s < step ? '#BF7C93' : 'rgba(237,233,245,0.35)',
                    }}>
                    {s < step ? <CheckCircle2 className="w-3.5 h-3.5" /> : s}
                  </div>
                  {s < 3 && <div className="w-8 h-px" style={{ background: s < step ? 'rgba(191,124,147,0.4)' : 'rgba(255,255,255,0.08)' }} />}
                </div>
              ))}
            </div>

            <div className="rounded-2xl"
              style={{ background: 'hsl(262 20% 10%)', border: '1px solid rgba(255,255,255,0.12)', borderTopColor: 'rgba(255,255,255,0.22)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10), 0 20px 60px rgba(0,0,0,0.60)' }}>

              {/* Step header */}
              <div className="px-6 pt-6 pb-4 border-b" style={{ borderBottomColor: 'rgba(255,255,255,0.07)' }}>
                <p className="text-[9px] font-bold uppercase tracking-[0.25em]" style={{ color: 'rgba(237,233,245,0.35)' }}>
                  Step {step} of 3
                </p>
                <p className="text-sm font-semibold mt-0.5" style={{ color: '#EDE9F5' }}>
                  {step === 1 ? 'About your business' : step === 2 ? 'Your WhatsApp number' : 'Review & submit'}
                </p>
              </div>

              <div className="p-6 space-y-4">

                {/* STEP 1 */}
                {step === 1 && (
                  <>
                    <div>
                      <label className={LABEL}>Business name</label>
                      <input className={FIELD} value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="e.g. Lagos Fashion Store" required />
                    </div>
                    <div>
                      <label className={LABEL}>What does your business do?</label>
                      <textarea className={FIELD} rows={3} value={description} onChange={e => setDescription(e.target.value)}
                        placeholder="e.g. We sell fashion items and take orders via WhatsApp" required style={{ resize: 'none' }} />
                    </div>
                    <div>
                      <label className={LABEL}>Contact email</label>
                      <input className={FIELD} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@business.com" required />
                    </div>
                    <div>
                      <label className={LABEL}>Contact phone</label>
                      <div className="flex gap-2">
                        <span className="flex items-center px-3 rounded-xl text-sm font-medium shrink-0"
                          style={{ background: 'hsl(262 20% 11%)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(237,233,245,0.5)' }}>
                          +234
                        </span>
                        <input className={FIELD} type="tel" inputMode="numeric" value={phone}
                          onChange={e => { let v = e.target.value.replace(/\D/g, ''); if (v.startsWith('0')) v = v.slice(1); setPhone(v) }}
                          placeholder="801 234 5678" required />
                      </div>
                    </div>
                  </>
                )}

                {/* STEP 2 */}
                {step === 2 && (
                  <>
                    <div>
                      <label className={LABEL}>WhatsApp number to connect</label>
                      <div className="flex gap-2">
                        <span className="flex items-center px-3 rounded-xl text-sm font-medium shrink-0"
                          style={{ background: 'hsl(262 20% 11%)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(237,233,245,0.5)' }}>
                          +234
                        </span>
                        <input className={FIELD} type="tel" inputMode="numeric" value={waNumber}
                          onChange={e => { let v = e.target.value.replace(/\D/g, ''); if (v.startsWith('0')) v = v.slice(1); setWaNumber(v) }}
                          placeholder="801 234 5678" required />
                      </div>
                      <p className="text-[11px] mt-2" style={{ color: 'rgba(237,233,245,0.4)' }}>
                        This is the number your customers will message. You'll receive a verification code on this number.
                      </p>
                    </div>

                    <div>
                      <label className={LABEL}>Preferred plan</label>
                      <div className="space-y-2">
                        {PLANS.map(p => (
                          <button key={p.slug} type="button" onClick={() => setPlan(p.slug)}
                            className="w-full text-left p-4 rounded-xl border transition-all"
                            style={{
                              background: plan === p.slug ? 'rgba(191,124,147,0.08)' : 'hsl(262 20% 11%)',
                              borderColor: plan === p.slug ? 'rgba(191,124,147,0.45)' : 'rgba(255,255,255,0.08)',
                            }}>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-semibold" style={{ color: plan === p.slug ? '#BF7C93' : '#EDE9F5' }}>{p.name}</p>
                                <p className="text-xs mt-0.5" style={{ color: 'rgba(237,233,245,0.45)' }}>{p.desc}</p>
                              </div>
                              <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                                style={{ borderColor: plan === p.slug ? '#BF7C93' : 'rgba(255,255,255,0.2)' }}>
                                {plan === p.slug && <div className="w-2 h-2 rounded-full" style={{ background: '#BF7C93' }} />}
                              </div>
                            </div>
                            <p className="text-[11px] mt-1.5" style={{ color: 'rgba(237,233,245,0.35)' }}>{p.detail}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* STEP 3 */}
                {step === 3 && (
                  <>
                    <div className="rounded-xl p-4 space-y-3" style={{ background: 'hsl(262 20% 8%)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <p className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: 'rgba(237,233,245,0.35)' }}>Review your application</p>
                      {[
                        { label: 'Business', value: businessName },
                        { label: 'Description', value: description },
                        { label: 'Contact email', value: email },
                        { label: 'Contact phone', value: `+234 ${phone}` },
                        { label: 'WhatsApp number', value: `+234 ${waNumber}` },
                        { label: 'Plan', value: PLANS.find(p => p.slug === plan)?.name ?? plan },
                      ].map(row => (
                        <div key={row.label}>
                          <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'rgba(237,233,245,0.4)' }}>{row.label}</p>
                          <p className="text-sm mt-0.5" style={{ color: '#EDE9F5' }}>{row.value}</p>
                        </div>
                      ))}
                    </div>

                    <label className="flex items-start gap-3 cursor-pointer select-none">
                      <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)}
                        className="mt-0.5 shrink-0 w-4 h-4 rounded accent-[#BF7C93]" />
                      <span className="text-xs" style={{ color: 'rgba(237,233,245,0.6)' }}>
                        I confirm this information is correct and I am authorised to connect this WhatsApp number.
                      </span>
                    </label>

                    {error && (
                      <div className="flex items-start gap-2 text-xs rounded-lg px-3 py-2"
                        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        {error}
                      </div>
                    )}
                  </>
                )}

                {/* Navigation */}
                <div className={`flex gap-2 pt-1 ${step > 1 ? 'justify-between' : 'justify-end'}`}>
                  {step > 1 && (
                    <button type="button" onClick={() => setStep(s => s - 1)}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-[0.2em] transition-all"
                      style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(237,233,245,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <ChevronLeft className="w-3.5 h-3.5" /> Back
                    </button>
                  )}
                  {step < 3 ? (
                    <button type="button"
                      disabled={step === 1 ? !canNext1 : !canNext2}
                      onClick={() => setStep(s => s + 1)}
                      className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-[0.2em] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: '#BF7C93', color: '#fff', boxShadow: '0 4px 20px rgba(191,124,147,0.25)' }}>
                      Continue <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button type="button"
                      disabled={!confirmed || loading}
                      onClick={submit}
                      className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-[0.2em] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: '#BF7C93', color: '#fff', boxShadow: '0 4px 20px rgba(191,124,147,0.25)' }}>
                      {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting…</> : 'Submit application'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        <p className="text-center text-[9px] mt-8 uppercase tracking-[0.3em]" style={{ color: 'rgba(237,233,245,0.2)' }}>
          ERA Systems · ERA Comms Platform
        </p>
      </div>
    </div>
  )
}

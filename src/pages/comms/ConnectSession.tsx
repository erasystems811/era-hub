import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Wifi, CheckCircle2, AlertCircle, Loader2, ChevronLeft, Mail } from 'lucide-react'
import { commsApi, Client } from '../../lib/comms-api'

type Step = 'send' | 'verify' | 'done'

const FIELD = "w-full px-3.5 py-2.5 rounded-xl bg-[hsl(262_20%_11%)] border border-white/[0.10] text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all"
const LABEL = "text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-1.5 block"

export function ConnectSession() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselectedId = searchParams.get('businessId') ?? ''

  const [clients, setClients]           = useState<Client[]>([])
  const [clientsLoading, setClientsLoading] = useState(true)
  const [selectedId, setSelectedId]     = useState(preselectedId)
  const [phone, setPhone]               = useState('')
  const [email, setEmail]               = useState('')
  const [otpId, setOtpId]               = useState('')
  const [code, setCode]                 = useState('')
  const [step, setStep]                 = useState<Step>('send')
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    commsApi.listClients()
      .then(c => { setClients(c); if (!preselectedId && c.length) setSelectedId(c[0].id) })
      .finally(() => setClientsLoading(false))
  }, [preselectedId])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown(v => v - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  const sendOtp = async () => {
    if (!phone.trim() || !email.trim()) return
    setError(null); setLoading(true)
    try {
      const { otpId: id } = await commsApi.sendOtp(phone.trim(), email.trim())
      setOtpId(id)
      setStep('verify')
      setResendCooldown(60)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send OTP')
    } finally { setLoading(false) }
  }

  const verifyOtp = async () => {
    if (code.length !== 6) return
    setError(null); setLoading(true)
    try {
      await commsApi.verifyOtp(otpId, code)
      setStep('done')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid or expired code')
    } finally { setLoading(false) }
  }

  const resend = async () => {
    if (resendCooldown > 0) return
    setError(null); setLoading(true)
    try {
      const { otpId: id } = await commsApi.sendOtp(phone.trim(), email.trim())
      setOtpId(id)
      setResendCooldown(60)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to resend OTP')
    } finally { setLoading(false) }
  }

  const reset = () => {
    setStep('send'); setCode(''); setOtpId(''); setError(null); setPhone(''); setEmail('')
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-8">
        <h1 className="page-title">Connect WhatsApp</h1>
        <p className="caption mt-1">Verify the business WhatsApp number via OTP</p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-6">
        {(['send', 'verify', 'done'] as Step[]).map((s, i) => {
          const active  = step === s
          const done    = (step === 'verify' && i === 0) || step === 'done'
          const label   = ['Send OTP', 'Verify', 'Connected'][i]
          return (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                done   ? 'bg-teal text-white' :
                active ? 'bg-primary text-white' :
                'bg-white/10 text-muted-foreground'
              }`}>
                {done ? '✓' : i + 1}
              </div>
              <span className={`text-xs font-medium ${active ? 'text-foreground' : 'text-muted-foreground/50'}`}>{label}</span>
              {i < 2 && <div className="w-8 h-px bg-white/10 mx-1" />}
            </div>
          )
        })}
      </div>

      {/* ── STATE 1: SEND OTP ── */}
      {step === 'send' && (
        <div className="rounded-2xl border border-white/07 bg-card p-6 space-y-5">
          <div>
            <label className={LABEL}>Business</label>
            {clientsLoading ? (
              <div className="h-10 rounded-xl bg-white/05 animate-pulse" />
            ) : (
              <select className={FIELD} value={selectedId} onChange={e => setSelectedId(e.target.value)}>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
          </div>

          <div>
            <label className={LABEL}>WhatsApp number to connect</label>
            <input
              className={FIELD}
              type="tel"
              placeholder="+234 800 000 0000"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
          </div>

          <div>
            <label className={LABEL}>Email address to receive code</label>
            <input
              className={FIELD}
              type="email"
              placeholder="owner@business.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') void sendOtp() }}
            />
            <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1.5">
              <Mail className="w-3 h-3 shrink-0" />
              The 6-digit verification code will be emailed here
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/08 px-4 py-3 flex gap-2 items-center">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          <button
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            disabled={!phone.trim() || !email.trim() || loading || clientsLoading}
            onClick={sendOtp}
          >
            {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending…</> : 'Send verification code'}
          </button>
        </div>
      )}

      {/* ── STATE 2: VERIFY OTP ── */}
      {step === 'verify' && (
        <div className="rounded-2xl border border-white/07 bg-card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-1">Code sent to</p>
              <p className="text-sm font-mono text-foreground">{email}</p>
              <p className="text-xs text-muted-foreground mt-0.5">for number {phone}</p>
            </div>
            <button onClick={() => { setStep('send'); setError(null); setCode('') }}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition">
              <ChevronLeft className="w-3 h-3" /> Edit
            </button>
          </div>

          <div>
            <label className={LABEL}>Enter 6-digit code</label>
            <input
              className={`${FIELD} text-center text-3xl font-mono tracking-[0.5em] py-4`}
              type="number"
              inputMode="numeric"
              maxLength={6}
              placeholder="––––––"
              value={code}
              autoFocus
              onChange={e => {
                const v = e.target.value.replace(/\D/g, '').slice(0, 6)
                setCode(v)
              }}
              onKeyDown={e => { if (e.key === 'Enter' && code.length === 6) void verifyOtp() }}
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/08 px-4 py-3 flex gap-2 items-center">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          <button
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            disabled={code.length !== 6 || loading}
            onClick={verifyOtp}
          >
            {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying…</> : 'Verify code'}
          </button>

          <div className="text-center">
            <button
              onClick={resend}
              disabled={resendCooldown > 0 || loading}
              className="text-xs text-muted-foreground/50 hover:text-muted-foreground disabled:cursor-not-allowed transition"
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
            </button>
          </div>
        </div>
      )}

      {/* ── STATE 3: CONNECTED ── */}
      {step === 'done' && (
        <div className="rounded-2xl border border-teal/20 bg-teal/05 p-8 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-teal/15 flex items-center justify-center animate-pulse">
            <CheckCircle2 className="w-8 h-8 text-teal" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground mb-1">WhatsApp number connected!</p>
            <p className="font-mono text-sm text-teal mb-3">{phone}</p>
            <p className="text-sm text-muted-foreground">The session is now active and ready to receive messages.</p>
          </div>
          <div className="flex gap-3 w-full mt-2">
            <button
              className="flex-1 py-2.5 rounded-xl border border-teal/25 text-teal text-sm font-semibold hover:bg-teal/10 transition"
              onClick={() => navigate('/comms/sessions')}
            >
              <Wifi className="w-4 h-4 inline mr-1.5" />
              View in Sessions
            </button>
            <button
              className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition"
              onClick={reset}
            >
              Connect another
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

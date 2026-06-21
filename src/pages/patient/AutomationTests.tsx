import { useState } from 'react'
import { Send, CheckCircle2, XCircle, Loader2, Phone, Mail, FlaskConical } from 'lucide-react'
import { patientApi } from '../../lib/patient-api'

type TestResult = {
  id: number
  type: 'sms' | 'email'
  target: string
  status: 'ok' | 'failed'
  detail: string
  at: Date
}

let resultId = 0

export function AutomationTests() {
  // SMS test state
  const [smsTo,     setSmsTo]     = useState('')
  const [smsSender, setSmsSender] = useState('')
  const [smsLoading, setSmsLoading] = useState(false)

  // Email test state
  const [emailTo,      setEmailTo]      = useState('')
  const [emailLoading, setEmailLoading] = useState(false)

  // Shared result log (this session only)
  const [results, setResults] = useState<TestResult[]>([])

  const addResult = (r: Omit<TestResult, 'id' | 'at'>) =>
    setResults(prev => [{ ...r, id: ++resultId, at: new Date() }, ...prev])

  const runSms = async () => {
    if (!smsTo.trim()) return
    setSmsLoading(true)
    try {
      const res = await patientApi.testSms(smsTo.trim(), smsSender.trim() || undefined)
      addResult({ type: 'sms', target: smsTo.trim(), status: 'ok', detail: res.detail || 'Sent successfully' })
    } catch (e: unknown) {
      addResult({ type: 'sms', target: smsTo.trim(), status: 'failed', detail: e instanceof Error ? e.message : 'Send failed' })
    } finally {
      setSmsLoading(false)
    }
  }

  const runEmail = async () => {
    if (!emailTo.trim()) return
    setEmailLoading(true)
    try {
      const res = await patientApi.testEmail(emailTo.trim())
      if (res.error) {
        addResult({ type: 'email', target: emailTo.trim(), status: 'failed', detail: res.error })
      } else {
        addResult({ type: 'email', target: emailTo.trim(), status: 'ok', detail: res.from ? `Sent from ${res.from}` : 'Sent successfully' })
      }
    } catch (e: unknown) {
      addResult({ type: 'email', target: emailTo.trim(), status: 'failed', detail: e instanceof Error ? e.message : 'Send failed' })
    } finally {
      setEmailLoading(false)
    }
  }

  const INPUT_CLS = 'w-full px-3.5 py-2.5 rounded-xl bg-[hsl(262_20%_11%)] border border-white/[0.10] text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-teal/50 focus:ring-2 focus:ring-teal/15 transition-all'
  const LABEL_CLS = 'text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-1.5 block'

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <FlaskConical className="w-5 h-5 text-teal" />
          <h1 className="page-title">Automation Tests</h1>
        </div>
        <p className="caption">Manually fire test messages to verify your SMS and email channels are working</p>
      </div>

      <div className="space-y-4">
        {/* SMS Test Card */}
        <div className="rounded-2xl border border-white/07 bg-card p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(74,168,157,0.12)' }}>
              <Phone className="w-4 h-4 text-teal" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Test SMS</p>
              <p className="text-xs text-muted-foreground">Send a test SMS via the ERA Patient gateway</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className={LABEL_CLS}>Phone number</label>
              <input
                className={INPUT_CLS}
                placeholder="+234 800 000 0000"
                value={smsTo}
                onChange={e => setSmsTo(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !smsLoading && void runSms()}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>Sender ID <span className="text-muted-foreground/40 normal-case font-normal">(optional — leave blank for default)</span></label>
              <input
                className={INPUT_CLS}
                placeholder="ERA Patient"
                value={smsSender}
                onChange={e => setSmsSender(e.target.value)}
              />
            </div>
            <button
              onClick={() => void runSms()}
              disabled={smsLoading || !smsTo.trim()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'rgba(74,168,157,0.18)', color: '#4AA89D' }}
            >
              {smsLoading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Send className="w-4 h-4" />}
              {smsLoading ? 'Sending…' : 'Send test SMS'}
            </button>
          </div>
        </div>

        {/* Email Test Card */}
        <div className="rounded-2xl border border-white/07 bg-card p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(74,168,157,0.12)' }}>
              <Mail className="w-4 h-4 text-teal" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Test Email</p>
              <p className="text-xs text-muted-foreground">Send a test email via the ERA Patient mailer</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className={LABEL_CLS}>Email address</label>
              <input
                type="email"
                className={INPUT_CLS}
                placeholder="you@example.com"
                value={emailTo}
                onChange={e => setEmailTo(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !emailLoading && void runEmail()}
              />
            </div>
            <button
              onClick={() => void runEmail()}
              disabled={emailLoading || !emailTo.trim()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'rgba(74,168,157,0.18)', color: '#4AA89D' }}
            >
              {emailLoading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Send className="w-4 h-4" />}
              {emailLoading ? 'Sending…' : 'Send test email'}
            </button>
          </div>
        </div>

        {/* Session results */}
        {results.length > 0 && (
          <div className="rounded-2xl border border-white/07 bg-card overflow-hidden">
            <div className="px-5 py-3.5 border-b border-white/07 flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Test results this session</p>
              <button
                onClick={() => setResults([])}
                className="text-[10px] text-muted-foreground/40 hover:text-muted-foreground transition"
              >
                Clear
              </button>
            </div>
            <div className="divide-y divide-white/05">
              {results.map(r => (
                <div key={r.id} className="px-5 py-3.5 flex items-start gap-3">
                  {r.status === 'ok'
                    ? <CheckCircle2 className="w-4 h-4 text-teal shrink-0 mt-0.5" />
                    : <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                        style={{ background: 'rgba(74,168,157,0.1)', color: '#4AA89D' }}>
                        {r.type}
                      </span>
                      <span className="text-sm text-foreground font-medium truncate">{r.target}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{r.detail}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground/40 shrink-0 whitespace-nowrap">
                    {r.at.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

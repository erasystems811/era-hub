import { useState } from 'react'
import {
  MessageSquare, Clock, CalendarClock, AlertCircle, HeartPulse,
  Activity, Star, RefreshCw, Gift,
  Send, Phone, Mail, FlaskConical, CheckCircle2, XCircle, Loader2,
} from 'lucide-react'
import { patientApi } from '../../lib/patient-api'

// ── Automation library ────────────────────────────────────────

const AUTOMATIONS = [
  {
    icon: MessageSquare,
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    trigger: 'Patient joins queue',
    title: 'Queue Position SMS',
    desc: 'Instant SMS with their queue position. Patients wait anywhere — not at reception.',
    channel: 'SMS',
    timing: 'Instant',
  },
  {
    icon: Clock,
    color: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    trigger: 'Waiting 45+ minutes',
    title: 'Long Wait Apology',
    desc: 'Automatic apology SMS to any patient waiting too long — no staff involvement.',
    channel: 'SMS',
    timing: 'After 45 min',
  },
  {
    icon: CalendarClock,
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    trigger: 'Appointment booked',
    title: 'Appointment Reminders',
    desc: 'Confirmation when booked. Reminder 24h before. Final nudge 2h before.',
    channel: 'Email',
    timing: '24h + 2h before',
  },
  {
    icon: AlertCircle,
    color: 'text-red-400 bg-red-500/10 border-red-500/20',
    trigger: 'Patient misses appointment',
    title: 'No-Show Follow-up',
    desc: '"We noticed you couldn\'t make it — just checking you\'re okay." Sent 1 hour after.',
    channel: 'Email',
    timing: '1h after miss',
  },
  {
    icon: HeartPulse,
    color: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    trigger: 'Care plan activated',
    title: 'Care Plan Delivery',
    desc: 'SMS tells patient to check their email. Full care plan email sent 20 min later.',
    channel: 'SMS → Email',
    timing: 'Instant + 20 min',
  },
  {
    icon: Activity,
    color: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
    trigger: 'Treatment ends',
    title: 'Post-Treatment Check-ins',
    desc: 'Warm check-in emails on Day 1, Day 4, and Day 7 after treatment.',
    channel: 'Email',
    timing: 'Day 1 · 4 · 7',
  },
  {
    icon: Star,
    color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    trigger: 'Day after visit',
    title: 'Feedback Request',
    desc: 'Automatic rating request sent the next morning. No staff needed to chase it.',
    channel: 'Email',
    timing: 'Next morning',
  },
  {
    icon: RefreshCw,
    color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    trigger: '30 days since last visit',
    title: 'Wellness Re-engagement',
    desc: '"It\'s been a while — just checking in." Brings dormant patients back automatically.',
    channel: 'Email',
    timing: 'After 30 days',
  },
  {
    icon: Gift,
    color: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
    trigger: "Patient's birthday",
    title: 'Birthday Email',
    desc: "A warm, personalised birthday message — crafted for each hospital's personality.",
    channel: 'Email',
    timing: 'Every year',
  },
]

// ── Test result log ───────────────────────────────────────────

type TestResult = {
  id: number
  type: 'sms' | 'email'
  target: string
  status: 'ok' | 'failed'
  detail: string
  at: Date
}

let _id = 0

const INPUT_CLS = 'w-full px-3.5 py-2.5 rounded-xl bg-[hsl(262_20%_11%)] border border-white/[0.10] text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-teal/50 focus:ring-2 focus:ring-teal/15 transition-all'
const LABEL_CLS = 'text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-1.5 block'

export function AutomationTests() {
  // SMS
  const [smsTo,      setSmsTo]      = useState('')
  const [smsSender,  setSmsSender]  = useState('')
  const [smsLoading, setSmsLoading] = useState(false)

  // Email
  const [emailTo,      setEmailTo]      = useState('')
  const [emailLoading, setEmailLoading] = useState(false)

  // Results
  const [results, setResults] = useState<TestResult[]>([])

  const addResult = (r: Omit<TestResult, 'id' | 'at'>) =>
    setResults(prev => [{ ...r, id: ++_id, at: new Date() }, ...prev])

  const runSms = async () => {
    if (!smsTo.trim()) return
    setSmsLoading(true)
    try {
      const res = await patientApi.testSms(smsTo.trim(), smsSender.trim() || undefined)
      addResult({ type: 'sms', target: smsTo.trim(), status: 'ok', detail: res.detail || 'Sent successfully' })
    } catch (e) {
      addResult({ type: 'sms', target: smsTo.trim(), status: 'failed', detail: e instanceof Error ? e.message : 'Send failed' })
    } finally { setSmsLoading(false) }
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
    } catch (e) {
      addResult({ type: 'email', target: emailTo.trim(), status: 'failed', detail: e instanceof Error ? e.message : 'Send failed' })
    } finally { setEmailLoading(false) }
  }

  return (
    <div className="max-w-5xl space-y-10">

      {/* ── Section 1: Automation Library ── */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <FlaskConical className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="page-title leading-none">Automation Engine</h1>
          </div>
        </div>
        <p className="caption mb-6">
          Every patient touchpoint — from queue join to birthday — handled automatically.
          No manual follow-ups. No missed messages. No extra staff.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {AUTOMATIONS.map(a => (
            <div key={a.title} className="rounded-xl border border-white/07 bg-card p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${a.color}`}>
                  <a.icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground leading-snug">{a.title}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5 truncate">{a.trigger}</p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">{a.desc}</p>

              <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/06 border border-white/08 text-muted-foreground font-medium">
                  {a.channel}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/06 border border-white/08 text-muted-foreground">
                  {a.timing}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-white/07" />
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50">Test Channels</span>
        <div className="flex-1 h-px bg-white/07" />
      </div>

      {/* ── Section 2: Test Cards ── */}
      <div>
        <p className="caption mb-5">
          Manually fire test messages to verify your SMS and email channels are working correctly.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Test SMS */}
          <div className="rounded-2xl border border-white/07 bg-card p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-teal/10 border border-teal/20 shrink-0">
                <Phone className="w-4 h-4 text-teal" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Test SMS</p>
                <p className="text-xs text-muted-foreground">Send via ERA Patient gateway</p>
              </div>
            </div>

            <div className="space-y-3">
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
                <label className={LABEL_CLS}>
                  Sender ID
                  <span className="text-muted-foreground/40 normal-case font-normal ml-1">(optional)</span>
                </label>
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
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-teal/15 text-teal hover:bg-teal/25"
              >
                {smsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {smsLoading ? 'Sending…' : 'Send test SMS'}
              </button>
            </div>
          </div>

          {/* Test Email */}
          <div className="rounded-2xl border border-white/07 bg-card p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary/10 border border-primary/20 shrink-0">
                <Mail className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Test Email</p>
                <p className="text-xs text-muted-foreground">Send via ERA Patient mailer</p>
              </div>
            </div>

            <div className="space-y-3">
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
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-primary/15 text-primary hover:bg-primary/25"
              >
                {emailLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {emailLoading ? 'Sending…' : 'Send test email'}
              </button>
            </div>
          </div>
        </div>

        {/* Results log */}
        {results.length > 0 && (
          <div className="mt-4 rounded-2xl border border-white/07 bg-card overflow-hidden">
            <div className="px-5 py-3.5 border-b border-white/07 flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Test results this session
              </p>
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
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${r.type === 'sms' ? 'bg-teal/12 text-teal' : 'bg-primary/12 text-primary'}`}>
                        {r.type.toUpperCase()}
                      </span>
                      <span className="text-sm text-foreground font-medium truncate">{r.target}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{r.detail}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground/40 shrink-0 whitespace-nowrap tabular-nums">
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

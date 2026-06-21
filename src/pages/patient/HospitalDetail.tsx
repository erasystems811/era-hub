import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, RefreshCw, CheckCircle2, XCircle, Wallet, Settings, Zap, Layers, Loader2, Copy, Check } from 'lucide-react'
import { patientApi, Hospital, HospitalSettings, HospitalModules, WalletInfo } from '../../lib/patient-api'
import { fmtDate, fmtMoney, fmtDateTime } from '../../lib/utils'

type Tab = 'overview' | 'settings' | 'modules' | 'automation' | 'wallet'

function Field({ label, value, mono }: { label: string; value?: string | null | number | boolean; mono?: boolean }) {
  const display = value === true ? 'Enabled' : value === false ? 'Disabled' : (value ?? null)
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-1">{label}</p>
      {display !== null
        ? <p className={`text-sm text-foreground break-all ${mono ? 'font-mono' : ''}`}>{String(display)}</p>
        : <p className="text-sm text-muted-foreground/40">—</p>}
    </div>
  )
}

function CopyField({ label, value }: { label: string; value?: string | null }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    if (!value) return
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-1">{label}</p>
      <div className="flex items-center gap-2 group">
        <p className="text-sm text-foreground font-mono flex-1 min-w-0 truncate">{value ?? '—'}</p>
        {value && (
          <button onClick={copy} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-teal">
            {copied ? <Check className="w-3.5 h-3.5 text-teal" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
    </div>
  )
}

function Toggle({ label, sub, checked, onChange }: { label: string; sub?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-4 py-3.5 cursor-pointer select-none border-b border-white/06 last:border-0">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      <div
        className={`relative w-10 h-6 rounded-full transition-colors duration-200 shrink-0 ${checked ? 'bg-teal' : 'bg-white/10'}`}
        onClick={() => onChange(!checked)}
      >
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${checked ? 'left-5' : 'left-1'}`} />
      </div>
    </label>
  )
}

export function HospitalDetail() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const [tab, setTab] = useState<Tab>('overview')
  const [hospital, setHospital] = useState<Hospital | null>(null)
  const [settings, setSettings] = useState<HospitalSettings | null>(null)
  const [modules, setModules] = useState<HospitalModules | null>(null)
  const [wallet, setWallet] = useState<WalletInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [creditAmount, setCreditAmount] = useState('')
  const [creditNote, setCreditNote] = useState('')
  const [creditLoading, setCreditLoading] = useState(false)
  const [regenResult, setRegenResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const hId = Number(id)

  const load = async () => {
    setLoading(true)
    try {
      const [h, s, m, w] = await Promise.all([
        patientApi.getHospital(hId),
        patientApi.getSettings(hId),
        patientApi.getModules(hId),
        patientApi.getHospitalWallet(hId),
      ])
      setHospital(h); setSettings(s); setModules(m); setWallet(w)
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not load hospital') }
    finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [hId])

  const toggleModule = async (key: keyof HospitalModules, val: boolean) => {
    if (!modules) return
    setSaving(true)
    try { setModules(await patientApi.updateModules(hId, { [key]: val })) }
    finally { setSaving(false) }
  }

  const toggleActive = async () => {
    if (!hospital) return
    setSaving(true)
    try { setHospital(await patientApi.updateHospital(hId, { active: !hospital.active })) }
    finally { setSaving(false) }
  }

  const regenPassword = async () => {
    setSaving(true)
    try { const { newPassword } = await patientApi.regeneratePassword(hId); setRegenResult(newPassword) }
    finally { setSaving(false) }
  }

  const credit = async () => {
    const amount = parseFloat(creditAmount)
    if (!amount || isNaN(amount)) return
    setCreditLoading(true)
    try {
      await patientApi.creditHospitalWallet(hId, amount, creditNote || 'Manual credit')
      setCreditAmount(''); setCreditNote('')
      setWallet(await patientApi.getHospitalWallet(hId))
    } finally { setCreditLoading(false) }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-24 gap-2 text-muted-foreground">
      <Loader2 className="w-4 h-4 animate-spin" /> Loading hospital…
    </div>
  )

  if (error || !hospital) return (
    <div className="rounded-2xl border border-white/07 bg-card flex flex-col items-center justify-center py-16 gap-4 max-w-md mx-auto text-center">
      <XCircle className="w-10 h-10 text-red-400/40" />
      <div>
        <p className="font-semibold text-foreground">{error ?? 'Hospital not found'}</p>
        <p className="text-sm text-muted-foreground mt-1">This hospital may have been removed or the ID is incorrect</p>
      </div>
      <button className="btn-secondary" onClick={() => nav('/patient/hospitals')}>← Back to hospitals</button>
    </div>
  )

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview',   label: 'Overview',   icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    { key: 'settings',   label: 'Settings',   icon: <Settings className="w-3.5 h-3.5" /> },
    { key: 'modules',    label: 'Modules',    icon: <Layers className="w-3.5 h-3.5" /> },
    { key: 'automation', label: 'Automation', icon: <Zap className="w-3.5 h-3.5" /> },
    { key: 'wallet',     label: 'Wallet',     icon: <Wallet className="w-3.5 h-3.5" /> },
  ]

  const statusBadge = hospital.active
    ? 'bg-teal/10 text-teal border-teal/20'
    : 'bg-red-500/10 text-red-400 border-red-500/20'

  return (
    <div className="max-w-4xl">
      {/* Back */}
      <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition mb-5 -ml-1"
        onClick={() => nav('/patient/hospitals')}>
        <ArrowLeft className="w-4 h-4" /> All hospitals
      </button>

      {/* Header card */}
      <div className="rounded-2xl border border-white/07 bg-card px-6 py-5 mb-5 flex items-start justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-teal/10 text-teal text-lg font-bold flex items-center justify-center shrink-0">
            {hospital.name[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-foreground truncate">{hospital.name}</h1>
              <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${statusBadge}`}>
                {hospital.active ? 'Active' : 'Suspended'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {hospital.username} · {hospital.patientCount.toLocaleString()} patients
            </p>
          </div>
        </div>
        <button
          className={hospital.active ? 'btn-secondary text-sm' : 'btn-teal text-sm'}
          style={hospital.active ? { color: '#CF738A', borderColor: 'rgba(207,115,138,0.3)' } : {}}
          onClick={toggleActive}
          disabled={saving}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : hospital.active ? 'Suspend access' : 'Restore access'}
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-5 rounded-xl border border-white/07 bg-card p-1 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key ? 'bg-teal text-white shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-white/05'
            }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/07 bg-card p-6">
            <h3 className="text-sm font-semibold text-foreground mb-5">Account details</h3>
            <div className="space-y-4">
              <Field label="Subscription" value={hospital.subscriptionStatus} />
              <Field label="Expires" value={fmtDate(hospital.subscriptionExpiresAt)} />
              <Field label="Registered" value={fmtDate(hospital.createdAt)} />
              <Field label="Contact email" value={hospital.contactEmail} />
              <Field label="Contact phone" value={hospital.contactPhone} />
              <Field label="Hospital code" value={hospital.hospitalCode} />
            </div>
          </div>

          <div className="rounded-2xl border border-white/07 bg-card p-6">
            <h3 className="text-sm font-semibold text-foreground mb-5">Login credentials</h3>
            <div className="space-y-4">
              <CopyField label="Admin username" value={hospital.username} />
              <CopyField label="Admin password" value={hospital.currentPassword} />
              {hospital.staffCredentials && (
                <>
                  <div className="border-t border-white/06 pt-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-3">Staff credentials</p>
                    <div className="space-y-3">
                      <CopyField label="Nurse username" value={hospital.staffCredentials.nurseUsername} />
                      <CopyField label="Nurse password" value={hospital.staffCredentials.nursePlainPassword} />
                      <CopyField label="Receptionist username" value={hospital.staffCredentials.receptionistUsername} />
                      <CopyField label="Receptionist password" value={hospital.staffCredentials.receptionistPlainPassword} />
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="mt-5 pt-4 border-t border-white/06">
              <button className="btn-secondary text-sm flex items-center gap-2" onClick={regenPassword} disabled={saving}>
                <RefreshCw className="w-3.5 h-3.5" /> Regenerate password
              </button>
              {regenResult && (
                <div className="mt-3 p-3 rounded-xl text-sm font-mono text-teal border border-teal/20 bg-teal/5">
                  New: <span className="font-bold select-all">{regenResult}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings */}
      {tab === 'settings' && settings && (
        <div className="rounded-2xl border border-white/07 bg-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-6">Hospital settings</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
            <Field label="Notification channel" value={settings.notificationChannel ?? 'Not configured'} />
            <Field label="Sender name" value={settings.senderName} />
            <Field label="Phone number" value={settings.phoneNumber} />
            <Field label="WhatsApp from number" value={settings.whatsappFromNumber} />
            <Field label="Language" value={settings.language} />
            <Field label="Termii sender ID" value={settings.termiiSenderId} />
            <Field label="Sender ID approved" value={settings.senderIdApproved} />
            <Field label="Post-treatment follow-up days" value={settings.pipelinePostTreatmentDays ?? 'Default'} />
            <Field label="Dormant after days" value={settings.pipelineDormantDays ?? 'Default'} />
            <Field label="Daily AI call limit" value={settings.callTaskAiDailyLimit ?? 'Unlimited'} />
            <Field label="AI calls used today" value={settings.callTaskAiUsedToday} />
          </div>
          {settings.departments?.length > 0 && (
            <div className="mt-6 pt-5 border-t border-white/06">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-3">Departments</p>
              <div className="flex flex-wrap gap-1.5">
                {settings.departments.map(d => (
                  <span key={d} className="text-xs px-2.5 py-1 rounded-full bg-white/06 text-foreground border border-white/10">{d}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modules */}
      {tab === 'modules' && modules && (
        <div className="rounded-2xl border border-white/07 bg-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-foreground">Feature modules</h3>
            {saving && <p className="text-xs text-teal">Saving…</p>}
          </div>
          {([
            ['appointmentsEnabled',          'Appointments',              'Booking and appointment management'],
            ['feedbackEnabled',              'Patient feedback',          'Post-visit satisfaction surveys'],
            ['wellnessNewsletterEnabled',    'Wellness newsletter',       'Automated health tips and news'],
            ['whatsappEnabled',              'WhatsApp messaging',        'WhatsApp delivery channel'],
            ['messagesEnabled',              'In-app messages',           'In-app messaging module'],
            ['callTaskSmsEnabled',           'AI call task SMS',          'AI-driven follow-up SMS tasks'],
            ['followupSmsEnabled',           'Follow-up SMS',             'Post-visit SMS follow-ups'],
            ['appointmentReminderSmsEnabled','Appointment reminder SMS',  'Upcoming appointment reminders'],
          ] as const).map(([key, label, sub]) => (
            <Toggle key={key} label={label} sub={sub} checked={modules[key]} onChange={val => void toggleModule(key, val)} />
          ))}
        </div>
      )}

      {/* Automation */}
      {tab === 'automation' && (
        <div className="rounded-2xl border border-white/07 bg-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-5">Recent automation runs</h3>
          <HospitalAutomationLog hospitalId={hId} />
        </div>
      )}

      {/* Wallet */}
      {tab === 'wallet' && wallet && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/07 bg-card p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Wallet balance</h3>
            <p className="text-4xl font-bold text-foreground tabular-nums">{fmtMoney(wallet.balanceKobo)}</p>
            <p className="text-sm text-muted-foreground mt-1 mb-6">Current balance</p>
            <div className="space-y-3">
              <div>
                <label className="label">Credit amount (₦)</label>
                <input className="input" type="number" min="0" value={creditAmount} onChange={e => setCreditAmount(e.target.value)} placeholder="5,000" />
              </div>
              <div>
                <label className="label">Note (optional)</label>
                <input className="input" value={creditNote} onChange={e => setCreditNote(e.target.value)} placeholder="Monthly top-up" />
              </div>
              <button className="btn-teal w-full" onClick={credit} disabled={creditLoading || !creditAmount}>
                {creditLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Adding…</> : 'Add credit'}
              </button>
            </div>
          </div>
          <div className="rounded-2xl border border-white/07 bg-card p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Transaction history</h3>
            {wallet.transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
                <Wallet className="w-8 h-8 opacity-20" />
                <p className="text-sm">No transactions yet</p>
              </div>
            ) : (
              <div className="divide-y divide-white/06">
                {wallet.transactions.slice(0, 15).map(t => (
                  <div key={t.id} className="flex items-start justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="text-sm text-foreground truncate">{t.description}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{fmtDateTime(t.created_at)}</p>
                    </div>
                    <span className={`text-sm font-semibold shrink-0 ${t.type === 'credit' ? 'text-teal' : 'text-red-400'}`}>
                      {t.type === 'credit' ? '+' : '−'}{fmtMoney(t.amount_kobo)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function HospitalAutomationLog({ hospitalId }: { hospitalId: number }) {
  const [logs, setLogs] = useState<Awaited<ReturnType<typeof patientApi.getAutomationLog>>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void patientApi.getAutomationLog({ hospitalId }).then(setLogs).finally(() => setLoading(false))
  }, [hospitalId])

  if (loading) return (
    <div className="flex items-center gap-2 text-muted-foreground py-4">
      <Loader2 className="w-4 h-4 animate-spin" /> Loading automation runs…
    </div>
  )
  if (!logs.length) return (
    <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
      <Zap className="w-8 h-8 opacity-20" />
      <p className="text-sm">No automation runs for this hospital</p>
    </div>
  )

  const statusColor: Record<string, string> = {
    sent:    'bg-teal/10 text-teal border-teal/20',
    failed:  'bg-red-500/10 text-red-400 border-red-500/20',
    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  }

  return (
    <div className="divide-y divide-white/06">
      {logs.slice(0, 20).map(l => (
        <div key={l.id} className="flex items-start justify-between gap-3 py-3.5">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground capitalize">{l.automationType.replace(/_/g, ' ')} · {l.channel}</p>
            {l.messagePreview && <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">{l.messagePreview}</p>}
            {l.errorMessage && <p className="text-xs text-red-400 mt-0.5">{l.errorMessage}</p>}
            <p className="text-xs text-muted-foreground mt-0.5">{fmtDateTime(l.createdAt)}</p>
          </div>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${statusColor[l.status] ?? 'bg-white/06 text-muted-foreground border-white/10'}`}>
            {l.status}
          </span>
        </div>
      ))}
    </div>
  )
}

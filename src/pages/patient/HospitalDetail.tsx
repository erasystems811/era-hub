import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, RefreshCw, CheckCircle, XCircle, Wallet, Settings, Zap, Layers } from 'lucide-react'
import { Glass } from '../../components/Glass'
import { patientApi, Hospital, HospitalSettings, HospitalModules, WalletInfo } from '../../lib/patient-api'
import { fmtDate, fmtMoney, fmtDateTime } from '../../lib/utils'

type Tab = 'overview' | 'settings' | 'modules' | 'automation' | 'wallet'

function Field({ label, value }: { label: string; value?: string | null | number | boolean }) {
  const display = value === true ? 'Enabled' : value === false ? 'Disabled' : (value ?? '—')
  return (
    <div>
      <div className="label">{label}</div>
      <div className="text-sm text-charcoal">{String(display)}</div>
    </div>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-4 py-2 cursor-pointer select-none">
      <span className="text-sm text-charcoal">{label}</span>
      <div
        className={`relative w-10 h-6 rounded-full transition-colors duration-200 ${checked ? 'bg-teal' : 'bg-gray-200'}`}
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
    try {
      const updated = await patientApi.updateModules(hId, { [key]: val })
      setModules(updated)
    } finally { setSaving(false) }
  }

  const toggleActive = async () => {
    if (!hospital) return
    setSaving(true)
    try {
      const updated = await patientApi.updateHospital(hId, { active: !hospital.active })
      setHospital(updated)
    } finally { setSaving(false) }
  }

  const regenPassword = async () => {
    setSaving(true)
    try {
      const { newPassword } = await patientApi.regeneratePassword(hId)
      setRegenResult(newPassword)
    } finally { setSaving(false) }
  }

  const credit = async () => {
    const amount = parseFloat(creditAmount)
    if (!amount || isNaN(amount)) return
    setCreditLoading(true)
    try {
      await patientApi.creditHospitalWallet(hId, amount, creditNote || 'Manual credit')
      setCreditAmount(''); setCreditNote('')
      const w = await patientApi.getHospitalWallet(hId)
      setWallet(w)
    } finally { setCreditLoading(false) }
  }

  if (loading) return <div className="text-center py-16 text-charcoal-soft">Loading…</div>
  if (error || !hospital) return (
    <Glass className="text-center py-12">
      <p className="text-rose mb-3">{error ?? 'Hospital not found'}</p>
      <button className="btn-secondary" onClick={() => nav('/patient/hospitals')}>Go back</button>
    </Glass>
  )

  const TABS: { key: Tab; label: string; icon: JSX.Element }[] = [
    { key: 'overview', label: 'Overview', icon: <CheckCircle className="w-4 h-4" /> },
    { key: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
    { key: 'modules', label: 'Modules', icon: <Layers className="w-4 h-4" /> },
    { key: 'automation', label: 'Automation', icon: <Zap className="w-4 h-4" /> },
    { key: 'wallet', label: 'Wallet', icon: <Wallet className="w-4 h-4" /> },
  ]

  return (
    <div className="max-w-4xl">
      <button className="btn-ghost mb-5 flex items-center gap-2 -ml-2" onClick={() => nav('/patient/hospitals')}>
        <ArrowLeft className="w-4 h-4" /> All hospitals
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="page-title">{hospital.name}</h1>
          <p className="caption mt-0.5">{hospital.username} · {hospital.patientCount.toLocaleString()} patients</p>
        </div>
        <div className="flex gap-2">
          <button
            className={hospital.active ? 'btn-secondary text-rose border-rose/20' : 'btn-primary'}
            onClick={toggleActive}
            disabled={saving}
          >
            {hospital.active ? 'Suspend access' : 'Restore access'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 glass-sm" style={{ padding: '4px', display: 'inline-flex', borderRadius: '14px' }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-sm transition-all duration-150 font-medium ${
              tab === t.key
                ? 'bg-teal text-white shadow-sm'
                : 'text-charcoal-soft hover:text-charcoal'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      {tab === 'overview' && (
        <div className="grid grid-cols-2 gap-4">
          <Glass>
            <h3 className="section-title mb-4">Hospital details</h3>
            <div className="space-y-3">
              <Field label="Status" value={hospital.active ? 'Active' : 'Suspended'} />
              <Field label="Subscription" value={hospital.subscriptionStatus} />
              <Field label="Expires" value={fmtDate(hospital.subscriptionExpiresAt)} />
              <Field label="Registered" value={fmtDate(hospital.createdAt)} />
              <Field label="Contact email" value={hospital.contactEmail} />
              <Field label="Contact phone" value={hospital.contactPhone} />
            </div>
          </Glass>
          <Glass>
            <h3 className="section-title mb-4">Login credentials</h3>
            <div className="space-y-3">
              <Field label="Admin username" value={hospital.username} />
              <Field label="Admin password" value={hospital.currentPassword} />
              {hospital.staffCredentials && (
                <>
                  <Field label="Nurse username" value={hospital.staffCredentials.nurseUsername} />
                  <Field label="Nurse password" value={hospital.staffCredentials.nursePlainPassword} />
                  <Field label="Receptionist username" value={hospital.staffCredentials.receptionistUsername} />
                  <Field label="Receptionist password" value={hospital.staffCredentials.receptionistPlainPassword} />
                </>
              )}
            </div>
            <div className="mt-5 pt-4 border-t border-pink-border">
              <button className="btn-secondary text-sm flex items-center gap-2" onClick={regenPassword} disabled={saving}>
                <RefreshCw className="w-3.5 h-3.5" /> Regenerate password
              </button>
              {regenResult && (
                <div className="mt-3 p-3 rounded-xl text-sm font-mono text-teal" style={{ background: 'rgba(74,155,168,0.08)' }}>
                  New password: <span className="font-bold select-all">{regenResult}</span>
                </div>
              )}
            </div>
          </Glass>
        </div>
      )}

      {tab === 'settings' && settings && (
        <Glass>
          <h3 className="section-title mb-5">Hospital settings</h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Notification channel" value={settings.notificationChannel ?? 'Not configured'} />
            <Field label="Sender name" value={settings.senderName} />
            <Field label="Phone number" value={settings.phoneNumber} />
            <Field label="WhatsApp number" value={settings.whatsappFromNumber} />
            <Field label="Language" value={settings.language} />
            <Field label="Termii sender ID" value={settings.termiiSenderId} />
            <Field label="Sender ID approved" value={settings.senderIdApproved} />
            <Field label="Post-treatment follow-up days" value={settings.pipelinePostTreatmentDays ?? '—'} />
            <Field label="Dormant after days" value={settings.pipelineDormantDays ?? '—'} />
            <Field label="Daily AI call limit" value={settings.callTaskAiDailyLimit ?? 'Unlimited'} />
            <Field label="AI calls used today" value={settings.callTaskAiUsedToday} />
          </div>
          {settings.departments?.length > 0 && (
            <div className="mt-4">
              <div className="label">Departments</div>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {settings.departments.map(d => (
                  <span key={d} className="text-xs px-2.5 py-1 rounded-full bg-pink-light text-charcoal border border-pink-border">{d}</span>
                ))}
              </div>
            </div>
          )}
        </Glass>
      )}

      {tab === 'modules' && modules && (
        <Glass>
          <h3 className="section-title mb-5">Feature modules</h3>
          <div className="divide-y divide-pink-border/50">
            {([
              ['appointmentsEnabled',          'Appointments'],
              ['feedbackEnabled',              'Patient feedback'],
              ['wellnessNewsletterEnabled',    'Wellness newsletter'],
              ['whatsappEnabled',              'WhatsApp messaging'],
              ['messagesEnabled',              'In-app messages'],
              ['callTaskSmsEnabled',           'AI call task SMS'],
              ['followupSmsEnabled',           'Follow-up SMS'],
              ['appointmentReminderSmsEnabled','Appointment reminder SMS'],
            ] as const).map(([key, label]) => (
              <Toggle
                key={key}
                label={label}
                checked={modules[key]}
                onChange={val => void toggleModule(key, val)}
              />
            ))}
          </div>
          {saving && <p className="text-xs text-teal mt-3 text-right">Saving…</p>}
        </Glass>
      )}

      {tab === 'automation' && (
        <Glass>
          <h3 className="section-title mb-4">Recent automation runs</h3>
          <HospitalAutomationLog hospitalId={hId} />
        </Glass>
      )}

      {tab === 'wallet' && wallet && (
        <div className="grid grid-cols-2 gap-4">
          <Glass>
            <h3 className="section-title mb-4">Wallet</h3>
            <div className="text-3xl font-semibold text-charcoal mb-1">{fmtMoney(wallet.balanceKobo)}</div>
            <p className="caption mb-5">Current balance</p>
            <div className="space-y-3">
              <div>
                <label className="label">Credit amount (₦)</label>
                <input className="input" type="number" min="0" value={creditAmount} onChange={e => setCreditAmount(e.target.value)} placeholder="5000" />
              </div>
              <div>
                <label className="label">Note (optional)</label>
                <input className="input" value={creditNote} onChange={e => setCreditNote(e.target.value)} placeholder="Monthly top-up" />
              </div>
              <button className="btn-primary w-full" onClick={credit} disabled={creditLoading || !creditAmount}>
                {creditLoading ? 'Adding…' : 'Add credit'}
              </button>
            </div>
          </Glass>
          <Glass>
            <h3 className="section-title mb-4">Transaction history</h3>
            {wallet.transactions.length === 0
              ? <p className="caption text-center py-6">No transactions yet</p>
              : (
                <div className="space-y-2">
                  {wallet.transactions.slice(0, 15).map(t => (
                    <div key={t.id} className="flex items-start justify-between gap-2 py-2 border-b border-pink-border last:border-0">
                      <div>
                        <div className="text-sm text-charcoal">{t.description}</div>
                        <div className="text-xs text-charcoal-soft">{fmtDateTime(t.created_at)}</div>
                      </div>
                      <div className={`text-sm font-medium shrink-0 ${t.type === 'credit' ? 'text-teal' : 'text-rose'}`}>
                        {t.type === 'credit' ? '+' : '-'}{fmtMoney(t.amount_kobo)}
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
          </Glass>
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

  if (loading) return <p className="caption">Loading…</p>
  if (!logs.length) return <p className="caption text-center py-4">No automation runs for this hospital</p>

  const statusColor: Record<string, string> = { sent: 'text-teal', failed: 'text-rose', pending: 'text-amber-500' }

  return (
    <div className="space-y-2">
      {logs.slice(0, 20).map(l => (
        <div key={l.id} className="flex items-start justify-between gap-3 py-2 border-b border-pink-border last:border-0">
          <div>
            <div className="text-sm text-charcoal">{l.automationType} · {l.channel}</div>
            {l.messagePreview && <div className="text-xs text-charcoal-soft mt-0.5 line-clamp-1">{l.messagePreview}</div>}
            {l.errorMessage && <div className="text-xs text-rose mt-0.5">{l.errorMessage}</div>}
            <div className="text-xs text-charcoal-soft">{fmtDateTime(l.createdAt)}</div>
          </div>
          <span className={`text-xs font-medium shrink-0 ${statusColor[l.status] ?? 'text-charcoal-soft'}`}>
            {l.status}
          </span>
        </div>
      ))}
    </div>
  )
}

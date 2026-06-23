import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, RefreshCw, Settings, Zap, Layers, Loader2,
  Copy, Check, XCircle, Shield, Save, Mail, Phone, Plus,
  Eye, EyeOff, KeyRound, Link, Users, AlertCircle, RotateCcw,
  CheckCircle2, Clock, MessageSquare, Filter,
} from 'lucide-react'
import { patientApi, Hospital, HospitalSettings, HospitalModules } from '../../lib/patient-api'
import { fmtMoney, fmtDateTime } from '../../lib/utils'

type Tab = 'general' | 'settings' | 'modules' | 'automation'
type AutoFilter = 'all' | 'failed' | 'sent'

const PREDEFINED_DEPARTMENTS = [
  'General Outpatient', 'Antenatal / Maternity', 'Paediatrics', 'Surgery / Post-Op',
  'Dental', 'Eye', 'Fertility / IVF', 'ENT (Ear, Nose and Throat)',
]

const TONES = [
  { value: 'Formal',      sub: 'Strict and corporate' },
  { value: 'Warm',        sub: 'Caring and personal' },
  { value: 'Friendly',    sub: 'Casual and modern' },
  { value: 'Empathetic',  sub: 'Deeply understanding' },
  { value: 'Encouraging', sub: 'Motivating and uplifting' },
  { value: 'Reassuring',  sub: 'Calming, reduces anxiety' },
  { value: 'Jovial',      sub: 'Light-hearted and cheerful' },
]

// Parse departments or tone that may arrive as a JSON string or already as an array
function parseJsonArray(val: unknown): string[] {
  if (Array.isArray(val)) return val as string[]
  if (typeof val === 'string' && val.trim()) {
    try { const p = JSON.parse(val); return Array.isArray(p) ? p : [] } catch { return [] }
  }
  return []
}

// ── Shared helper components ─────────────────────────────────────────────────

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={() => { navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800) }) }}
      className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-teal hover:bg-white/05 transition"
      title="Copy"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-teal" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  )
}

function CredRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 py-2 border-b border-white/06 last:border-0">
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.1em] font-semibold">{label}</p>
        <p className="text-sm font-mono text-foreground truncate">{value}</p>
      </div>
      <CopyBtn text={value} />
    </div>
  )
}

function FieldLabel({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="label">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground leading-relaxed">{hint}</p>}
    </div>
  )
}

function PillToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      className={`relative w-10 h-6 rounded-full transition-colors duration-200 shrink-0 cursor-pointer ${checked ? 'bg-teal' : 'bg-white/10'}`}
      onClick={() => onChange(!checked)}
    >
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${checked ? 'left-5' : 'left-1'}`} />
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function HospitalDetail() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const hId = Number(id)

  // Core data
  const [hospital, setHospital] = useState<Hospital | null>(null)
  const [settings, setSettings] = useState<HospitalSettings | null>(null)
  const [modules,  setModules]  = useState<HospitalModules | null>(null)

  // UI
  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [tab,        setTab]        = useState<Tab>('general')

  // Credentials display
  const [showAdminPass, setShowAdminPass] = useState(false)
  const [allCopied,     setAllCopied]     = useState(false)
  const [eraPatientUrl, setEraPatientUrl] = useState('https://app.erasystems.com.ng')

  // General tab form
  const [name,                  setName]                  = useState('')
  const [subStatus,             setSubStatus]             = useState('active')
  const [active,                setActive]                = useState(true)
  const [subscriptionExpiresAt, setSubscriptionExpiresAt] = useState('')
  const [contactEmail,          setContactEmail]          = useState('')
  const [contactPhone,          setContactPhone]          = useState('')

  // Settings tab form
  const [departments,       setDepartments]       = useState<string[]>([...PREDEFINED_DEPARTMENTS])
  const [customDeptInput,   setCustomDeptInput]   = useState('')
  const [postTreatmentDays, setPostTreatmentDays] = useState('')
  const [dormantDays,       setDormantDays]       = useState('')
  const [senderName,        setSenderName]        = useState('')
  const [hospitalPhone,     setHospitalPhone]     = useState('')
  const [notifChannel,      setNotifChannel]      = useState<'whatsapp' | 'sms'>('whatsapp')
  const [termiiSenderId,    setTermiiSenderId]    = useState('')
  const [language,          setLanguage]          = useState('')
  const [tones,             setTones]             = useState<string[]>([])
  const [clinicDescription, setClinicDescription] = useState('')

  // Test SMS/Email
  const [testSmsTo,        setTestSmsTo]        = useState('')
  const [testSmsSending,   setTestSmsSending]   = useState(false)
  const [testSmsResult,    setTestSmsResult]    = useState<{ ok: boolean; detail: string } | null>(null)
  const [testEmailTo,      setTestEmailTo]      = useState('')
  const [testEmailSending, setTestEmailSending] = useState(false)
  const [testEmailResult,  setTestEmailResult]  = useState<{ ok: boolean; msg: string } | null>(null)

  // Automation tab
  const [autoFilter,  setAutoFilter]  = useState<AutoFilter>('all')
  const [automations, setAutomations] = useState<Awaited<ReturnType<typeof patientApi.getAutomationLog>>>([])
  const [autoLoading, setAutoLoading] = useState(false)
  const [retryingId,  setRetryingId]  = useState<number | null>(null)
  const [retryError,  setRetryError]  = useState<string | null>(null)

  const [regenResult, setRegenResult] = useState<string | null>(null)

  const flash = (msg: string) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(null), 3000)
  }

  const populateSettingsForm = (s: HospitalSettings) => {
    setSettings(s)
    const depts = parseJsonArray(s.departments)
    setDepartments(depts.length > 0 ? depts : [...PREDEFINED_DEPARTMENTS])
    setPostTreatmentDays(s.pipelinePostTreatmentDays?.toString() ?? '')
    setDormantDays(s.pipelineDormantDays?.toString() ?? '')
    setSenderName(s.senderName ?? '')
    setHospitalPhone(s.phoneNumber ?? '')
    setNotifChannel((s.notificationChannel as 'whatsapp' | 'sms') ?? 'whatsapp')
    setTermiiSenderId(s.termiiSenderId ?? '')
    setLanguage(s.language ?? '')
    setTones(parseJsonArray(s.tone))
    setClinicDescription(s.clinicDescription ?? '')
  }

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [hRes, cfgRes] = await Promise.allSettled([
        patientApi.getHospital(hId),
        patientApi.getConfig(),
      ])

      if (hRes.status === 'rejected') {
        setError(hRes.reason instanceof Error ? hRes.reason.message : 'Could not load hospital')
        return
      }

      const h = hRes.value
      setHospital(h)

      // Populate general form
      setName(h.name)
      setSubStatus(h.subscriptionStatus)
      setActive(h.active)
      setSubscriptionExpiresAt(h.subscriptionExpiresAt ? h.subscriptionExpiresAt.substring(0, 10) : '')
      setContactEmail(h.contactEmail ?? '')
      setContactPhone(h.contactPhone ?? '')

      // Use embedded settings & modules (already returned by getHospital)
      if (h.settings) populateSettingsForm(h.settings)
      if (h.modules)  setModules(h.modules)

      if (cfgRes.status === 'fulfilled') setEraPatientUrl(cfgRes.value.eraPatientUrl.replace(/\/$/, ''))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load hospital')
    } finally {
      setLoading(false)
    }
  }, [hId])

  const loadAutomations = useCallback(async () => {
    setAutoLoading(true)
    setRetryError(null)
    try {
      const data = await patientApi.getAutomationLog({
        hospitalId: hId,
        status: autoFilter === 'all' ? undefined : autoFilter,
      })
      setAutomations(data)
    } catch { /* silently ignore */ }
    finally { setAutoLoading(false) }
  }, [hId, autoFilter])

  useEffect(() => { void load() }, [load])
  useEffect(() => {
    if (tab === 'automation') void loadAutomations()
  }, [tab, loadAutomations])

  const saveGeneral = async () => {
    setSaving(true); setError(null)
    try {
      const h = await patientApi.updateHospital(hId, {
        name, subscriptionStatus: subStatus, active,
        subscriptionExpiresAt: subscriptionExpiresAt ? new Date(subscriptionExpiresAt).toISOString() : null,
        contactEmail: contactEmail || null,
        contactPhone: contactPhone || null,
      })
      setHospital(prev => prev ? { ...prev, ...h } : h)
      flash('Hospital updated')
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save changes') }
    finally { setSaving(false) }
  }

  const saveSettings = async () => {
    setSaving(true); setError(null)
    try {
      const s = await patientApi.updateSettings(hId, {
        departments,
        pipelinePostTreatmentDays: postTreatmentDays ? parseInt(postTreatmentDays) : null,
        pipelineDormantDays: dormantDays ? parseInt(dormantDays) : null,
        senderName: senderName || null,
        phoneNumber: hospitalPhone || null,
        notificationChannel: notifChannel,
        termiiSenderId: termiiSenderId || null,
        language: language || null,
        tone: tones.length > 0 ? tones : null,
        clinicDescription: clinicDescription || null,
      } as Partial<HospitalSettings>)
      setSettings(s)
      flash('Settings saved')
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save settings') }
    finally { setSaving(false) }
  }

  const toggleModule = async (key: keyof HospitalModules, val: boolean) => {
    setSaving(true)
    try {
      const updated = await patientApi.updateModules(hId, { [key]: val })
      setModules(updated)
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not update module') }
    finally { setSaving(false) }
  }

  const regenPassword = async () => {
    setSaving(true); setError(null)
    try {
      const { newPassword, hospital: h } = await patientApi.regeneratePassword(hId)
      setHospital(prev => prev ? { ...prev, ...h, currentPassword: newPassword, staffCredentials: prev.staffCredentials } : h)
      setRegenResult(newPassword)
      flash('Password regenerated — share with the hospital')
    } catch (e) { setError(e instanceof Error ? e.message : 'Regeneration failed') }
    finally { setSaving(false) }
  }

  const copyAllCredentials = () => {
    if (!hospital) return
    const loginUrl = `${eraPatientUrl}/?h=${hospital.username}`
    const sc = hospital.staffCredentials
    const msg = [
      `🏥 Era Patient — Login Details for ${hospital.name}`,
      '',
      `🔗 Admin Login Link: ${loginUrl}`,
      `🔐 Admin Password: ${hospital.currentPassword ?? '(not available)'}`,
      '',
      ...(sc ? [
        `👩‍⚕️ Nurse Username: ${sc.nurseUsername}`,
        `   Nurse Password: ${sc.nursePlainPassword}`,
        '',
        `🗂️ Receptionist Username: ${sc.receptionistUsername}`,
        `   Receptionist Password: ${sc.receptionistPlainPassword}`,
        '',
      ] : []),
      `ℹ️  Staff log in at: ${eraPatientUrl} (Staff Login tab)`,
    ].join('\n')
    navigator.clipboard.writeText(msg).then(() => {
      setAllCopied(true)
      setTimeout(() => setAllCopied(false), 2500)
    })
  }

  const retryAutomation = async (logId: number) => {
    setRetryingId(logId); setRetryError(null)
    try { await patientApi.retryAutomation(logId); await loadAutomations() }
    catch (e) { setRetryError(e instanceof Error ? e.message : 'Retry failed') }
    finally { setRetryingId(null) }
  }

  const toggleDept = (dept: string) =>
    setDepartments(prev => prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept])

  const addCustomDept = () => {
    const t = customDeptInput.trim()
    if (!t || departments.includes(t)) return
    setDepartments(prev => [...prev, t])
    setCustomDeptInput('')
  }

  // ── Render ─────────────────────────────────────────────────────────────────

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
    { key: 'general',    label: 'General',    icon: <Shield className="w-3.5 h-3.5" /> },
    { key: 'settings',   label: 'Settings',   icon: <Settings className="w-3.5 h-3.5" /> },
    { key: 'modules',    label: 'Modules',    icon: <Layers className="w-3.5 h-3.5" /> },
    { key: 'automation', label: 'Automation', icon: <Zap className="w-3.5 h-3.5" /> },
  ]

  const statusBadge = hospital.active
    ? 'bg-teal/10 text-teal border-teal/20'
    : 'bg-red-500/10 text-red-400 border-red-500/20'

  const loginUrl    = `${eraPatientUrl}/?h=${hospital.username}`
  const feedbackUrl = hospital.feedbackSlug ? `${eraPatientUrl}/feedback/h/${hospital.feedbackSlug}` : null

  const expiryDate = hospital.subscriptionExpiresAt ? new Date(hospital.subscriptionExpiresAt) : null
  const daysLeft   = expiryDate ? Math.ceil((expiryDate.getTime() - Date.now()) / 86400000) : null

  return (
    <div className="max-w-4xl">
      {/* Back */}
      <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition mb-5 -ml-1"
        onClick={() => nav('/patient/hospitals')}>
        <ArrowLeft className="w-4 h-4" /> All hospitals
      </button>

      {/* Header card */}
      <div className="rounded-2xl border border-white/07 bg-card px-6 py-5 mb-5">
        <div className="flex items-start justify-between gap-4">
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
                {hospital.username} · {(hospital.patientCount ?? 0).toLocaleString()} patients
                {hospital.walletBalanceKobo != null && (
                  <span className="ml-2">· {fmtMoney(hospital.walletBalanceKobo)} wallet</span>
                )}
                {daysLeft !== null && (
                  <span className={`ml-2 ${daysLeft < 0 ? 'text-red-400' : daysLeft <= 30 ? 'text-amber-400' : ''}`}>
                    · {daysLeft < 0 ? `expired ${Math.abs(daysLeft)}d ago` : `${daysLeft}d left`}
                  </span>
                )}
              </p>
            </div>
          </div>
          <button onClick={load} className="btn-secondary p-2 shrink-0" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-5 rounded-xl border border-white/07 bg-card p-1 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              tab === t.key ? 'bg-teal text-white shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-white/05'
            }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Feedback / error banner */}
      {(error || successMsg) && (
        <div className={`flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl border mb-4 ${
          error
            ? 'text-red-400 bg-red-500/10 border-red-500/20'
            : 'text-teal bg-teal/10 border-teal/20'
        }`}>
          {error ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
          {error || successMsg}
        </div>
      )}

      {/* ── GENERAL TAB ─────────────────────────────────────────────────────── */}
      {tab === 'general' && (
        <div className="space-y-4 max-w-lg">

          {/* Credentials card */}
          <div className="rounded-2xl border border-white/07 bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">Login credentials</h2>
              <button type="button" onClick={copyAllCredentials}
                className="flex items-center gap-1.5 btn-secondary text-xs">
                {allCopied ? <Check className="w-3.5 h-3.5 text-teal" /> : <Copy className="w-3.5 h-3.5" />}
                {allCopied ? 'Copied!' : 'Copy all'}
              </button>
            </div>

            {/* Admin login link */}
            <div className="rounded-xl border border-white/08 bg-white/03 p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Link className="w-3.5 h-3.5 text-teal" />
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-teal">Admin login link</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-mono text-foreground break-all">{loginUrl}</p>
                <CopyBtn text={loginUrl} />
              </div>
            </div>

            {/* Feedback link */}
            <div className="rounded-xl border border-white/08 bg-white/03 p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-amber-400">Patient feedback link</span>
              </div>
              {feedbackUrl ? (
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-mono text-foreground break-all">{feedbackUrl}</p>
                  <CopyBtn text={feedbackUrl} />
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">Not generated yet — appears after first hospital login.</p>
              )}
            </div>

            {/* Hospital code */}
            {hospital.hospitalCode && (
              <div className="rounded-xl border border-white/08 bg-white/03 p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Shield className="w-3.5 h-3.5 text-violet-400" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-violet-400">Internal hospital code</span>
                  <span className="ml-auto text-[10px] text-muted-foreground italic">Read-only</span>
                </div>
                <CredRow label="Hospital code (UUID)" value={hospital.hospitalCode} />
              </div>
            )}

            {/* Admin creds */}
            <div className="rounded-xl border border-white/08 bg-white/03 p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-amber-400">Admin credentials</span>
              </div>
              <CredRow label="Username" value={hospital.username} />
              <div className="flex items-center justify-between gap-2 py-2 border-b border-white/06">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-[0.1em] font-semibold">Password</p>
                  <p className="text-sm font-mono text-foreground">
                    {hospital.currentPassword
                      ? (showAdminPass ? hospital.currentPassword : '•'.repeat(hospital.currentPassword.length))
                      : <span className="text-muted-foreground/50 italic text-xs">Not stored — use Regenerate</span>}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {hospital.currentPassword && (
                    <>
                      <button type="button" onClick={() => setShowAdminPass(v => !v)}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/05 transition">
                        {showAdminPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <CopyBtn text={hospital.currentPassword} />
                    </>
                  )}
                </div>
              </div>
              <div className="pt-2">
                <button className="btn-secondary text-xs flex items-center gap-1.5" onClick={regenPassword} disabled={saving}>
                  <RefreshCw className="w-3.5 h-3.5" /> Regenerate password
                </button>
                {regenResult && (
                  <div className="mt-2 p-2.5 rounded-xl text-sm font-mono text-teal border border-teal/20 bg-teal/5">
                    New: <span className="font-bold select-all">{regenResult}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Staff creds */}
            {hospital.staffCredentials && (
              <div className="rounded-xl border border-white/08 bg-white/03 p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Users className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-blue-400">Staff credentials</span>
                </div>
                <CredRow label="Nurse username"        value={hospital.staffCredentials.nurseUsername} />
                <CredRow label="Nurse password"        value={hospital.staffCredentials.nursePlainPassword} />
                <CredRow label="Receptionist username" value={hospital.staffCredentials.receptionistUsername} />
                <CredRow label="Receptionist password" value={hospital.staffCredentials.receptionistPlainPassword} />
                <p className="text-xs text-muted-foreground mt-2">Staff log in at {eraPatientUrl} (Staff Login tab)</p>
              </div>
            )}
          </div>

          {/* Account details form */}
          <div className="rounded-2xl border border-white/07 bg-card p-6 space-y-5">
            <h2 className="font-semibold text-foreground">Account details</h2>

            <FieldLabel label="Hospital name">
              <input className="input" value={name} onChange={e => setName(e.target.value)} />
            </FieldLabel>

            <FieldLabel label="Subscription status">
              <select className="input" value={subStatus} onChange={e => {
                const val = e.target.value
                setSubStatus(val)
                if (val === 'inactive') setActive(false)
                else setActive(true)
              }}>
                <option value="active">Active</option>
                <option value="trial">Trial</option>
                <option value="inactive">Suspended</option>
              </select>
            </FieldLabel>

            <FieldLabel label="Subscription expiry date">
              <input className="input" type="date" value={subscriptionExpiresAt}
                onChange={e => setSubscriptionExpiresAt(e.target.value)} />
              {subscriptionExpiresAt && (() => {
                const d = Math.ceil((new Date(subscriptionExpiresAt).getTime() - Date.now()) / 86400000)
                if (d < 0) return <p className="text-xs text-red-400 mt-1">⚠ Subscription expired {Math.abs(d)} day{Math.abs(d) !== 1 ? 's' : ''} ago</p>
                if (d <= 30) return <p className="text-xs text-amber-400 mt-1">⚠ Expires in {d} day{d !== 1 ? 's' : ''}</p>
                return <p className="text-xs text-teal mt-1">Active for {d} more days</p>
              })()}
            </FieldLabel>

            <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/03 border border-white/08">
              <div>
                <p className="text-sm font-medium text-foreground">Account active</p>
                <p className="text-xs text-muted-foreground mt-0.5">Suspended accounts cannot log in</p>
              </div>
              <PillToggle checked={active} onChange={val => {
                setActive(val)
                if (!val) setSubStatus('inactive')
                else if (subStatus === 'inactive') setSubStatus('active')
              }} />
            </div>

            <div className="pt-3 border-t border-white/06 space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Account contact (private)</p>
              <FieldLabel label="Contact email" hint="Your private record for this client — not visible to the hospital.">
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                  <input className="input pl-10" type="email" value={contactEmail}
                    onChange={e => setContactEmail(e.target.value)} placeholder="admin@hospital.com" />
                </div>
              </FieldLabel>
              <FieldLabel label="Contact phone">
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                  <input className="input pl-10" type="text" value={contactPhone}
                    onChange={e => setContactPhone(e.target.value)} placeholder="+2348000000000" />
                </div>
              </FieldLabel>
            </div>

            <div className="flex justify-end pt-2">
              <button className="btn-primary flex items-center gap-2" onClick={saveGeneral} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SETTINGS TAB ────────────────────────────────────────────────────── */}
      {tab === 'settings' && (
        <div className="rounded-2xl border border-white/07 bg-card p-6 space-y-6 max-w-2xl">
          <h2 className="font-semibold text-foreground">Hospital settings</h2>

          {/* Departments */}
          <div className="space-y-3">
            <div>
              <p className="label mb-0.5">Departments</p>
              <p className="text-xs text-muted-foreground">Select active departments for this hospital — shown in the nurse station when logging care plans.</p>
            </div>
            <div className="rounded-xl border border-white/08 bg-white/02 p-4">
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {[...new Set([...PREDEFINED_DEPARTMENTS, ...departments.filter(d => !PREDEFINED_DEPARTMENTS.includes(d))])].map(dept => (
                  <label key={dept} className="flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" checked={departments.includes(dept)} onChange={() => toggleDept(dept)}
                      className="w-4 h-4 rounded accent-teal shrink-0" />
                    <span className={`text-sm ${departments.includes(dept) ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{dept}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <input className="input flex-1" type="text" value={customDeptInput}
                onChange={e => setCustomDeptInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomDept() } }}
                placeholder="Add custom department…" />
              <button type="button" onClick={addCustomDept} disabled={!customDeptInput.trim()}
                className="btn-secondary flex items-center gap-1.5 text-sm disabled:opacity-40">
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
          </div>

          {/* Pipeline */}
          <div className="pt-2 border-t border-white/06 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldLabel label="Post-treatment days" hint="Days before moving patient to Post Care">
              <input className="input" type="number" min="1" value={postTreatmentDays}
                onChange={e => setPostTreatmentDays(e.target.value)} placeholder="14" />
            </FieldLabel>
            <FieldLabel label="Dormant after days" hint="Days before patient becomes dormant">
              <input className="input" type="number" min="1" value={dormantDays}
                onChange={e => setDormantDays(e.target.value)} placeholder="90" />
            </FieldLabel>
          </div>

          {/* Email sending */}
          <div className="pt-2 border-t border-white/06 space-y-4">
            <div>
              <p className="label mb-0.5">Email sending</p>
              <p className="text-xs text-muted-foreground">All emails send from ERA's verified noreply address. The display name is what patients see as the sender.</p>
            </div>
            <FieldLabel label="Sender display name"
              hint='Patients see this as the "From" name — e.g. "GISDHEALTH", "City Clinic". Leave blank to use the hospital name.'>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                <input className="input pl-10" type="text" value={senderName}
                  onChange={e => setSenderName(e.target.value)} placeholder="e.g. City Clinic" />
              </div>
            </FieldLabel>
            <FieldLabel label="Hospital contact phone"
              hint="Shown in automated patient emails so patients know how to reach the hospital directly.">
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                <input className="input pl-10" type="text" value={hospitalPhone}
                  onChange={e => setHospitalPhone(e.target.value)} placeholder="+2348012345678" />
              </div>
            </FieldLabel>
          </div>

          {/* Notification channel */}
          <div className="pt-2 border-t border-white/06 space-y-4">
            <div>
              <p className="label mb-0.5">Notification channel</p>
              <p className="text-xs text-muted-foreground">Channel used for automated patient notifications (queue alerts, care plan updates, etc.).</p>
            </div>
            <FieldLabel label="Channel">
              <select className="input" value={notifChannel} onChange={e => setNotifChannel(e.target.value as 'whatsapp' | 'sms')}>
                <option value="whatsapp">WhatsApp</option>
                <option value="sms">SMS</option>
              </select>
            </FieldLabel>
            <FieldLabel
              label={notifChannel === 'whatsapp' ? 'WhatsApp number' : 'Termii sender ID'}
              hint={notifChannel === 'whatsapp'
                ? 'WhatsApp always uses a phone number as the sender. Enter in international format, e.g. +2348012345678. Each hospital should have their own dedicated WhatsApp number registered with Termii.'
                : "What patients see as the sender on their phone. Leave blank to use Termii's shared pool number (works immediately). Or enter a dedicated phone number or short name (e.g. CityClinic, max 11 chars) — approval takes a few days."}
            >
              <input className="input" type="text" value={termiiSenderId}
                onChange={e => setTermiiSenderId(e.target.value)}
                placeholder={notifChannel === 'whatsapp' ? '+2348012345678' : '+2348012345678 or HospitalName'} />
            </FieldLabel>

            {/* Test SMS */}
            <div className="rounded-xl border border-white/08 bg-white/02 p-4 space-y-2">
              <p className="label">Test SMS delivery</p>
              <p className="text-xs text-muted-foreground">Send a test message to verify Termii is configured correctly.</p>
              <div className="flex gap-2">
                <input className="input flex-1" type="tel" value={testSmsTo}
                  onChange={e => { setTestSmsTo(e.target.value); setTestSmsResult(null) }}
                  placeholder="e.g. 2348012345678" />
                <button type="button" disabled={testSmsSending || !testSmsTo.trim()}
                  onClick={async () => {
                    setTestSmsSending(true); setTestSmsResult(null)
                    try {
                      const r = await patientApi.testSms(testSmsTo.trim(), termiiSenderId.trim() || undefined)
                      setTestSmsResult(r)
                    } catch (e) { setTestSmsResult({ ok: false, detail: e instanceof Error ? e.message : 'Unknown error' }) }
                    finally { setTestSmsSending(false) }
                  }}
                  className="btn-primary text-xs whitespace-nowrap disabled:opacity-50">
                  {testSmsSending ? 'Sending…' : 'Send test'}
                </button>
              </div>
              {testSmsResult && (
                <p className={`text-xs rounded-lg px-3 py-2 font-mono break-all ${testSmsResult.ok ? 'bg-teal/10 text-teal' : 'bg-red-500/10 text-red-400'}`}>
                  {testSmsResult.detail}
                </p>
              )}
            </div>

            {/* Test Email */}
            <div className="rounded-xl border border-white/08 bg-white/02 p-4 space-y-2">
              <p className="label">Test email delivery</p>
              <p className="text-xs text-muted-foreground">Send a test email to verify Resend is configured correctly.</p>
              <div className="flex gap-2">
                <input className="input flex-1" type="email" value={testEmailTo}
                  onChange={e => { setTestEmailTo(e.target.value); setTestEmailResult(null) }}
                  placeholder="you@example.com" />
                <button type="button" disabled={testEmailSending || !testEmailTo.trim()}
                  onClick={async () => {
                    setTestEmailSending(true); setTestEmailResult(null)
                    try {
                      const r = await patientApi.testEmail(testEmailTo.trim())
                      setTestEmailResult(r.ok
                        ? { ok: true,  msg: `Sent ✓ — from: ${r.from}` }
                        : { ok: false, msg: r.error ?? 'Unknown error' })
                    } catch (e) { setTestEmailResult({ ok: false, msg: e instanceof Error ? e.message : 'Unknown error' }) }
                    finally { setTestEmailSending(false) }
                  }}
                  className="btn-primary text-xs whitespace-nowrap disabled:opacity-50">
                  {testEmailSending ? 'Sending…' : 'Send test'}
                </button>
              </div>
              {testEmailResult && (
                <p className={`text-xs rounded-lg px-3 py-2 font-mono break-all ${testEmailResult.ok ? 'bg-teal/10 text-teal' : 'bg-red-500/10 text-red-400'}`}>
                  {testEmailResult.msg}
                </p>
              )}
            </div>
          </div>

          {/* Language */}
          <div className="pt-2 border-t border-white/06">
            <FieldLabel label="Language">
              <select className="input" value={language} onChange={e => setLanguage(e.target.value)}>
                <option value="">Default</option>
                <option value="en">English</option>
                <option value="ar">Arabic</option>
                <option value="fr">French</option>
              </select>
            </FieldLabel>
          </div>

          {/* Communication tone */}
          <div className="pt-2 border-t border-white/06 space-y-3">
            <div>
              <p className="label mb-0.5">Communication tone</p>
              <p className="text-xs text-muted-foreground">
                Select up to 4 tones for AI-generated messages.
                {tones.length > 0 && <span className="ml-1 text-teal font-medium">{tones.length}/4 selected</span>}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {TONES.map(t => {
                const selected = tones.includes(t.value)
                const atMax = tones.length >= 4 && !selected
                return (
                  <button key={t.value} type="button" disabled={atMax}
                    onClick={() => {
                      if (selected) setTones(prev => prev.filter(x => x !== t.value))
                      else if (tones.length < 4) setTones(prev => [...prev, t.value])
                    }}
                    className={`flex flex-col items-start gap-0.5 px-3 py-2.5 rounded-xl border text-left transition-all ${
                      selected ? 'border-teal/40 bg-teal/08 text-foreground' : atMax ? 'border-white/06 bg-transparent text-muted-foreground/40 cursor-not-allowed' : 'border-white/08 hover:border-teal/20 hover:bg-white/03 text-muted-foreground'
                    }`}>
                    <div className="flex items-center gap-2 w-full">
                      <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 transition-colors ${selected ? 'bg-teal border-teal' : 'border-muted-foreground/30'}`}>
                        {selected && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <span className="text-sm font-semibold">{t.value}</span>
                    </div>
                    <p className="text-xs leading-snug pl-5 opacity-70">{t.sub}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Clinic description */}
          <div className="pt-2 border-t border-white/06">
            <FieldLabel label="Clinic description"
              hint="Used for AI-generated messages — describes the clinic's specialty and approach.">
              <textarea className="input resize-none" rows={3} value={clinicDescription}
                onChange={e => setClinicDescription(e.target.value)}
                placeholder="A brief description of the clinic's specialty and patient care approach…" />
            </FieldLabel>
          </div>

          <div className="flex justify-end pt-2">
            <button className="btn-primary flex items-center gap-2" onClick={saveSettings} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {saving ? 'Saving…' : 'Save settings'}
            </button>
          </div>
        </div>
      )}

      {/* ── MODULES TAB ─────────────────────────────────────────────────────── */}
      {tab === 'modules' && (
        <div className="rounded-2xl border border-white/07 bg-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Feature modules</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Control which features are available to this hospital's staff. Changes save immediately.</p>
            </div>
            {saving && <p className="text-xs text-teal">Saving…</p>}
          </div>
          {([
            ['appointmentsEnabled',           'Appointments',             'Calendar scheduling and appointment management'],
            ['feedbackEnabled',               'Patient feedback',         'Post-visit satisfaction surveys'],
            ['wellnessNewsletterEnabled',     'Wellness newsletter',      'Automated weekly health tips to patients'],
            ['whatsappEnabled',               'WhatsApp messaging',       'WhatsApp delivery channel'],
            ['messagesEnabled',               'In-app messages',          'In-app messaging module'],
            ['callTaskSmsEnabled',            'AI call task SMS',         'AI-driven follow-up SMS tasks'],
            ['followupSmsEnabled',            'Follow-up SMS',            'Post-visit SMS follow-ups'],
            ['appointmentReminderSmsEnabled', 'Appointment reminder SMS', 'Upcoming appointment reminders'],
          ] as const).map(([key, label, sub]) => (
            <label key={key} className="flex items-center justify-between gap-4 py-3.5 cursor-pointer select-none border-b border-white/06 last:border-0">
              <div>
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
              </div>
              <PillToggle
                checked={modules?.[key] ?? false}
                onChange={val => void toggleModule(key, val)}
              />
            </label>
          ))}
        </div>
      )}

      {/* ── AUTOMATION TAB ──────────────────────────────────────────────────── */}
      {tab === 'automation' && (
        <div className="space-y-4">
          {retryError && (
            <div className="flex items-start gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{retryError}</span>
            </div>
          )}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Automation log</h3>
              <p className="text-xs text-muted-foreground mt-0.5">All AI messages, emails and WhatsApp automations for this hospital.</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-white/04 border border-white/08 rounded-lg p-1">
                {(['all', 'failed', 'sent'] as AutoFilter[]).map(f => (
                  <button key={f} type="button" onClick={() => setAutoFilter(f)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${autoFilter === f ? 'bg-teal text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
              <button type="button" onClick={loadAutomations} disabled={autoLoading}
                className="btn-secondary p-2" title="Refresh">
                <RefreshCw className={`w-4 h-4 ${autoLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {autoLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading…
            </div>
          ) : automations.length === 0 ? (
            <div className="rounded-2xl border border-white/07 bg-card py-16 text-center text-muted-foreground">
              <Zap className="w-8 h-8 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No automation logs found</p>
              <p className="text-xs mt-1 opacity-60">Automations appear here as patients move through the pipeline</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/07 bg-card overflow-hidden">
              <div className="divide-y divide-white/06">
                {automations.map(log => (
                  <div key={log.id} className="px-5 py-3.5 flex items-start gap-4">
                    <div className="mt-0.5 shrink-0">
                      {log.status === 'sent'
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-teal" />
                        : log.status === 'failed'
                        ? <XCircle className="w-3.5 h-3.5 text-red-400" />
                        : <Clock className="w-3.5 h-3.5 text-amber-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium capitalize">{log.automationType.replace(/_/g, ' ')}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          log.status === 'sent'   ? 'bg-teal/10 text-teal border-teal/20'
                          : log.status === 'failed' ? 'bg-red-500/10 text-red-400 border-red-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {log.status === 'queued' ? 'in progress' : log.status}
                        </span>
                        <span className="text-xs bg-white/05 px-1.5 py-0.5 rounded-full text-muted-foreground flex items-center gap-1">
                          {log.channel === 'email' ? <Mail className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
                          {log.channel}
                        </span>
                        {log.retryCount > 0 && (
                          <span className="text-xs text-muted-foreground">· {log.retryCount} retr{log.retryCount === 1 ? 'y' : 'ies'}</span>
                        )}
                      </div>
                      {log.patientName && (
                        <p className="text-xs text-muted-foreground mt-0.5">Patient: {log.patientName}</p>
                      )}
                      {log.messagePreview && (
                        <p className="text-xs text-muted-foreground/70 mt-1 italic line-clamp-2">"{log.messagePreview}"</p>
                      )}
                      {log.errorMessage && (
                        <p className="text-xs text-red-400 mt-1 flex items-start gap-1">
                          <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                          {log.errorMessage}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-right space-y-1.5">
                      <p className="text-xs text-muted-foreground whitespace-nowrap">{fmtDateTime(log.createdAt)}</p>
                      {log.status === 'failed' && (
                        <button type="button" onClick={() => void retryAutomation(log.id)}
                          disabled={retryingId === log.id}
                          className="flex items-center gap-1 text-xs text-teal hover:text-teal/80 transition disabled:opacity-50">
                          {retryingId === log.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                          Retry
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/07 px-5 py-3 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Filter className="w-3 h-3" />Showing {automations.length} records</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-teal" />Sent</span>
                <span className="flex items-center gap-1"><XCircle className="w-3 h-3 text-red-400" />Failed</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

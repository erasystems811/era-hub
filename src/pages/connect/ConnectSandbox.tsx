import { useEffect, useState, useCallback, useRef } from 'react'
import {
  FlaskConical, Loader2, AlertTriangle, RefreshCw,
  CheckCircle2, Users, Heart, Activity, Play, RotateCcw,
  XCircle, AlertCircle, Power, PowerOff, Settings, Zap,
} from 'lucide-react'
import { connectApi, ConnectInstance, ConnectEvent } from '../../lib/connect-api'

function timeStr(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

function timeAgo(iso: string | null) {
  if (!iso) return 'Never'
  const diff = Date.now() - new Date(iso).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  return `${Math.floor(m / 60)}h ago`
}

function EventIcon({ type, status }: { type: string; status: string }) {
  if (status === 'error')          return <XCircle     className="w-3.5 h-3.5 text-red-400" />
  if (status === 'warning')        return <AlertCircle  className="w-3.5 h-3.5 text-amber-400" />
  if (type === 'patient_synced')   return <Users       className="w-3.5 h-3.5 text-sky-400" />
  if (type === 'care_plan_synced') return <Heart       className="w-3.5 h-3.5 text-purple-400" />
  if (type === 'startup')          return <Power       className="w-3.5 h-3.5 text-primary" />
  if (type === 'shutdown')         return <PowerOff    className="w-3.5 h-3.5 text-zinc-400" />
  if (type === 'heartbeat')        return <Activity    className="w-3.5 h-3.5 text-muted-foreground/30" />
  if (type.startsWith('config'))   return <Settings    className="w-3.5 h-3.5 text-muted-foreground/50" />
  return <Zap className="w-3.5 h-3.5 text-muted-foreground/40" />
}

function fmtType(t: string) {
  return t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function Field({
  label, value, onChange, placeholder, type = 'text',
}: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; type?: string
}) {
  return (
    <div>
      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
        {label}
      </label>
      <input
        type={type} value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
      />
    </div>
  )
}

const DEFAULT_PATIENT = {
  firstName: 'Test',
  lastName: 'Patient',
  phone: '08000000001',
  dateOfBirth: '1990-01-01',
}

const DEFAULT_TREATMENT = {
  medication: 'Paracetamol',
  dosage: '500mg',
  timing: 'Twice daily',
  duration: '3 days',
  doctorName: 'Dr. Test',
}

type InjectStatus = 'idle' | 'sending' | 'sent' | 'error'

export function ConnectSandbox() {
  const [instances,      setInstances]      = useState<ConnectInstance[]>([])
  const [instanceId,     setInstanceId]     = useState('')
  const [loadingInst,    setLoadingInst]    = useState(true)

  const [patient,        setPatient]        = useState({ ...DEFAULT_PATIENT })
  const [treatment,      setTreatment]      = useState({ ...DEFAULT_TREATMENT })

  const [patientStatus,  setPatientStatus]  = useState<InjectStatus>('idle')
  const [patientMsg,     setPatientMsg]     = useState('')
  const [treatStatus,    setTreatStatus]    = useState<InjectStatus>('idle')
  const [treatMsg,       setTreatMsg]       = useState('')

  const [events,         setEvents]         = useState<ConnectEvent[]>([])
  const [loadingEvents,  setLoadingEvents]  = useState(false)
  const feedRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const selectedInstance = instances.find(i => i.id === instanceId)

  // Load instances on mount
  useEffect(() => {
    connectApi.listInstances()
      .then(list => {
        setInstances(list)
        if (list.length === 1) setInstanceId(list[0].id)
      })
      .catch(() => {})
      .finally(() => setLoadingInst(false))
  }, [])

  // Live event feed — refresh every 10 seconds
  const loadEvents = useCallback(async (id: string) => {
    if (!id) return
    setLoadingEvents(true)
    try {
      const res = await connectApi.listEvents({ instanceId: id, limit: 30 })
      setEvents(res.events)
    } catch { /**/ }
    finally { setLoadingEvents(false) }
  }, [])

  useEffect(() => {
    if (!instanceId) return
    void loadEvents(instanceId)
    feedRef.current = setInterval(() => void loadEvents(instanceId), 10_000)
    return () => { if (feedRef.current) clearInterval(feedRef.current) }
  }, [instanceId, loadEvents])

  const injectPatient = async () => {
    if (!instanceId || patientStatus === 'sending') return
    setPatientStatus('sending')
    setPatientMsg('')
    try {
      await connectApi.sandboxInjectPatient(instanceId, patient)
      setPatientStatus('sent')
      setPatientMsg('Command sent. ERAConnect will insert the patient into the local DB within the next minute, then sync it to ERA Patient within 30s after that.')
    } catch (e) {
      setPatientStatus('error')
      setPatientMsg(e instanceof Error ? e.message : 'Failed to send inject command')
    }
  }

  const injectTreatment = async () => {
    if (!instanceId || treatStatus === 'sending') return
    setTreatStatus('sending')
    setTreatMsg('')
    try {
      await connectApi.sandboxInjectTreatment(instanceId, treatment)
      setTreatStatus('sent')
      setTreatMsg('Command sent. The prescription will be inserted for the most recently added patient, then synced to ERA Patient.')
    } catch (e) {
      setTreatStatus('error')
      setTreatMsg(e instanceof Error ? e.message : 'Failed to send inject command')
    }
  }

  const resetPatient = () => {
    setPatient({ ...DEFAULT_PATIENT })
    setPatientStatus('idle')
    setPatientMsg('')
  }
  const resetTreatment = () => {
    setTreatment({ ...DEFAULT_TREATMENT })
    setTreatStatus('idle')
    setTreatMsg('')
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-primary" />
          Sandbox Testing
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Inject fake patients and prescriptions into a hospital's local database and watch them sync to ERA Patient.
        </p>
      </div>

      {/* Instance selector */}
      <div className="rounded-xl border border-white/07 bg-card p-4">
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
          Hospital Instance
        </label>
        {loadingInst ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading instances...
          </div>
        ) : instances.length === 0 ? (
          <p className="text-sm text-muted-foreground/60">
            No hospital instances found. ERAConnect must be running and connected first.
          </p>
        ) : (
          <div className="flex items-center gap-4">
            <select
              value={instanceId}
              onChange={e => setInstanceId(e.target.value)}
              className="bg-background border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50 min-w-[240px]"
            >
              {instances.length > 1 && <option value="">— Select a hospital —</option>}
              {instances.map(i => (
                <option key={i.id} value={i.id}>{i.hospitalName}</option>
              ))}
            </select>
            {selectedInstance && (
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${
                  selectedInstance.status === 'online' ? 'bg-primary animate-pulse' :
                  selectedInstance.status === 'error'  ? 'bg-red-400' : 'bg-zinc-500'
                }`} />
                <span className={`text-xs font-semibold capitalize ${
                  selectedInstance.status === 'online' ? 'text-primary' :
                  selectedInstance.status === 'error'  ? 'text-red-400' : 'text-zinc-500'
                }`}>{selectedInstance.status}</span>
                <span className="text-xs text-muted-foreground/50">
                  · Last seen {timeAgo(selectedInstance.lastHeartbeatAt)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {instanceId && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Inject Patient */}
          <div className="rounded-xl border border-white/07 bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-400" />
                Test Patient
              </h2>
              <button onClick={resetPatient}
                className="p-1 rounded text-muted-foreground/40 hover:text-muted-foreground transition"
                title="Reset to defaults">
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="First Name" value={patient.firstName} onChange={v => setPatient(p => ({ ...p, firstName: v }))} placeholder="Test" />
                <Field label="Last Name"  value={patient.lastName}  onChange={v => setPatient(p => ({ ...p, lastName: v }))}  placeholder="Patient" />
              </div>
              <Field label="Phone"         value={patient.phone}       onChange={v => setPatient(p => ({ ...p, phone: v }))}       placeholder="08000000001" />
              <Field label="Date of Birth" value={patient.dateOfBirth} onChange={v => setPatient(p => ({ ...p, dateOfBirth: v }))} type="date" />
            </div>

            {patientMsg && (
              <div className={`rounded-lg border px-3 py-2 text-xs ${
                patientStatus === 'sent'  ? 'border-primary/20 bg-primary/10 text-primary' :
                patientStatus === 'error' ? 'border-red-500/20 bg-red-500/10 text-red-400' :
                'border-white/10 text-muted-foreground'
              }`}>
                {patientMsg}
              </div>
            )}

            <button
              onClick={injectPatient}
              disabled={patientStatus === 'sending' || !instanceId}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition disabled:opacity-50 ${
                patientStatus === 'sent'
                  ? 'bg-primary/15 text-primary'
                  : 'bg-sky-500/15 text-sky-400 hover:bg-sky-500/25'
              }`}
            >
              {patientStatus === 'sending' ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
              ) : patientStatus === 'sent' ? (
                <><CheckCircle2 className="w-4 h-4" /> Patient Queued</>
              ) : (
                <><Play className="w-4 h-4" /> Inject Test Patient</>
              )}
            </button>
          </div>

          {/* Inject Treatment */}
          <div className="rounded-xl border border-white/07 bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Heart className="w-4 h-4 text-purple-400" />
                Test Prescription
              </h2>
              <button onClick={resetTreatment}
                className="p-1 rounded text-muted-foreground/40 hover:text-muted-foreground transition"
                title="Reset to defaults">
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Medication" value={treatment.medication} onChange={v => setTreatment(t => ({ ...t, medication: v }))} placeholder="Paracetamol" />
                <Field label="Dosage"     value={treatment.dosage}     onChange={v => setTreatment(t => ({ ...t, dosage: v }))}     placeholder="500mg" />
              </div>
              <Field label="Timing"     value={treatment.timing}     onChange={v => setTreatment(t => ({ ...t, timing: v }))}     placeholder="Twice daily" />
              <Field label="Duration"   value={treatment.duration}   onChange={v => setTreatment(t => ({ ...t, duration: v }))}   placeholder="3 days" />
              <Field label="Doctor"     value={treatment.doctorName} onChange={v => setTreatment(t => ({ ...t, doctorName: v }))} placeholder="Dr. Test" />
            </div>

            {treatMsg && (
              <div className={`rounded-lg border px-3 py-2 text-xs ${
                treatStatus === 'sent'  ? 'border-primary/20 bg-primary/10 text-primary' :
                treatStatus === 'error' ? 'border-red-500/20 bg-red-500/10 text-red-400' :
                'border-white/10 text-muted-foreground'
              }`}>
                {treatMsg}
              </div>
            )}

            <button
              onClick={injectTreatment}
              disabled={treatStatus === 'sending' || !instanceId}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition disabled:opacity-50 ${
                treatStatus === 'sent'
                  ? 'bg-primary/15 text-primary'
                  : 'bg-purple-500/15 text-purple-400 hover:bg-purple-500/25'
              }`}
            >
              {treatStatus === 'sending' ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
              ) : treatStatus === 'sent' ? (
                <><CheckCircle2 className="w-4 h-4" /> Prescription Queued</>
              ) : (
                <><Play className="w-4 h-4" /> Inject Test Prescription</>
              )}
            </button>
          </div>

        </div>
      )}

      {/* How it works */}
      {instanceId && (
        <div className="rounded-xl border border-white/07 bg-card px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">How it works</p>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground/70">
            <span>1. You click inject</span>
            <span>→</span>
            <span>2. ERAConnect picks it up within ~60s</span>
            <span>→</span>
            <span>3. Inserts into local DB</span>
            <span>→</span>
            <span>4. Syncs to ERA Patient within 30s</span>
            <span>→</span>
            <span>5. Shows in the feed below</span>
          </div>
        </div>
      )}

      {/* Live event feed */}
      {instanceId && (
        <div className="rounded-xl border border-white/07 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/07 flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4 text-muted-foreground/50" />
              Live Feed
              <span className="text-[10px] text-muted-foreground/40 font-normal">auto-refreshes every 10s</span>
            </h2>
            <button onClick={() => void loadEvents(instanceId)}
              className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-muted-foreground hover:bg-white/5 transition">
              <RefreshCw className={`w-3.5 h-3.5 ${loadingEvents ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {events.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              {loadingEvents ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                'No events yet. Inject a test patient to see activity here.'
              )}
            </div>
          ) : (
            <table className="w-full text-sm">
              <tbody className="divide-y divide-white/05">
                {events.map(ev => (
                  <tr key={ev.id} className={`hover:bg-white/[0.025] transition ${ev.status === 'error' ? 'bg-red-500/[0.03]' : ''}`}>
                    <td className="px-4 py-2.5 text-[11px] text-muted-foreground/50 whitespace-nowrap w-44">
                      {timeStr(ev.createdAt)}
                    </td>
                    <td className="px-4 py-2.5 w-44">
                      <div className="flex items-center gap-2">
                        <EventIcon type={ev.eventType} status={ev.status} />
                        <span className="text-xs font-medium">{fmtType(ev.eventType)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground/60 hidden sm:table-cell w-24">
                      {ev.patientMrn ?? '—'}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground/70 truncate max-w-xs">
                      {ev.message || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

    </div>
  )
}

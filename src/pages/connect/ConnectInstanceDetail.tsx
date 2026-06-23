import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, RefreshCw, Loader2, AlertTriangle, CheckCircle2,
  XCircle, AlertCircle, Wifi, WifiOff, Heart, Users, Activity,
  Settings, Power, PowerOff, Zap, Save, RotateCcw,
} from 'lucide-react'
import { connectApi, ConnectInstance, ConnectEvent } from '../../lib/connect-api'

function timeAgo(iso: string | null) {
  if (!iso) return 'Never'
  const diff = Date.now() - new Date(iso).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function timeStr(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

function EventIcon({ type, status }: { type: string; status: string }) {
  if (status === 'error')               return <XCircle     className="w-3.5 h-3.5 text-red-400" />
  if (status === 'warning')             return <AlertCircle  className="w-3.5 h-3.5 text-amber-400" />
  if (type === 'patient_synced')        return <Users       className="w-3.5 h-3.5 text-sky-400" />
  if (type === 'care_plan_synced')      return <Heart       className="w-3.5 h-3.5 text-purple-400" />
  if (type === 'auth_ok')               return <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
  if (type === 'startup')               return <Power       className="w-3.5 h-3.5 text-primary" />
  if (type === 'shutdown')              return <PowerOff    className="w-3.5 h-3.5 text-zinc-400" />
  if (type.startsWith('config'))        return <Settings    className="w-3.5 h-3.5 text-muted-foreground/50" />
  if (type === 'heartbeat')             return <Activity    className="w-3.5 h-3.5 text-muted-foreground/30" />
  return <Zap className="w-3.5 h-3.5 text-muted-foreground/40" />
}

function fmtType(t: string) {
  return t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function Stat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="rounded-xl border border-white/07 bg-card p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
      <p className={`text-2xl font-bold tabular-nums ${color ?? 'text-foreground'}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
    </div>
  )
}

export function ConnectInstanceDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [instance, setInstance] = useState<ConnectInstance | null>(null)
  const [events,   setEvents]   = useState<ConnectEvent[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')

  // Config editor state
  const [cfg, setCfg] = useState({ syncInterval: 30, paused: false, notifyEmail: '' })
  const [saving,      setSaving]      = useState(false)
  const [saved,       setSaved]       = useState(false)
  const [restarting,  setRestarting]  = useState(false)
  const [restartDone, setRestartDone] = useState(false)

  const load = async () => {
    if (!id) return
    setLoading(true)
    setError('')
    try {
      const [inst, evRes] = await Promise.all([
        connectApi.getinstance(id),
        connectApi.listEvents({ instanceId: id, limit: 50 }),
      ])
      setInstance(inst)
      setEvents(evRes.events)
      if (inst.config) {
        setCfg({
          syncInterval: inst.config.syncIntervalSeconds,
          paused:       inst.config.paused,
          notifyEmail:  inst.config.notifyEmail ?? '',
        })
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const triggerRestart = async () => {
    if (!id || restarting) return
    setRestarting(true)
    try {
      await connectApi.triggerRestart(id)
      setRestartDone(true)
      setTimeout(() => setRestartDone(false), 5000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Restart failed')
    } finally {
      setRestarting(false)
    }
  }

  const saveConfig = async () => {
    if (!id) return
    setSaving(true)
    setSaved(false)
    try {
      await connectApi.updateConfig(id, {
        syncIntervalSeconds: cfg.syncInterval,
        paused:              cfg.paused,
        notifyEmail:         cfg.notifyEmail.trim() || null,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save config')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[300px]">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error && !instance) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
        </div>
      </div>
    )
  }

  if (!instance) return null

  const statusColor =
    instance.status === 'online'  ? 'text-primary' :
    instance.status === 'error'   ? 'text-red-400'     : 'text-zinc-500'

  const StatusIcon = instance.status === 'online' ? Wifi :
                     instance.status === 'error'   ? XCircle : WifiOff

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start gap-3">
        <button onClick={() => navigate('/connect/instances')}
          className="p-2 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-white/5 transition mt-0.5 shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold tracking-tight truncate">{instance.hospitalName}</h1>
            <div className={`flex items-center gap-1.5 ${statusColor}`}>
              <StatusIcon className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider capitalize">{instance.status}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mt-1 text-[11px] text-muted-foreground/60">
            {instance.mode     && <span>Mode: <span className="capitalize">{instance.mode}</span></span>}
            {instance.emrEngine && <span>Engine: {instance.emrEngine}</span>}
            {instance.version  && <span>v{instance.version}</span>}
            <span>Last seen: {timeAgo(instance.lastHeartbeatAt)}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={triggerRestart} disabled={restarting} title="Remote restart"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition disabled:opacity-50 ${
              restartDone
                ? 'bg-primary/15 text-primary'
                : 'border border-white/10 text-muted-foreground/60 hover:text-foreground hover:bg-white/5'
            }`}>
            {restarting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : restartDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : <RotateCcw className="w-3.5 h-3.5" />}
            {restartDone ? 'Restart queued' : 'Restart'}
          </button>
          <button onClick={load}
            className="p-2 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-white/5 transition">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Patients Synced"   value={instance.patientsSynced}  color="text-sky-400" />
        <Stat label="Care Plans Synced" value={instance.carePlansSynced} color="text-purple-400" />
        <Stat label="Total Errors"      value={instance.errorsTotal}     color={instance.errorsTotal > 0 ? 'text-red-400' : 'text-muted-foreground'} />
        <Stat label="Last Error"        value={timeAgo(instance.lastErrorAt)} />
      </div>

      {/* Config editor */}
      <div className="rounded-xl border border-white/07 bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Settings className="w-4 h-4 text-muted-foreground/50" />
            Remote Configuration
          </h2>
          <p className="text-[11px] text-muted-foreground/50">Agent picks up changes within one poll cycle</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
              Sync Interval (seconds)
            </label>
            <input
              type="number" min={10} max={3600}
              value={cfg.syncInterval}
              onChange={e => setCfg(c => ({ ...c, syncInterval: parseInt(e.target.value) || 30 }))}
              className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
              Alert Email (optional)
            </label>
            <input
              type="email"
              value={cfg.notifyEmail}
              onChange={e => setCfg(c => ({ ...c, notifyEmail: e.target.value }))}
              placeholder="alerts@yourhospital.com"
              className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
            />
          </div>
          <div className="flex flex-col justify-end">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
              Sync Status
            </label>
            <button onClick={() => setCfg(c => ({ ...c, paused: !c.paused }))}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition ${
                cfg.paused
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                  : 'border-emerald-500/30 bg-emerald-500/10 text-primary hover:bg-primary/20'
              }`}>
              {cfg.paused ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
              {cfg.paused ? 'Paused — click to resume' : 'Active — click to pause'}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <p className="text-[11px] text-muted-foreground/50">
            {instance.config?.updatedAt ? `Last updated ${timeAgo(instance.config.updatedAt)}` : ''}
          </p>
          <button onClick={saveConfig} disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/15 text-primary hover:bg-emerald-500/25 text-sm font-medium transition disabled:opacity-50">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            {saved ? 'Saved' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Recent events */}
      <div className="rounded-xl border border-white/07 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/07 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Recent Activity</h2>
          <button onClick={() => navigate(`/connect/events?instanceId=${id}`)}
            className="text-xs text-primary hover:text-emerald-300 transition">
            View all →
          </button>
        </div>

        {events.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">No events yet</div>
        ) : (
          <table className="w-full text-sm">
            <tbody className="divide-y divide-white/05">
              {events.map(ev => (
                <tr key={ev.id} className={`hover:bg-white/[0.025] transition ${ev.status === 'error' ? 'bg-red-500/[0.03]' : ''}`}>
                  <td className="px-4 py-2.5 text-[11px] text-muted-foreground/50 whitespace-nowrap w-40">{timeStr(ev.createdAt)}</td>
                  <td className="px-4 py-2.5 w-40">
                    <div className="flex items-center gap-2">
                      <EventIcon type={ev.eventType} status={ev.status} />
                      <span className="text-xs">{fmtType(ev.eventType)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground/60 hidden sm:table-cell w-28">
                    {ev.patientMrn ?? '—'}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground/70 truncate max-w-sm">
                    {ev.message || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  )
}

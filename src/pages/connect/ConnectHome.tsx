import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity, AlertTriangle, CheckCircle2, Loader2, RefreshCw,
  Users, Heart, XCircle, WifiOff, Wifi, Plus, ArrowRight,
} from 'lucide-react'
import { connectApi, ConnectInstance, ConnectStats } from '../../lib/connect-api'

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

function StatusDot({ status }: { status: ConnectInstance['status'] }) {
  const color = status === 'online' ? 'bg-emerald-400' : status === 'error' ? 'bg-red-400' : 'bg-zinc-500'
  return <span className={`w-2 h-2 rounded-full shrink-0 ${color} ${status === 'online' ? 'animate-pulse' : ''}`} />
}

function StatusLabel({ status }: { status: ConnectInstance['status'] }) {
  if (status === 'online')  return <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">Online</span>
  if (status === 'error')   return <span className="text-[10px] font-semibold text-red-400 uppercase tracking-wider">Error</span>
  return <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Offline</span>
}

function StatCard({
  icon: Icon, label, value, sub, color, dot, loading,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string; value: number; sub?: string
  color: string; dot: string; loading: boolean
}) {
  return (
    <div className="rounded-xl border border-white/07 bg-card p-5 flex flex-col justify-between min-h-[110px]">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-white/05">
            <Icon className={`w-3.5 h-3.5 ${color}`} />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">{label}</p>
        </div>
        <span className={`w-2 h-2 rounded-full shrink-0 mt-0.5 ${dot}`} />
      </div>
      {loading
        ? <div className="h-9 w-16 bg-white/05 animate-pulse rounded-lg" />
        : <p className={`text-3xl font-bold tabular-nums leading-none ${color}`}>{value.toLocaleString()}</p>}
      {sub && <p className="text-[11px] text-muted-foreground mt-1.5">{sub}</p>}
    </div>
  )
}

export function ConnectHome() {
  const navigate = useNavigate()
  const [stats,     setStats]     = useState<ConnectStats | null>(null)
  const [instances, setInstances] = useState<ConnectInstance[]>([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [s, ins] = await Promise.all([connectApi.getStats(), connectApi.listInstances()])
      setStats(s)
      setInstances(ins)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">ERA Connect</h1>
          <p className="text-sm text-muted-foreground mt-0.5">EMR sync agents running at hospital sites</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load}
            className="p-2 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-white/5 transition">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => navigate('/connect/instances')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 text-sm font-medium transition">
            <Plus className="w-3.5 h-3.5" />
            Add Hospital
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Wifi}         label="Online"          value={stats?.instances.online  ?? 0} color="text-emerald-400" dot="bg-emerald-400 animate-pulse" loading={loading} />
        <StatCard icon={WifiOff}      label="Offline"         value={stats?.instances.offline ?? 0} color="text-zinc-400"    dot="bg-zinc-500"                  loading={loading} />
        <StatCard icon={XCircle}      label="Errors"          value={stats?.instances.error   ?? 0} color="text-red-400"     dot="bg-red-400"                   loading={loading} />
        <StatCard icon={Users}        label="Patients Synced" value={stats?.totals.patientsSynced   ?? 0} color="text-sky-400"     dot="bg-sky-400"              loading={loading} />
        <StatCard icon={Heart}        label="Care Plans"      value={stats?.totals.carePlansSynced  ?? 0} color="text-purple-400"  dot="bg-purple-400"           loading={loading} />
        <StatCard icon={AlertTriangle}label="Total Errors"    value={stats?.totals.errorsTotal      ?? 0} color="text-amber-400"   dot="bg-amber-400"            loading={loading} />
        <StatCard icon={Activity}     label="Total Instances" value={stats?.instances.total    ?? 0} color="text-foreground"   dot="bg-white/20"               loading={loading} />
      </div>

      {/* Instance list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground/70 uppercase tracking-wider">Hospital Instances</h2>
          <button onClick={() => navigate('/connect/instances')}
            className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition">
            Manage all <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {loading && instances.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : instances.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 p-8 text-center">
            <Wifi className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No hospital instances registered</p>
            <p className="text-xs text-muted-foreground/60 mt-1 mb-4">Add a hospital to start monitoring its ERA Connect agent</p>
            <button onClick={() => navigate('/connect/instances')}
              className="px-4 py-2 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 text-sm font-medium transition">
              Register First Hospital
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {instances.map(inst => (
              <button key={inst.id} onClick={() => navigate(`/connect/instances/${inst.id}`)}
                className="w-full rounded-xl border border-white/07 bg-card p-4 flex items-center gap-4 hover:bg-white/[0.04] transition text-left">
                <StatusDot status={inst.status} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{inst.hospitalName}</p>
                    <StatusLabel status={inst.status} />
                  </div>
                  <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                    {inst.mode === 'database' ? 'DB sync' : 'Web sync'}
                    {inst.emrEngine ? ` · ${inst.emrEngine}` : ''}
                    {inst.version   ? ` · v${inst.version}`  : ''}
                  </p>
                </div>
                <div className="text-right shrink-0 space-y-0.5">
                  <p className="text-xs text-muted-foreground/60">Last seen</p>
                  <p className="text-xs font-medium">{timeAgo(inst.lastHeartbeatAt)}</p>
                </div>
                <div className="text-right shrink-0 space-y-0.5">
                  <p className="text-xs text-emerald-400 font-semibold">{inst.patientsSynced.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground/50">patients</p>
                </div>
                {inst.errorsTotal > 0 && (
                  <div className="text-right shrink-0 space-y-0.5">
                    <p className="text-xs text-red-400 font-semibold">{inst.errorsTotal.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground/50">errors</p>
                  </div>
                )}
                <ChevronRight className="w-4 h-4 text-muted-foreground/30 shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  )
}

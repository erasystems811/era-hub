import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity, AlertTriangle, CheckCircle2, Loader2, RefreshCw,
  Users, Heart, XCircle, WifiOff, Wifi, ArrowRight,
  Upload, Pencil, Save, X,
} from 'lucide-react'
import { connectApi, ConnectInstance, ConnectStats, ConnectRelease } from '../../lib/connect-api'

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
  const color = status === 'online' ? 'bg-primary' : status === 'error' ? 'bg-red-400' : 'bg-zinc-500'
  return <span className={`w-2 h-2 rounded-full shrink-0 ${color} ${status === 'online' ? 'animate-pulse' : ''}`} />
}

function StatusLabel({ status }: { status: ConnectInstance['status'] }) {
  if (status === 'online')  return <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">Online</span>
  if (status === 'error')   return <span className="text-[10px] font-semibold text-red-400 uppercase tracking-wider">Error</span>
  return <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Offline</span>
}

function StatCard({
  icon: Icon, label, value, color, dot, loading,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string; value: number
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
    </div>
  )
}

export function ConnectHome() {
  const navigate = useNavigate()
  const [stats,     setStats]     = useState<ConnectStats | null>(null)
  const [instances, setInstances] = useState<ConnectInstance[]>([])
  const [release,   setRelease]   = useState<ConnectRelease | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')

  // Release editor
  const [editingRelease,  setEditingRelease]  = useState(false)
  const [releaseForm,     setReleaseForm]     = useState({ version: '', downloadUrl: '' })
  const [savingRelease,   setSavingRelease]   = useState(false)
  const [releaseSaved,    setReleaseSaved]    = useState(false)
  const [releaseError,    setReleaseError]    = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [s, ins, rel] = await Promise.all([
        connectApi.getStats(),
        connectApi.listInstances(),
        connectApi.getRelease(),
      ])
      setStats(s)
      setInstances(ins)
      setRelease(rel)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const startEditRelease = () => {
    setReleaseForm({
      version:     release?.version     ?? '',
      downloadUrl: release?.downloadUrl ?? '',
    })
    setReleaseError('')
    setReleaseSaved(false)
    setEditingRelease(true)
  }

  const saveRelease = async () => {
    if (!releaseForm.version.trim() || !releaseForm.downloadUrl.trim()) {
      setReleaseError('Both version and download URL are required')
      return
    }
    setSavingRelease(true)
    setReleaseError('')
    try {
      const updated = await connectApi.updateRelease(releaseForm)
      setRelease(updated)
      setReleaseSaved(true)
      setEditingRelease(false)
      setTimeout(() => setReleaseSaved(false), 4000)
    } catch (e) {
      setReleaseError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSavingRelease(false)
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">ERA Connect</h1>
          <p className="text-sm text-muted-foreground mt-0.5">EMR sync agents running at hospital sites</p>
        </div>
        <button onClick={load}
          className="p-2 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-white/5 transition">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Wifi}          label="Online"          value={stats?.instances.online        ?? 0} color="text-primary"    dot="bg-primary animate-pulse" loading={loading} />
        <StatCard icon={WifiOff}       label="Offline"         value={stats?.instances.offline       ?? 0} color="text-zinc-400"   dot="bg-zinc-500"              loading={loading} />
        <StatCard icon={XCircle}       label="Errors"          value={stats?.instances.error         ?? 0} color="text-red-400"    dot="bg-red-400"               loading={loading} />
        <StatCard icon={Users}         label="Patients Synced" value={stats?.totals.patientsSynced   ?? 0} color="text-sky-400"    dot="bg-sky-400"               loading={loading} />
        <StatCard icon={Heart}         label="Care Plans"      value={stats?.totals.carePlansSynced  ?? 0} color="text-purple-400" dot="bg-purple-400"            loading={loading} />
        <StatCard icon={AlertTriangle} label="Total Errors"    value={stats?.totals.errorsTotal      ?? 0} color="text-amber-400"  dot="bg-amber-400"             loading={loading} />
        <StatCard icon={Activity}      label="Total Instances" value={stats?.instances.total         ?? 0} color="text-foreground" dot="bg-white/20"              loading={loading} />
      </div>

      {/* Instance list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground/70 uppercase tracking-wider">Hospital Instances</h2>
          <button onClick={() => navigate('/connect/instances')}
            className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition">
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
            <p className="text-sm font-medium text-muted-foreground">No hospitals connected yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Hospitals appear here automatically once ERAConnect.exe is running
            </p>
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
                  <p className="text-xs text-primary font-semibold">{inst.patientsSynced.toLocaleString()}</p>
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

      {/* Release Management */}
      <div className="rounded-xl border border-white/07 bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Upload className="w-4 h-4 text-muted-foreground/50" />
              Release Management
            </h2>
            <p className="text-xs text-muted-foreground/60 mt-0.5">
              Publish a new ERAConnect.exe — hospitals update themselves on next restart
            </p>
          </div>
          {!editingRelease && (
            <button onClick={startEditRelease}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-xs text-muted-foreground/70 hover:text-foreground hover:bg-white/5 transition">
              <Pencil className="w-3 h-3" />
              {release?.version && release.version !== '0.0.0' ? 'Update release' : 'Publish first release'}
            </button>
          )}
        </div>

        {!editingRelease ? (
          <div className="flex items-center gap-6">
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Current Version</p>
              <p className={`text-lg font-bold tabular-nums ${release?.version && release.version !== '0.0.0' ? 'text-primary' : 'text-muted-foreground/40'}`}>
                {release?.version && release.version !== '0.0.0' ? `v${release.version}` : 'Not published'}
              </p>
            </div>
            {release?.downloadUrl && (
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Download URL</p>
                <p className="text-xs text-muted-foreground/60 truncate font-mono">{release.downloadUrl}</p>
              </div>
            )}
            {releaseSaved && (
              <div className="flex items-center gap-1.5 text-xs text-primary">
                <CheckCircle2 className="w-3.5 h-3.5" /> Published
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {releaseError && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {releaseError}
              </div>
            )}
            <div className="text-xs text-muted-foreground/60 bg-white/[0.03] border border-white/07 rounded-lg px-3 py-2">
              Steps: (1) bump <code className="text-primary">version.py</code>, (2) run <code className="text-primary">build.bat</code>, (3) upload the new exe anywhere publicly downloadable, (4) paste the URL here.
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Version *</label>
                <input
                  value={releaseForm.version}
                  onChange={e => setReleaseForm(f => ({ ...f, version: e.target.value }))}
                  placeholder="e.g. 1.0.1"
                  className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Download URL *</label>
                <input
                  value={releaseForm.downloadUrl}
                  onChange={e => setReleaseForm(f => ({ ...f, downloadUrl: e.target.value }))}
                  placeholder="https://github.com/.../releases/download/v1.0.1/ERAConnect.exe"
                  className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setEditingRelease(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition">
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
              <button onClick={saveRelease} disabled={savingRelease}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 text-sm font-medium transition disabled:opacity-50">
                {savingRelease ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Publish
              </button>
            </div>
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

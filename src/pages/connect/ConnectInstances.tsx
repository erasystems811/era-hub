import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Loader2, AlertTriangle, RefreshCw, Trash2, ArrowRight,
  Wifi, WifiOff, XCircle, Copy, Check,
} from 'lucide-react'
import { connectApi, ConnectInstance } from '../../lib/connect-api'

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

function StatusIcon({ status }: { status: ConnectInstance['status'] }) {
  if (status === 'online')  return <Wifi    className="w-4 h-4 text-primary" />
  if (status === 'error')   return <XCircle className="w-4 h-4 text-red-400" />
  return <WifiOff className="w-4 h-4 text-zinc-500" />
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button onClick={copy}
      className="p-1 rounded text-muted-foreground/40 hover:text-muted-foreground transition">
      {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  )
}

export function ConnectInstances() {
  const navigate = useNavigate()
  const [instances,     setInstances]     = useState<ConnectInstance[]>([])
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState('')
  const [deleting,      setDeleting]      = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try { setInstances(await connectApi.listInstances()) }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [])

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      await connectApi.deleteInstance(id)
      setInstances(prev => prev.filter(i => i.id !== id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed')
    } finally {
      setDeleting(null)
      setDeleteConfirm(null)
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Hospital Instances</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Hospitals appear here automatically when ERAConnect.exe phones home
          </p>
        </div>
        <button onClick={load} className="p-2 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-white/5 transition">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {loading && instances.length === 0 ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : instances.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 p-10 text-center">
          <Wifi className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No hospitals connected yet</p>
          <p className="text-xs text-muted-foreground/50 mt-1">
            Hospitals appear here automatically once ERAConnect.exe is running and connected
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/07 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/07 text-left">
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Hospital</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Mode / Engine</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Synced</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Last Seen</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Key</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/05">
              {instances.map(inst => (
                <tr key={inst.id} className="hover:bg-white/[0.03] transition">
                  <td className="px-4 py-3">
                    <button onClick={() => navigate(`/connect/instances/${inst.id}`)}
                      className="text-left hover:text-primary transition flex items-center gap-1.5">
                      <span className="font-medium">{inst.hospitalName}</span>
                      <ArrowRight className="w-3 h-3 text-muted-foreground/40" />
                    </button>
                    {inst.hospitalId && <p className="text-[11px] text-muted-foreground/50">ID: {inst.hospitalId}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <StatusIcon status={inst.status} />
                      <span className={`text-xs font-semibold capitalize ${
                        inst.status === 'online' ? 'text-primary' :
                        inst.status === 'error'  ? 'text-red-400' : 'text-zinc-500'
                      }`}>{inst.status}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-xs text-muted-foreground/70 capitalize">
                    {inst.mode}{inst.emrEngine ? ` / ${inst.emrEngine}` : ''}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="text-xs">
                      <span className="text-primary font-semibold">{inst.patientsSynced.toLocaleString()}</span>
                      <span className="text-muted-foreground/50"> pts · </span>
                      <span className="text-purple-400 font-semibold">{inst.carePlansSynced.toLocaleString()}</span>
                      <span className="text-muted-foreground/50"> plans</span>
                    </div>
                    {inst.errorsTotal > 0 && (
                      <div className="text-[11px] text-red-400">{inst.errorsTotal} errors</div>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted-foreground/70">
                    {timeAgo(inst.lastHeartbeatAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground/50">
                      <span>{inst.apiKey.slice(0, 8)}…</span>
                      <CopyButton text={inst.apiKey} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {deleteConfirm === inst.id ? (
                      <div className="flex items-center gap-2 justify-end">
                        <span className="text-xs text-red-400">Remove?</span>
                        <button onClick={() => handleDelete(inst.id)} disabled={deleting === inst.id}
                          className="text-xs text-red-400 hover:text-red-300 font-semibold">
                          {deleting === inst.id ? '…' : 'Yes'}
                        </button>
                        <button onClick={() => setDeleteConfirm(null)} className="text-xs text-muted-foreground hover:text-foreground">No</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirm(inst.id)}
                        className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-red-400 hover:bg-red-500/10 transition">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

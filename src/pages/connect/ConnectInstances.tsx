import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Loader2, AlertTriangle, RefreshCw, Trash2, ArrowRight,
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
  if (status === 'online')  return <Wifi   className="w-4 h-4 text-emerald-400" />
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
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  )
}

// ── Register modal ─────────────────────────────────────────────

function RegisterModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (inst: ConnectInstance) => void
}) {
  const [form, setForm] = useState({
    hospitalName: '',
    hospitalId:   '',
    mode:         'database',
    emrEngine:    '',
  })
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')
  const [created, setCreated] = useState<ConnectInstance | null>(null)

  const submit = async () => {
    if (!form.hospitalName.trim()) { setError('Hospital name is required'); return }
    setSaving(true)
    setError('')
    try {
      const inst = await connectApi.createInstance({
        hospitalName: form.hospitalName.trim(),
        hospitalId:   form.hospitalId.trim() || undefined,
        mode:         form.mode,
        emrEngine:    form.emrEngine.trim() || undefined,
      })
      setCreated(inst)
      onCreated(inst)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to register')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">

        {!created ? (
          <>
            <h2 className="text-base font-bold">Register Hospital</h2>
            <p className="text-sm text-muted-foreground -mt-3">
              This generates a secret key you paste into the hospital's ERA Connect setup.
            </p>

            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {error}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Hospital Name *</label>
                <input
                  value={form.hospitalName}
                  onChange={e => setForm(f => ({ ...f, hospitalName: e.target.value }))}
                  placeholder="e.g. General Hospital Lagos"
                  className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">ERA Patient Hospital ID (optional)</label>
                <input
                  value={form.hospitalId}
                  onChange={e => setForm(f => ({ ...f, hospitalId: e.target.value }))}
                  placeholder="From ERA Patient dashboard"
                  className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Mode</label>
                  <select
                    value={form.mode}
                    onChange={e => setForm(f => ({ ...f, mode: e.target.value }))}
                    className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500/50">
                    <option value="database">Database</option>
                    <option value="browser">Browser</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">EMR Engine</label>
                  <input
                    value={form.emrEngine}
                    onChange={e => setForm(f => ({ ...f, emrEngine: e.target.value }))}
                    placeholder="mysql, mssql…"
                    className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-1">
              <button onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition">
                Cancel
              </button>
              <button onClick={submit} disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 text-sm font-medium transition disabled:opacity-50">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Register
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-base font-bold text-emerald-400">Hospital Registered</h2>
            <p className="text-sm text-muted-foreground -mt-3">
              Copy the API key below and paste it into the ERA Connect setup window on the hospital's computer.
            </p>

            <div className="rounded-lg border border-white/10 bg-background p-4 space-y-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">API Key (show once)</p>
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono text-emerald-400 break-all flex-1">{created.apiKey}</code>
                <CopyButton text={created.apiKey} />
              </div>
            </div>

            <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
              Save this key now. It will not be shown again in full.
            </div>

            <div className="flex justify-end">
              <button onClick={onClose}
                className="px-4 py-2 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 text-sm font-medium transition">
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────

export function ConnectInstances() {
  const navigate = useNavigate()
  const [instances,    setInstances]    = useState<ConnectInstance[]>([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')
  const [showRegister, setShowRegister] = useState(false)
  const [deleting,     setDeleting]     = useState<string | null>(null)
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
          <p className="text-sm text-muted-foreground mt-0.5">Manage and register ERA Connect installations</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-white/5 transition">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowRegister(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 text-sm font-medium transition">
            <Plus className="w-3.5 h-3.5" />
            Register Hospital
          </button>
        </div>
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
          <p className="text-sm font-medium text-muted-foreground">No instances registered</p>
          <button onClick={() => setShowRegister(true)}
            className="mt-4 px-4 py-2 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 text-sm font-medium transition">
            Register First Hospital
          </button>
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
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">API Key</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/05">
              {instances.map(inst => (
                <tr key={inst.id} className="hover:bg-white/[0.03] transition">
                  <td className="px-4 py-3">
                    <button onClick={() => navigate(`/connect/instances/${inst.id}`)}
                      className="text-left hover:text-emerald-400 transition flex items-center gap-1.5">
                      <span className="font-medium">{inst.hospitalName}</span>
                      <ArrowRight className="w-3 h-3 text-muted-foreground/40" />
                    </button>
                    {inst.hospitalId && <p className="text-[11px] text-muted-foreground/50">ID: {inst.hospitalId}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <StatusIcon status={inst.status} />
                      <span className={`text-xs font-semibold capitalize ${
                        inst.status === 'online' ? 'text-emerald-400' :
                        inst.status === 'error'  ? 'text-red-400' : 'text-zinc-500'
                      }`}>{inst.status}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-xs text-muted-foreground/70 capitalize">
                    {inst.mode}{inst.emrEngine ? ` / ${inst.emrEngine}` : ''}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="text-xs">
                      <span className="text-emerald-400 font-semibold">{inst.patientsSynced.toLocaleString()}</span>
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
                        <span className="text-xs text-red-400">Delete?</span>
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

      {showRegister && (
        <RegisterModal
          onClose={() => setShowRegister(false)}
          onCreated={(inst) => {
            setInstances(prev => [inst, ...prev])
          }}
        />
      )}
    </div>
  )
}

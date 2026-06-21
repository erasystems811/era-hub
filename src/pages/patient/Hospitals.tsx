import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Building2, CheckCircle2, XCircle, ChevronRight, Loader2 } from 'lucide-react'
import { patientApi, Hospital } from '../../lib/patient-api'
import { fmtDate, fmtMoney } from '../../lib/utils'
import { pageCache } from '../../lib/cache'

interface CreateForm { name: string; username: string; subscriptionStatus: string }

function CreateHospitalModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState<CreateForm>({ name: '', username: '', subscriptionStatus: 'active' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setLoading(true); setError(null)
    try { await patientApi.createHospital(form); onCreated(); onClose() }
    catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-[rgba(255,255,255,0.09)] backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl">
        <div className="px-6 py-5 border-b border-white/08">
          <h2 className="font-semibold text-foreground text-base">Register hospital</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Add a new hospital account to ERA Patient</p>
        </div>
        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</div>
          )}
          <div>
            <label className="label">Hospital name</label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="City General Hospital" />
          </div>
          <div>
            <label className="label">Login username</label>
            <input className="input" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="citygeneralhospital" />
          </div>
          <div>
            <label className="label">Subscription status</label>
            <select className="input" value={form.subscriptionStatus} onChange={e => setForm(f => ({ ...f, subscriptionStatus: e.target.value }))}>
              <option value="active">Active</option>
              <option value="trial">Trial</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-white/08 flex gap-2 justify-end">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={!form.name || !form.username || loading} onClick={submit}>
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : 'Create hospital'}
          </button>
        </div>
      </div>
    </div>
  )
}

const SUB_BADGE: Record<string, string> = {
  active:    'bg-teal/10 text-teal border-teal/20',
  trial:     'bg-amber-500/10 text-amber-400 border-amber-500/20',
  expired:   'bg-red-500/10 text-red-400 border-red-500/20',
  suspended: 'bg-red-500/10 text-red-400 border-red-500/20',
}

export function Hospitals() {
  const [hospitals, setHospitals] = useState<Hospital[]>(() => pageCache.get<Hospital[]>('hospitals') ?? [])
  const [loading, setLoading] = useState(() => !pageCache.get('hospitals'))
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const nav = useNavigate()

  const load = async () => {
    setLoading(true)
    try { const data = await patientApi.listHospitals(); pageCache.set('hospitals', data); setHospitals(data) }
    finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [])

  const filtered = hospitals.filter(h =>
    h.name.toLowerCase().includes(search.toLowerCase()) ||
    h.username.toLowerCase().includes(search.toLowerCase())
  )

  const active    = hospitals.filter(h => h.active && h.subscriptionStatus === 'active').length
  const trial     = hospitals.filter(h => h.subscriptionStatus === 'trial').length
  const suspended = hospitals.filter(h => !h.active || h.subscriptionStatus === 'suspended' || h.subscriptionStatus === 'expired').length

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="page-title">Hospitals</h1>
          <p className="caption mt-0.5">{hospitals.length} hospital{hospitals.length !== 1 ? 's' : ''} registered on ERA Patient</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" /> Add hospital
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total',     value: hospitals.length, color: 'text-foreground' },
          { label: 'Active',    value: active,           color: 'text-teal' },
          { label: 'Trial',     value: trial,            color: 'text-amber-400' },
          { label: 'Suspended', value: suspended,        color: 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-white/08 bg-card px-5 py-4">
            <p className="text-xs text-muted-foreground font-medium mb-1">{s.label}</p>
            <p className={`text-2xl font-bold tabular-nums ${s.color}`}>{loading ? '—' : s.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
        <input className="input pl-10" placeholder="Search by name or username…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading hospitals…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/07 bg-card flex flex-col items-center justify-center py-16 gap-3">
          <Building2 className="w-10 h-10 text-muted-foreground/20" />
          <p className="font-semibold text-foreground">{search ? 'No hospitals match your search' : 'No hospitals yet'}</p>
          <p className="caption text-sm">{search ? 'Try a different name or username' : 'Register your first hospital to get started'}</p>
          {!search && <button className="btn-primary mt-1" onClick={() => setShowCreate(true)}>Add hospital</button>}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/07 bg-card overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: 580 }}>
            <thead>
              <tr className="border-b border-white/07">
                {['Hospital', 'Subscription', 'Patients', 'Wallet', 'Added', ''].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-5 py-3.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/05">
              {filtered.map(h => (
                <tr key={h.id} className="hover:bg-white/[0.025] cursor-pointer transition-colors group"
                  onClick={() => nav(`/patient/hospitals/${h.id}`)}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-teal/10 text-teal text-sm font-bold flex items-center justify-center shrink-0">
                        {h.name[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate max-w-[200px]">{h.name}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">{h.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border capitalize ${SUB_BADGE[h.subscriptionStatus] ?? 'bg-white/06 text-muted-foreground border-white/10'}`}>
                      {h.subscriptionStatus}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-foreground font-medium tabular-nums">{h.patientCount.toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-muted-foreground tabular-nums">{fmtMoney(h.walletBalanceKobo)}</td>
                  <td className="px-5 py-3.5 text-muted-foreground text-xs whitespace-nowrap">{fmtDate(h.createdAt)}</td>
                  <td className="px-5 py-3.5">
                    <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-teal transition-colors ml-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {showCreate && <CreateHospitalModal onClose={() => setShowCreate(false)} onCreated={load} />}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Building2, CheckCircle, XCircle } from 'lucide-react'
import { Glass } from '../../components/Glass'
import { patientApi, Hospital } from '../../lib/patient-api'
import { fmtDate, fmtMoney } from '../../lib/utils'

interface CreateForm { name: string; username: string; subscriptionStatus: string }

function CreateHospitalModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState<CreateForm>({ name: '', username: '', subscriptionStatus: 'active' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setLoading(true); setError(null)
    try {
      await patientApi.createHospital(form)
      onCreated(); onClose()
    } catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <Glass className="w-[420px]">
        <h2 className="section-title mb-5">Add a hospital</h2>
        {error && <div className="mb-4 text-sm text-rose">{error}</div>}
        <div className="space-y-4">
          <div>
            <label className="label">Hospital name</label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="City General Hospital" />
          </div>
          <div>
            <label className="label">Login username</label>
            <input className="input" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="citygeneralhospital" />
          </div>
          <div>
            <label className="label">Subscription</label>
            <select className="input" value={form.subscriptionStatus} onChange={e => setForm(f => ({ ...f, subscriptionStatus: e.target.value }))}>
              <option value="active">Active</option>
              <option value="trial">Trial</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2 mt-6">
          <button className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
          <button className="btn-primary flex-1" disabled={!form.name || !form.username || loading} onClick={submit}>
            {loading ? 'Creating…' : 'Create hospital'}
          </button>
        </div>
      </Glass>
    </div>
  )
}

export function Hospitals() {
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const nav = useNavigate()

  const load = async () => {
    setLoading(true)
    try { setHospitals(await patientApi.listHospitals()) } finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [])

  const filtered = hospitals.filter(h =>
    h.name.toLowerCase().includes(search.toLowerCase()) ||
    h.username.toLowerCase().includes(search.toLowerCase())
  )

  const subsLabel: Record<string, string> = {
    active: 'Active', trial: 'Trial', expired: 'Expired', suspended: 'Suspended',
  }
  const subsColor: Record<string, string> = {
    active: 'text-teal', trial: 'text-amber-500', expired: 'text-rose', suspended: 'text-rose',
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Hospitals</h1>
          <p className="caption mt-0.5">{hospitals.length} hospital{hospitals.length !== 1 ? 's' : ''} registered</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" /> Add hospital
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-soft opacity-50" />
        <input
          className="input pl-10"
          placeholder="Search hospitals…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-center py-16 text-charcoal-soft">Loading hospitals…</div>
      ) : filtered.length === 0 ? (
        <Glass className="text-center py-12">
          <Building2 className="w-10 h-10 text-pink mx-auto mb-3 opacity-40" />
          <p className="font-medium text-charcoal">{search ? 'No hospitals match your search' : 'No hospitals yet'}</p>
          <p className="caption mt-1">{search ? 'Try a different name' : 'Add your first hospital to get started'}</p>
          {!search && (
            <button className="btn-primary mt-4" onClick={() => setShowCreate(true)}>Add hospital</button>
          )}
        </Glass>
      ) : (
        <div className="glass overflow-hidden" style={{ padding: 0 }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(233,145,200,0.2)' }}>
                {['Hospital', 'Subscription', 'Patients', 'Wallet', 'Added', ''].map(h => (
                  <th key={h} className="text-left text-xs text-charcoal-soft font-medium px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(h => (
                <tr
                  key={h.id}
                  className="border-b border-pink-border last:border-0 hover:bg-pink-light cursor-pointer transition-colors"
                  onClick={() => nav(`/patient/hospitals/${h.id}`)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      {h.active
                        ? <CheckCircle className="w-4 h-4 text-teal shrink-0" />
                        : <XCircle className="w-4 h-4 text-rose shrink-0" />}
                      <div>
                        <div className="font-medium text-charcoal">{h.name}</div>
                        <div className="text-xs text-charcoal-soft">{h.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-medium ${subsColor[h.subscriptionStatus] ?? 'text-charcoal-soft'}`}>
                      {subsLabel[h.subscriptionStatus] ?? h.subscriptionStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-charcoal-soft">{h.patientCount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-charcoal-soft">{fmtMoney(h.walletBalanceKobo)}</td>
                  <td className="px-4 py-3 text-charcoal-soft">{fmtDate(h.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-xs text-teal font-medium">View →</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && <CreateHospitalModal onClose={() => setShowCreate(false)} onCreated={load} />}
    </div>
  )
}

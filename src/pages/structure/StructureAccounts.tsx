import { useEffect, useState } from 'react'
import { structureApi, Business, BusinessType } from '../../lib/structure-api'
import { Plus, ChevronRight, Search } from 'lucide-react'
import { StatusDot } from '../../components/StatusDot'

const STAGES = { assessment: 'Assessment', guide: 'Guide', maintenance: 'Maintenance' }

export function StructureAccounts() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [types, setTypes] = useState<BusinessType[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', owner_name: '', owner_phone: '', owner_email: '', business_type_id: '', password: '' })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    Promise.all([structureApi.listBusinesses(), structureApi.listBusinessTypes()])
      .then(([biz, t]) => { setBusinesses(biz); setTypes(t) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = businesses.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.owner_name.toLowerCase().includes(search.toLowerCase()) ||
    b.owner_email.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreate = async () => {
    setFormError('')
    if (!form.name || !form.owner_name || !form.owner_email || !form.business_type_id || !form.password) {
      setFormError('All fields required except phone.')
      return
    }
    setSaving(true)
    try {
      const result = await structureApi.createBusiness(form)
      setBusinesses(prev => [result.business, ...prev])
      setShowForm(false)
      setForm({ name: '', owner_name: '', owner_phone: '', owner_email: '', business_type_id: '', password: '' })
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground">Accounts</h1>
          <p className="text-xs text-muted-foreground/50 mt-0.5">{businesses.length} active clients</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold text-background bg-[#C9952B] hover:bg-[#C9952B]/90 transition"
        >
          <Plus className="w-4 h-4" /> New Account
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="rounded-xl border border-[#C9952B]/25 bg-[#C9952B]/5 p-4 space-y-3">
          <p className="text-sm font-semibold text-[#C9952B]">Create Client Account</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'name',           label: 'Business Name',   type: 'text' },
              { key: 'owner_name',     label: 'Owner Name',      type: 'text' },
              { key: 'owner_email',    label: 'Owner Email',     type: 'email' },
              { key: 'owner_phone',    label: 'Phone (optional)',type: 'tel' },
              { key: 'password',       label: 'Password',        type: 'password' },
            ].map(({ key, label, type }) => (
              <div key={key}>
                <label className="text-[11px] text-muted-foreground/50 block mb-1">{label}</label>
                <input
                  type={type}
                  value={form[key as keyof typeof form]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full px-3 py-1.5 rounded-lg text-sm bg-white/[0.05] border border-white/10 text-foreground placeholder-muted-foreground/30 focus:outline-none focus:border-[#C9952B]/50"
                />
              </div>
            ))}
            <div>
              <label className="text-[11px] text-muted-foreground/50 block mb-1">Business Type</label>
              <select
                value={form.business_type_id}
                onChange={e => setForm(f => ({ ...f, business_type_id: e.target.value }))}
                className="w-full px-3 py-1.5 rounded-lg text-sm bg-white/[0.05] border border-white/10 text-foreground focus:outline-none focus:border-[#C9952B]/50"
              >
                <option value="">Select type…</option>
                {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
          {formError && <p className="text-xs text-red-400">{formError}</p>}
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={saving}
              className="px-4 py-1.5 rounded-lg text-sm font-semibold text-background bg-[#C9952B] hover:bg-[#C9952B]/90 disabled:opacity-50 transition">
              {saving ? 'Creating…' : 'Create Account'}
            </button>
            <button onClick={() => { setShowForm(false); setFormError('') }}
              className="px-4 py-1.5 rounded-lg text-sm text-muted-foreground border border-white/10 hover:text-foreground transition">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/35" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, owner or email…"
          className="w-full pl-9 pr-4 py-2 rounded-lg text-sm bg-white/[0.04] border border-white/08 text-foreground placeholder-muted-foreground/30 focus:outline-none focus:border-[#C9952B]/40"
        />
      </div>

      {error && <div className="text-sm text-red-400 bg-red-500/5 border border-red-500/20 rounded-lg px-4 py-3">{error}</div>}

      <div className="rounded-xl border border-white/08 bg-white/[0.03] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground/40">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground/40">
            {search ? 'No results' : 'No clients yet — create the first account above.'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/07">
                {['Business', 'Owner', 'Type', 'Stage', 'Status', ''].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground/40 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/05">
              {filtered.map(b => {
                const typeName = (b.business_types as { name: string } | null)?.name ?? '—'
                return (
                  <tr key={b.id} className="hover:bg-white/[0.03] transition">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{b.name}</p>
                      <p className="text-[11px] text-muted-foreground/40">{b.owner_email}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground/70">{b.owner_name}</td>
                    <td className="px-4 py-3 text-muted-foreground/60 text-[12px]">{typeName}</td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#C9952B]/10 text-[#C9952B] font-medium">
                        {STAGES[b.stage]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusDot status={b.is_locked ? 'error' : 'ok'} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ChevronRight className="w-4 h-4 text-muted-foreground/25 ml-auto" />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

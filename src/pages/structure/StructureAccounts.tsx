import { useEffect, useState } from 'react'
import { structureApi, Business, BusinessType } from '../../lib/structure-api'
import { Plus, Search, Eye, EyeOff, X, Save, Lock, Unlock, Trash2 } from 'lucide-react'
import { StatusDot } from '../../components/StatusDot'

const STAGES = ['assessment', 'guide', 'maintenance'] as const
const STAGE_LABEL: Record<string, string> = { assessment: 'Assessment', guide: 'Guide', maintenance: 'Maintenance' }

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] text-muted-foreground/50 block mb-1">{label}</label>
      {children}
    </div>
  )
}

const INPUT = 'w-full px-3 py-1.5 rounded-lg text-sm bg-white/[0.05] border border-white/10 text-foreground placeholder-muted-foreground/30 focus:outline-none focus:border-[#C9952B]/50'
const SELECT = INPUT + ' appearance-none'

export function StructureAccounts() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [types, setTypes] = useState<BusinessType[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Create form
  const [showCreate, setShowCreate] = useState(false)
  const [create, setCreate] = useState({ name: '', owner_name: '', owner_phone: '', owner_email: '', business_type_id: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createErr, setCreateErr] = useState('')

  // Edit panel
  const [editing, setEditing] = useState<Business | null>(null)
  const [edit, setEdit] = useState({ name: '', owner_name: '', owner_phone: '', business_type_id: '', stage: '', is_locked: false, new_password: '' })
  const [showEditPw, setShowEditPw] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveErr, setSaveErr] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

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

  const openEdit = (b: Business) => {
    setEditing(b)
    setEdit({ name: b.name, owner_name: b.owner_name, owner_phone: b.owner_phone ?? '', business_type_id: b.business_type_id, stage: b.stage, is_locked: b.is_locked, new_password: '' })
    setSaveErr('')
    setShowEditPw(false)
    setConfirmDelete(false)
  }

  const handleDelete = async () => {
    if (!editing) return
    setDeleting(true)
    try {
      await structureApi.deleteBusiness(editing.id)
      setBusinesses(prev => prev.filter(b => b.id !== editing.id))
      setEditing(null)
    } catch (e) {
      setSaveErr(e instanceof Error ? e.message : 'Delete failed')
    } finally {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  const handleCreate = async () => {
    setCreateErr('')
    if (!create.name || !create.owner_name || !create.owner_email || !create.business_type_id || !create.password) {
      setCreateErr('All fields required except phone.')
      return
    }
    setCreating(true)
    try {
      const result = await structureApi.createBusiness(create)
      setBusinesses(prev => [result.business, ...prev])
      setShowCreate(false)
      setCreate({ name: '', owner_name: '', owner_phone: '', owner_email: '', business_type_id: '', password: '' })
    } catch (e) {
      setCreateErr(e instanceof Error ? e.message : 'Failed')
    } finally {
      setCreating(false)
    }
  }

  const handleSave = async () => {
    if (!editing) return
    setSaveErr('')
    setSaving(true)
    try {
      const result = await structureApi.updateBusiness({ id: editing.id, ...edit, new_password: edit.new_password || undefined })
      setBusinesses(prev => prev.map(b => b.id === editing.id ? result.business : b))
      setEditing(null)
    } catch (e) {
      setSaveErr(e instanceof Error ? e.message : 'Failed')
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
        <button onClick={() => { setShowCreate(true); setCreateErr('') }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold text-background bg-[#C9952B] hover:bg-[#C9952B]/90 transition">
          <Plus className="w-4 h-4" /> New Account
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="rounded-xl border border-[#C9952B]/25 bg-[#C9952B]/5 p-4 space-y-3">
          <p className="text-sm font-semibold text-[#C9952B]">Create Client Account</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Business Name">
              <input className={INPUT} value={create.name} onChange={e => setCreate(f => ({ ...f, name: e.target.value }))} />
            </Field>
            <Field label="Owner Name">
              <input className={INPUT} value={create.owner_name} onChange={e => setCreate(f => ({ ...f, owner_name: e.target.value }))} />
            </Field>
            <Field label="Owner Email">
              <input className={INPUT} type="email" value={create.owner_email} onChange={e => setCreate(f => ({ ...f, owner_email: e.target.value }))} />
            </Field>
            <Field label="Phone (optional)">
              <input className={INPUT} type="tel" value={create.owner_phone} onChange={e => setCreate(f => ({ ...f, owner_phone: e.target.value }))} />
            </Field>
            <Field label="Password">
              <div className="relative">
                <input
                  className={INPUT + ' pr-9'}
                  type={showPw ? 'text' : 'password'}
                  value={create.password}
                  onChange={e => setCreate(f => ({ ...f, password: e.target.value }))}
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground transition">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Field>
            <Field label="Business Type">
              <select className={SELECT} value={create.business_type_id} onChange={e => setCreate(f => ({ ...f, business_type_id: e.target.value }))}>
                <option value="">Select type…</option>
                {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </Field>
          </div>
          {createErr && <p className="text-xs text-red-400">{createErr}</p>}
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={creating}
              className="px-4 py-1.5 rounded-lg text-sm font-semibold text-background bg-[#C9952B] hover:bg-[#C9952B]/90 disabled:opacity-50 transition">
              {creating ? 'Creating…' : 'Create Account'}
            </button>
            <button onClick={() => setShowCreate(false)}
              className="px-4 py-1.5 rounded-lg text-sm text-muted-foreground border border-white/10 hover:text-foreground transition">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Edit panel */}
      {editing && (
        <div className="rounded-xl border border-white/12 bg-white/[0.03] p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Edit — {editing.name}</p>
            <button onClick={() => setEditing(null)} className="text-muted-foreground/40 hover:text-muted-foreground transition">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Business Name">
              <input className={INPUT} value={edit.name} onChange={e => setEdit(f => ({ ...f, name: e.target.value }))} />
            </Field>
            <Field label="Owner Name">
              <input className={INPUT} value={edit.owner_name} onChange={e => setEdit(f => ({ ...f, owner_name: e.target.value }))} />
            </Field>
            <Field label="Phone">
              <input className={INPUT} type="tel" value={edit.owner_phone} onChange={e => setEdit(f => ({ ...f, owner_phone: e.target.value }))} />
            </Field>
            <Field label="Business Type">
              <select className={SELECT} value={edit.business_type_id} onChange={e => setEdit(f => ({ ...f, business_type_id: e.target.value }))}>
                {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </Field>
            <Field label="Stage">
              <select className={SELECT} value={edit.stage} onChange={e => setEdit(f => ({ ...f, stage: e.target.value }))}>
                {STAGES.map(s => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
              </select>
            </Field>
            <Field label="New Password (leave blank to keep)">
              <div className="relative">
                <input
                  className={INPUT + ' pr-9'}
                  type={showEditPw ? 'text' : 'password'}
                  value={edit.new_password}
                  placeholder="Leave blank to keep current"
                  onChange={e => setEdit(f => ({ ...f, new_password: e.target.value }))}
                />
                <button type="button" onClick={() => setShowEditPw(v => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground transition">
                  {showEditPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Field>
          </div>
          <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEdit(f => ({ ...f, is_locked: !f.is_locked }))}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                  edit.is_locked
                    ? 'text-red-400 border-red-500/30 bg-red-500/5 hover:bg-red-500/10'
                    : 'text-[#4DBFB3] border-[#4DBFB3]/30 bg-[#4DBFB3]/5 hover:bg-[#4DBFB3]/10'
                }`}>
                {edit.is_locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                {edit.is_locked ? 'Locked' : 'Active'}
              </button>
              {!confirmDelete ? (
                <button onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-red-400">Sure?</span>
                  <button onClick={handleDelete} disabled={deleting}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 transition">
                    {deleting ? 'Deleting…' : 'Yes, delete'}
                  </button>
                  <button onClick={() => setConfirmDelete(false)} className="text-xs text-muted-foreground hover:text-foreground transition">No</button>
                </div>
              )}
            </div>
            <div className="flex gap-2 items-center">
              {saveErr && <p className="text-xs text-red-400">{saveErr}</p>}
              <button onClick={() => setEditing(null)} className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground border border-white/10 hover:text-foreground transition">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold text-background bg-[#C9952B] hover:bg-[#C9952B]/90 disabled:opacity-50 transition">
                <Save className="w-3.5 h-3.5" /> {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/35" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, owner or email…"
          className="w-full pl-9 pr-4 py-2 rounded-lg text-sm bg-white/[0.04] border border-white/08 text-foreground placeholder-muted-foreground/30 focus:outline-none focus:border-[#C9952B]/40" />
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
                  <tr key={b.id} className="hover:bg-white/[0.03] transition cursor-pointer" onClick={() => openEdit(b)}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{b.name}</p>
                      <p className="text-[11px] text-muted-foreground/40">{b.owner_email}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground/70">{b.owner_name}</td>
                    <td className="px-4 py-3 text-muted-foreground/60 text-[12px]">{typeName}</td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#C9952B]/10 text-[#C9952B] font-medium">
                        {STAGE_LABEL[b.stage]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusDot status={b.is_locked ? 'error' : 'ok'} />
                    </td>
                    <td className="px-4 py-3 text-right text-[11px] text-[#C9952B] font-medium">Edit</td>
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

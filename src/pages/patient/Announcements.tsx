import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Globe, Building2, SendHorizonal, Loader2, AlertCircle, ChevronDown } from 'lucide-react'
import { patientApi, Announcement, Hospital } from '../../lib/patient-api'
import { pageCache } from '../../lib/cache'

const TYPE_OPTS = [
  { value: 'info',    label: 'Info',    color: 'text-blue-400  bg-blue-500/10  border-blue-500/20' },
  { value: 'warning', label: 'Warning', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  { value: 'update',  label: 'Update',  color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
] as const

function typeBadge(t: string) {
  return TYPE_OPTS.find(x => x.value === t) ?? TYPE_OPTS[0]
}

function fmtDate(s: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' })
}

function AnnouncementModal({ ann, hospitals, onClose, onSave }: {
  ann: Announcement | null
  hospitals: Hospital[]
  onClose: () => void
  onSave: () => void
}) {
  const [title, setTitle] = useState(ann?.title ?? '')
  const [message, setMessage] = useState(ann?.message ?? '')
  const [type, setType] = useState<string>(ann?.type ?? 'info')
  const [hospitalId, setHospitalId] = useState<number | null>(ann?.hospitalId ?? null)
  const [expiresAt, setExpiresAt] = useState(ann?.expiresAt ? ann.expiresAt.slice(0, 10) : '')
  const [targetModule, setTargetModule] = useState(ann?.targetModule ?? '')
  const [publish, setPublish] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setSaving(true); setError(null)
    try {
      const payload = {
        title, message, type,
        hospitalId: hospitalId || null,
        expiresAt: expiresAt || null,
        targetModule: targetModule || null,
        publish,
      }
      if (ann) await patientApi.updateAnnouncement(ann.id, payload)
      else await patientApi.createAnnouncement(payload)
      onSave()
      onClose()
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-[#1a1624] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-5 border-b border-white/08">
          <h2 className="font-semibold text-foreground">{ann ? 'Edit announcement' : 'New announcement'}</h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">{error}</p>}
          <div>
            <label className="label">Title</label>
            <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Scheduled maintenance tonight" />
          </div>
          <div>
            <label className="label">Message</label>
            <textarea className="input resize-none" rows={4} value={message} onChange={e => setMessage(e.target.value)} placeholder="Write the announcement body…" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Type</label>
              <select className="input" value={type} onChange={e => setType(e.target.value)}>
                {TYPE_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Expires</label>
              <input className="input" type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Target (leave blank to send to all)</label>
            <select className="input" value={hospitalId ?? ''} onChange={e => setHospitalId(e.target.value ? Number(e.target.value) : null)}>
              <option value="">All hospitals</option>
              {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Restrict to module (optional)</label>
            <input className="input" value={targetModule} onChange={e => setTargetModule(e.target.value)} placeholder="appointments, feedback, …" />
          </div>
          {!ann && (
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={publish} onChange={e => setPublish(e.target.checked)} className="accent-primary w-4 h-4" />
              <span className="text-sm text-muted-foreground">Publish immediately</span>
            </label>
          )}
        </div>
        <div className="px-6 py-4 border-t border-white/08 flex gap-2 justify-end">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={!title || !message || saving} onClick={submit}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : ann ? 'Save' : publish ? 'Create & Publish' : 'Create draft'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function Announcements() {
  const [items, setItems] = useState<Announcement[]>(() => pageCache.get<Announcement[]>('patient:announcements') ?? [])
  const [hospitals, setHospitals] = useState<Hospital[]>(() => pageCache.get<Hospital[]>('hospitals') ?? [])
  const [loading, setLoading] = useState(() => !pageCache.get('patient:announcements'))
  const [drafting, setDrafting] = useState(false)
  const [publishing, setPublishing] = useState<number | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [editing, setEditing] = useState<Announcement | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const [anns, hosps] = await Promise.all([patientApi.listAnnouncements(), patientApi.listHospitals()])
      pageCache.set('patient:announcements', anns)
      pageCache.set('hospitals', hosps)
      setItems(anns); setHospitals(hosps)
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [])

  const publish = async (id: number) => {
    setPublishing(id); setError(null)
    try { await patientApi.publishAnnouncement(id); pageCache.bust('patient:announcements'); await load() }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed to publish') }
    finally { setPublishing(null) }
  }

  const remove = async (id: number) => {
    if (!confirm('Delete this announcement?')) return
    setDeleting(id); setError(null)
    try { await patientApi.deleteAnnouncement(id); pageCache.bust('patient:announcements'); await load() }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed to delete') }
    finally { setDeleting(null) }
  }

  const autoDraft = async () => {
    setDrafting(true); setError(null)
    try { await patientApi.autoDraftAnnouncements(); await load() }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed to auto-draft') }
    finally { setDrafting(false) }
  }

  const published = items.filter(a => a.published)
  const drafts    = items.filter(a => !a.published)

  function Section({ label, list }: { label: string; list: Announcement[] }) {
    if (!loading && list.length === 0) return null
    return (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{label}</h2>
          <span className="text-xs text-muted-foreground/40">{list.length}</span>
        </div>
        <div className="rounded-xl border border-white/07 bg-card overflow-hidden">
          {list.map((a, idx) => {
            const badge = typeBadge(a.type)
            const expanded = expandedId === a.id
            return (
              <div key={a.id} className={idx ? 'border-t border-white/07' : ''}>
                <div className="flex items-start gap-3 px-5 py-4 hover:bg-white/[0.03] transition-colors cursor-pointer"
                  onClick={() => setExpandedId(expanded ? null : a.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${badge.color}`}>{badge.label}</span>
                      {!a.published && <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">Draft</span>}
                      {a.hospitalId
                        ? <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><Building2 className="w-2.5 h-2.5" />{a.hospitalName}</span>
                        : <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><Globe className="w-2.5 h-2.5" />All hospitals</span>}
                    </div>
                    <p className="font-semibold text-foreground text-sm mt-1.5">{a.title}</p>
                    {!expanded && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{a.message}</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-xs text-muted-foreground/40">{fmtDate(a.createdAt)}</span>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>
                {expanded && (
                  <div className="px-5 pb-4 border-t border-white/05">
                    <p className="text-sm text-muted-foreground mt-3 leading-relaxed whitespace-pre-wrap">{a.message}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground/40">
                      <span>Created: {fmtDate(a.createdAt)}</span>
                      {a.publishedAt && <span>Published: {fmtDate(a.publishedAt)}</span>}
                      {a.expiresAt && <span>Expires: {fmtDate(a.expiresAt)}</span>}
                      {a.targetModule && <span>Module: {a.targetModule}</span>}
                    </div>
                    <div className="flex gap-2 mt-4">
                      {!a.published && (
                        <button className="btn-primary text-xs flex items-center gap-1.5" disabled={!!publishing}
                          onClick={e => { e.stopPropagation(); void publish(a.id) }}>
                          {publishing === a.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <SendHorizonal className="w-3.5 h-3.5" />}
                          Publish now
                        </button>
                      )}
                      <button className="btn-secondary text-xs flex items-center gap-1.5"
                        onClick={e => { e.stopPropagation(); setEditing(a); setIsNew(false) }}>
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button className="btn-danger text-xs flex items-center gap-1.5" disabled={deleting === a.id}
                        onClick={e => { e.stopPropagation(); void remove(a.id) }}>
                        {deleting === a.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">Announcements</h1>
          <p className="caption mt-0.5">Push notices to all hospitals or specific ones</p>
        </div>
        <div className="flex gap-2">
          <button onClick={autoDraft} disabled={drafting}
            className="btn-secondary text-xs flex items-center gap-1.5">
            {drafting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            AI auto-draft
          </button>
          <button className="btn-primary text-sm flex items-center gap-2" onClick={() => { setEditing(null); setIsNew(true) }}>
            <Plus className="w-4 h-4" /> New announcement
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Total',     value: loading ? null : items.length,     color: 'text-foreground' },
          { label: 'Published', value: loading ? null : published.length, color: 'text-teal' },
          { label: 'Drafts',    value: loading ? null : drafts.length,    color: 'text-amber-400' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-white/07 bg-card px-4 py-3.5">
            <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
            <p className={`text-2xl font-bold tabular-nums mt-0.5 ${s.color}`}>{s.value ?? '—'}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-400 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground rounded-xl border border-white/07">
          <SendHorizonal className="w-8 h-8 opacity-20" />
          <p className="text-sm">No announcements yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          <Section label="Published" list={published} />
          <Section label="Drafts" list={drafts} />
        </div>
      )}

      {(isNew || editing !== null) && (
        <AnnouncementModal
          ann={isNew ? null : editing}
          hospitals={hospitals}
          onClose={() => { setEditing(null); setIsNew(false) }}
          onSave={load}
        />
      )}
    </div>
  )
}

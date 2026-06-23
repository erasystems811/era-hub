import { useState, useEffect } from 'react'
import { Plus, Loader2, AlertCircle, Trash2, FileText, Save, X, Eye } from 'lucide-react'
import { emailApi, commsApi, type EmailTemplate, type Client } from '../../lib/comms-api'
import { fmtDate } from '../../lib/utils'
import { EmailTabs } from './EmailOverview'

function TemplateEditor({
  clients, onSaved, onCancel, initial,
}: {
  clients: Client[]
  onSaved: (t: EmailTemplate) => void
  onCancel: () => void
  initial?: EmailTemplate | null
}) {
  const [clientId, setClientId] = useState(initial?.clientId ?? '')
  const [name, setName]         = useState(initial?.name ?? '')
  const [subject, setSubject]   = useState(initial?.subject ?? '')
  const [html, setHtml]         = useState(initial?.htmlBody ?? '')
  const [preview, setPreview]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  const save = async () => {
    if (!initial && !clientId) { setError('Select a client'); return }
    if (!name.trim())    { setError('Enter a template name'); return }
    if (!subject.trim()) { setError('Enter a subject line'); return }
    if (!html.trim())    { setError('Add HTML body content'); return }
    setSaving(true); setError('')
    try {
      const t = initial
        ? await emailApi.updateTemplate(initial.id, { name, subject, htmlBody: html })
        : await emailApi.createTemplate({ clientId, name, subject, htmlBody: html })
      onSaved(t)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 bg-[#1a1624] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="px-6 py-5 border-b border-white/08 flex items-center justify-between shrink-0">
          <h2 className="font-semibold text-foreground">{initial ? 'Edit template' : 'New template'}</h2>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground transition">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
          {!initial && (
            <div>
              <label className="label">Client</label>
              <select className="input" value={clientId} onChange={e => setClientId(e.target.value)}>
                <option value="">Select client…</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="label">Template name</label>
            <input className="input" placeholder="Appointment Reminder" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="label">Subject line</label>
            <input className="input" placeholder="Your appointment is tomorrow" value={subject} onChange={e => setSubject(e.target.value)} />
            <p className="text-[10px] text-muted-foreground/50 mt-1">Supports {'{{'} variables {'}}'} — e.g. {'{{name}}'}, {'{{date}}'}</p>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="label mb-0">HTML body</label>
              <button
                onClick={() => setPreview(!preview)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition"
              >
                <Eye className="w-3.5 h-3.5" />
                {preview ? 'Edit' : 'Preview'}
              </button>
            </div>
            {preview ? (
              <div
                className="w-full min-h-[280px] rounded-xl border border-white/10 bg-white p-4 text-black text-sm overflow-auto"
                dangerouslySetInnerHTML={{ __html: html || '<p class="text-gray-400">Nothing to preview yet.</p>' }}
              />
            ) : (
              <textarea
                className="input font-mono text-xs leading-relaxed resize-y"
                rows={14}
                placeholder={'<h1>Hello {{name}},</h1>\n<p>Your message here…</p>'}
                value={html}
                onChange={e => setHtml(e.target.value)}
              />
            )}
            <p className="text-[10px] text-muted-foreground/50 mt-1">Raw HTML. Use the Preview button to check rendering.</p>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
        <div className="px-6 py-4 border-t border-white/08 flex gap-2 justify-end shrink-0">
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn-primary flex items-center gap-2" onClick={() => void save()} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {initial ? 'Save changes' : 'Create template'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function EmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [clients, setClients]     = useState<Client[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [clientFilter, setClientFilter] = useState<string>('all')
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing]     = useState<EmailTemplate | null>(null)
  const [deleting, setDeleting]   = useState<string | null>(null)

  const load = () => {
    setLoading(true); setError('')
    Promise.all([emailApi.listTemplates(), commsApi.listClients()])
      .then(([t, c]) => { setTemplates(t); setClients(c) })
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const filtered = clientFilter === 'all'
    ? templates
    : templates.filter(t => t.clientId === clientFilter)

  const handleSaved = (t: EmailTemplate) => {
    setTemplates(prev => {
      const idx = prev.findIndex(x => x.id === t.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = t; return next }
      return [t, ...prev]
    })
    setShowCreate(false)
    setEditing(null)
  }

  const deleteTemplate = async (id: string) => {
    if (!window.confirm('Delete this template? Any campaigns using it will be affected.')) return
    setDeleting(id)
    try {
      await emailApi.deleteTemplate(id)
      setTemplates(prev => prev.filter(t => t.id !== id))
    } catch {
      // leave as-is
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">Email</h1>
          <p className="caption mt-0.5">Email templates for campaigns · {templates.length} total</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> New template
        </button>
      </div>

      <EmailTabs />

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-red-500/20 bg-red-500/05">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {!loading && clients.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setClientFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${clientFilter === 'all' ? 'bg-primary/15 border-primary/30 text-primary' : 'border-white/10 text-muted-foreground hover:border-white/20'}`}
          >
            All clients
          </button>
          {clients.map(c => (
            <button
              key={c.id}
              onClick={() => setClientFilter(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${clientFilter === c.id ? 'bg-primary/15 border-primary/30 text-primary' : 'border-white/10 text-muted-foreground hover:border-white/20'}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading templates…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/07 bg-card flex flex-col items-center justify-center py-16 gap-3 text-center">
          <FileText className="w-10 h-10 text-muted-foreground/20" />
          <p className="font-semibold text-foreground">
            {templates.length === 0 ? 'No templates yet' : 'No templates for this client'}
          </p>
          <p className="text-sm text-muted-foreground max-w-sm">
            {templates.length === 0
              ? 'Create HTML email templates that clients can use in their campaigns.'
              : 'Click "New template" and select this client to create one.'}
          </p>
          {templates.length === 0 && (
            <button onClick={() => setShowCreate(true)} className="btn-primary mt-1 flex items-center gap-2">
              <Plus className="w-4 h-4" /> New template
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/07 bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/07">
                  {['Template', 'Subject', 'Client', 'Updated', ''].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-5 py-3.5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/05">
                {filtered.map(t => (
                  <tr key={t.id} className="hover:bg-white/[0.025] transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-primary/50 shrink-0" />
                        <p className="font-medium text-foreground">{t.name}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground text-xs max-w-[200px]">
                      <p className="truncate">{t.subject}</p>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground text-xs">{t.clientName}</td>
                    <td className="px-5 py-3.5 text-muted-foreground text-xs whitespace-nowrap">{fmtDate(t.updatedAt)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition">
                        <button
                          className="px-2 py-1 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-white/07 transition"
                          onClick={() => setEditing(t)}
                        >
                          Edit
                        </button>
                        <button
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition"
                          onClick={() => void deleteTemplate(t.id)}
                          disabled={deleting === t.id}
                        >
                          {deleting === t.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(showCreate || editing) && (
        <TemplateEditor
          clients={clients}
          initial={editing}
          onSaved={handleSaved}
          onCancel={() => { setShowCreate(false); setEditing(null) }}
        />
      )}
    </div>
  )
}

import { useState, lazy, Suspense } from 'react'
import { Plus, ArrowLeft, Save, Eye, Loader2, FileText, Trash2 } from 'lucide-react'

const EmailEditor = lazy(() => import('../../components/EmailEditor').then(m => ({ default: m.EmailEditor })))

interface Template {
  id: number
  clientName: string
  name: string
  subject: string
  lastEdited: string
  html: string
}

const MOCK_TEMPLATES: Template[] = [
  { id: 1, clientName: 'City General Hospital', name: 'Appointment Reminder',  subject: 'Your appointment is tomorrow', lastEdited: '2 days ago', html: '<h1>Your appointment is tomorrow</h1><p>Please arrive 10 minutes early.</p>' },
  { id: 2, clientName: 'City General Hospital', name: 'Monthly Newsletter',     subject: 'Health tips for July',        lastEdited: '1 week ago', html: '<h1>Health tips for July</h1>' },
  { id: 3, clientName: 'QuickWash Laundry',     name: 'Order Confirmation',    subject: 'Your laundry is ready',       lastEdited: '3 days ago', html: '<h1>Your laundry is ready for pickup</h1>' },
  { id: 4, clientName: 'QuickWash Laundry',     name: 'Promo Blast',           subject: '20% off this weekend',        lastEdited: '1 day ago',  html: '<h1>20% off this weekend only</h1>' },
  { id: 5, clientName: 'Metro Logistics',       name: 'Invoice',               subject: 'Invoice #{{invoiceNumber}}',  lastEdited: '5 days ago', html: '<h1>Invoice</h1><p>Amount due: {{amount}}</p>' },
]

const CLIENTS = ['All clients', 'City General Hospital', 'QuickWash Laundry', 'Metro Logistics', 'Sunrise Pharmacy', 'FoodBridge Restaurant']

export function EmailTemplates() {
  const [clientFilter, setClientFilter] = useState('All clients')
  const [editing, setEditing]           = useState<Template | null>(null)
  const [isNew, setIsNew]               = useState(false)
  const [html, setHtml]                 = useState('')
  const [templateName, setTemplateName] = useState('')
  const [subject, setSubject]           = useState('')
  const [saving, setSaving]             = useState(false)
  const [saved, setSaved]               = useState(false)

  const filtered = clientFilter === 'All clients'
    ? MOCK_TEMPLATES
    : MOCK_TEMPLATES.filter(t => t.clientName === clientFilter)

  const openEditor = (t: Template) => {
    setEditing(t)
    setIsNew(false)
    setHtml(t.html)
    setTemplateName(t.name)
    setSubject(t.subject)
    setSaved(false)
  }

  const newTemplate = () => {
    setEditing(null)
    setIsNew(true)
    setHtml('')
    setTemplateName('')
    setSubject('')
    setSaved(false)
  }

  const save = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    setSaving(false)
    setSaved(true)
  }

  const closeEditor = () => {
    setEditing(null)
    setIsNew(false)
  }

  /* ── Editor view ── */
  if (editing || isNew) {
    return (
      <div className="flex flex-col h-[calc(100vh-64px)] -m-4 md:-m-6">
        {/* Editor topbar */}
        <div
          className="shrink-0 flex items-center gap-3 px-4 py-3 border-b"
          style={{ background: 'rgba(14,11,20,0.96)', borderColor: 'rgba(255,255,255,0.10)' }}
        >
          <button
            onClick={closeEditor}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/05 transition flex items-center gap-1.5 text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="flex-1 flex items-center gap-3 min-w-0">
            <input
              className="input text-sm font-medium max-w-[200px]"
              placeholder="Template name"
              value={templateName}
              onChange={e => setTemplateName(e.target.value)}
            />
            <input
              className="input text-sm flex-1 min-w-0"
              placeholder="Email subject line"
              value={subject}
              onChange={e => setSubject(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {saved && <span className="text-xs text-teal flex items-center gap-1"><Eye className="w-3.5 h-3.5" />Saved</span>}
            <button
              className="btn-primary flex items-center gap-2 text-sm px-4"
              disabled={saving || !templateName}
              onClick={save}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving…' : 'Save template'}
            </button>
          </div>
        </div>

        {/* GrapeJS editor */}
        <div className="flex-1 min-h-0">
          <Suspense fallback={
            <div className="flex items-center justify-center h-full gap-2 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading editor…
            </div>
          }>
            <EmailEditor html={html} onChange={(h) => setHtml(h)} height="100%" />
          </Suspense>
        </div>
      </div>
    )
  }

  /* ── List view ── */
  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">Email Templates</h1>
          <p className="caption mt-0.5">Design email templates per client — drag, drop, done</p>
        </div>
        <button onClick={newTemplate} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> New template
        </button>
      </div>

      {/* Client filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CLIENTS.map(c => (
          <button
            key={c}
            onClick={() => setClientFilter(c)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              clientFilter === c
                ? 'bg-primary/20 text-primary border-primary/30'
                : 'text-muted-foreground border-white/08 hover:border-white/16 hover:text-foreground'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Template grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-2xl border border-white/07">
          <FileText className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-sm text-muted-foreground">No templates yet for this client</p>
          <button onClick={newTemplate} className="btn-secondary text-sm flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Create first template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(t => (
            <div
              key={t.id}
              className="rounded-2xl border border-white/07 bg-card p-5 flex flex-col gap-3 hover:border-white/14 transition-colors cursor-pointer group"
              onClick={() => openEditor(t)}
            >
              {/* Preview area */}
              <div className="h-28 rounded-xl bg-white/[0.03] border border-white/05 flex items-center justify-center overflow-hidden">
                <div
                  className="scale-[0.35] origin-top text-foreground pointer-events-none"
                  dangerouslySetInnerHTML={{ __html: t.html }}
                />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{t.name}</p>
                <p className="text-xs text-muted-foreground/60 truncate mt-0.5">{t.subject}</p>
                <p className="text-[10px] text-muted-foreground/40 mt-1">{t.clientName} · edited {t.lastEdited}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  className="flex-1 btn-secondary text-xs py-1.5 flex items-center justify-center gap-1.5"
                  onClick={e => { e.stopPropagation(); openEditor(t) }}
                >
                  <Eye className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  className="p-1.5 text-muted-foreground/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                  onClick={e => { e.stopPropagation(); /* delete handler */ }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {/* Add new card */}
          <button
            onClick={newTemplate}
            className="rounded-2xl border border-dashed border-white/12 bg-white/[0.01] p-5 flex flex-col items-center justify-center gap-2 hover:border-primary/40 hover:bg-primary/[0.03] transition-colors min-h-[200px]"
          >
            <div className="w-10 h-10 rounded-xl bg-white/05 flex items-center justify-center">
              <Plus className="w-5 h-5 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground">New template</p>
          </button>
        </div>
      )}
    </div>
  )
}

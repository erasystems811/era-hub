import { useEffect, useState } from 'react'
import { Pencil, Trash2, Plus, Upload, ChevronDown, ChevronRight, Loader2 } from 'lucide-react'
import { bizApi, type KnowledgeBaseEntry } from './business-api'

const SECTIONS = ['About us', 'Products & Prices', 'FAQs', 'Location & Hours', 'Policies'] as const
type Section = typeof SECTIONS[number]

const INPUT  = 'w-full px-3.5 py-2.5 rounded-xl bg-[hsl(262_20%_11%)] border border-white/[0.10] text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-[#BF7C93]/50 focus:ring-2 focus:ring-[#BF7C93]/15 transition-all'
const LABEL  = 'text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-1.5 block'

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso))
  } catch { return iso }
}

interface EditForm { title: string; content: string }

export function KnowledgeBaseModule() {
  const [entries,   setEntries]   = useState<KnowledgeBaseEntry[]>([])
  const [loading,   setLoading]   = useState(true)
  const [open,      setOpen]      = useState<Set<Section>>(new Set(['About us']))
  const [editId,    setEditId]    = useState<string | null>(null)
  const [addSection,setAddSection]= useState<Section | null>(null)
  const [form,      setForm]      = useState<EditForm>({ title: '', content: '' })
  const [saving,    setSaving]    = useState(false)
  const [deleteId,  setDeleteId]  = useState<string | null>(null)
  const [deleting,  setDeleting]  = useState(false)
  const [toast,     setToast]     = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2800)
  }

  useEffect(() => {
    bizApi.getKnowledgeBase()
      .then(setEntries)
      .finally(() => setLoading(false))
  }, [])

  function toggleSection(s: Section) {
    setOpen(prev => {
      const next = new Set(prev)
      next.has(s) ? next.delete(s) : next.add(s)
      return next
    })
  }

  function startEdit(entry: KnowledgeBaseEntry) {
    setAddSection(null)
    setEditId(entry.id)
    setForm({ title: entry.title, content: entry.content })
  }

  function startAdd(s: Section) {
    setEditId(null)
    setAddSection(s)
    setForm({ title: '', content: '' })
    setOpen(prev => new Set([...prev, s]))
  }

  function cancelForm() {
    setEditId(null)
    setAddSection(null)
    setForm({ title: '', content: '' })
  }

  async function saveForm(section: Section) {
    if (!form.title.trim() || !form.content.trim()) return
    setSaving(true)
    try {
      const saved = await bizApi.upsertKBEntry({
        section,
        title: form.title.trim(),
        content: form.content.trim(),
        ...(editId ? { id: editId } : {}),
      })
      if (editId) {
        setEntries(prev => prev.map(e => e.id === editId ? saved : e))
      } else {
        setEntries(prev => [...prev, saved])
      }
      cancelForm()
      showToast('Saved')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete(id: string) {
    setDeleting(true)
    try {
      await bizApi.deleteKBEntry(id)
      setEntries(prev => prev.filter(e => e.id !== id))
      setDeleteId(null)
      showToast('Deleted')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 rounded-full border-2 border-[#BF7C93]/30 border-t-[#BF7C93] animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-[hsl(262_20%_14%)] border border-white/10 text-sm text-foreground shadow-xl">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Knowledge Base</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Everything your AI knows about your business</p>
        </div>
        <button
          onClick={() => showToast('Document upload coming soon')}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-white/20 transition-all"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <Upload className="w-3.5 h-3.5" />
          Upload doc
        </button>
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {SECTIONS.map(section => {
          const sectionEntries = entries.filter(e => e.section === section)
          const isOpen = open.has(section)
          const isAdding = addSection === section

          return (
            <div
              key={section}
              className="rounded-xl border overflow-hidden"
              style={{ background: 'hsl(262 20% 10%)', borderColor: 'rgba(255,255,255,0.07)' }}
            >
              {/* Section header */}
              <button
                onClick={() => toggleSection(section)}
                className="flex items-center justify-between w-full px-5 py-3.5 text-left hover:bg-white/3 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                  <span className="text-sm font-semibold text-foreground">{section}</span>
                  <span className="text-[10px] text-muted-foreground/50">{sectionEntries.length} {sectionEntries.length === 1 ? 'entry' : 'entries'}</span>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); startAdd(section) }}
                  className="flex items-center gap-1 text-xs text-[#BF7C93]/60 hover:text-[#BF7C93] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </button>

              {isOpen && (
                <div className="px-5 pb-4 space-y-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  {/* Entries */}
                  {sectionEntries.map(entry => (
                    <div key={entry.id}>
                      {/* Entry card */}
                      {editId !== entry.id && deleteId !== entry.id && (
                        <div
                          className="flex items-start justify-between p-3.5 rounded-xl mt-3"
                          style={{ background: 'hsl(262 20% 7%)' }}
                        >
                          <div className="flex-1 min-w-0 mr-3">
                            <p className="text-sm font-medium text-foreground mb-1">{entry.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2">{entry.content}</p>
                            <p className="text-[10px] text-muted-foreground/30 mt-1.5">Updated {formatDate(entry.updatedAt)}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => startEdit(entry)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-white/8 transition-all"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteId(entry.id)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground/50 hover:text-red-400 hover:bg-red-500/8 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Delete confirm */}
                      {deleteId === entry.id && (
                        <div
                          className="flex items-center justify-between p-3.5 rounded-xl mt-3 border border-red-500/20"
                          style={{ background: 'rgba(239,68,68,0.06)' }}
                        >
                          <p className="text-xs text-red-400">Delete "{entry.title}"? This cannot be undone.</p>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => setDeleteId(null)}
                              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => confirmDelete(entry.id)}
                              disabled={deleting}
                              className="flex items-center gap-1 text-xs font-semibold text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors"
                            >
                              {deleting && <Loader2 className="w-3 h-3 animate-spin" />}
                              Delete
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Edit form */}
                      {editId === entry.id && (
                        <InlineForm
                          form={form}
                          setForm={setForm}
                          onSave={() => saveForm(section)}
                          onCancel={cancelForm}
                          saving={saving}
                        />
                      )}
                    </div>
                  ))}

                  {/* Add form */}
                  {isAdding && (
                    <InlineForm
                      form={form}
                      setForm={setForm}
                      onSave={() => saveForm(section)}
                      onCancel={cancelForm}
                      saving={saving}
                      isNew
                    />
                  )}

                  {!isAdding && sectionEntries.length === 0 && (
                    <p className="text-xs text-muted-foreground/40 text-center py-4">No entries yet — add your first one above.</p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface InlineFormProps {
  form: EditForm
  setForm: (f: EditForm) => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
  isNew?: boolean
}

function InlineForm({ form, setForm, onSave, onCancel, saving, isNew }: InlineFormProps) {
  return (
    <div
      className="p-4 rounded-xl mt-3 border"
      style={{ background: 'hsl(262 20% 7%)', borderColor: 'rgba(191,124,147,0.15)' }}
    >
      <p className="text-xs font-semibold text-muted-foreground mb-3">{isNew ? 'New Entry' : 'Edit Entry'}</p>
      <div className="space-y-3">
        <div>
          <label className={LABEL}>Title</label>
          <input
            className={INPUT}
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Our founding story"
          />
        </div>
        <div>
          <label className={LABEL}>Content</label>
          <textarea
            className={`${INPUT} resize-none`}
            rows={5}
            value={form.content}
            onChange={e => setForm({ ...form, content: e.target.value })}
            placeholder="Write the content your AI will use to answer questions…"
          />
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-3.5 py-2 rounded-xl text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving || !form.title.trim() || !form.content.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#BF7C93] text-white text-xs font-bold hover:bg-[#BF7C93]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {saving && <Loader2 className="w-3 h-3 animate-spin" />}
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

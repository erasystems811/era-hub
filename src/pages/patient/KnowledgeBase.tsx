import { useState, useEffect, useRef } from 'react'
import { Search, Upload, Trash2, Loader2, AlertCircle, Database, Play, FileText, X } from 'lucide-react'
import { patientApi, RagDocument } from '../../lib/patient-api'
import { pageCache } from '../../lib/cache'

const CATEGORIES = ['general', 'appointment', 'medication', 'procedure', 'billing', 'wellness', 'faq']

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' })
}

function UploadModal({ onClose, onUploaded }: { onClose: () => void; onUploaded: () => void }) {
  const [title, setTitle]       = useState('')
  const [category, setCategory] = useState('general')
  const [source, setSource]     = useState('')
  const [content, setContent]   = useState('')
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [result, setResult]     = useState<{ chunks: number; title: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = ev => setContent(String(ev.target?.result ?? ''))
    reader.readAsText(f)
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ''))
  }

  const submit = async () => {
    setSaving(true); setError(null)
    try {
      const res = await patientApi.uploadKnowledgeDoc({ title, category, source: source || undefined, content })
      setResult(res)
      onUploaded()
    } catch (e) { setError(e instanceof Error ? e.message : 'Upload failed') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-[#1a1624] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-5 border-b border-white/08 flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Upload document</h2>
          <button className="text-muted-foreground hover:text-foreground transition-colors" onClick={onClose}><X className="w-4 h-4" /></button>
        </div>
        {result ? (
          <div className="px-6 py-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">Uploaded successfully</h3>
            <p className="text-sm text-muted-foreground">"{result.title}" — {result.chunks} chunk{result.chunks !== 1 ? 's' : ''} indexed</p>
            <button className="btn-primary mt-5" onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <div className="px-6 py-5 space-y-4">
              {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">{error}</p>}
              <div>
                <label className="label">Title</label>
                <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Post-surgery Care Instructions" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Category</label>
                  <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
                    {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Source (optional)</label>
                  <input className="input" value={source} onChange={e => setSource(e.target.value)} placeholder="WHO guidelines 2024" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="label">Content</label>
                  <button className="text-xs text-primary/70 hover:text-primary" onClick={() => fileRef.current?.click()}>
                    Import from file
                  </button>
                  <input ref={fileRef} type="file" accept=".txt,.md,.csv" className="hidden" onChange={handleFile} />
                </div>
                <textarea className="input resize-none font-mono text-xs" rows={8} value={content} onChange={e => setContent(e.target.value)} placeholder="Paste document text here…" />
                {content && <p className="text-xs text-muted-foreground/40 mt-1">{content.split(/\s+/).filter(Boolean).length} words</p>}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-white/08 flex gap-2 justify-end">
              <button className="btn-secondary" onClick={onClose}>Cancel</button>
              <button className="btn-primary flex items-center gap-2" disabled={!title || !content || saving} onClick={submit}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Upload & index
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function TestModal({ onClose }: { onClose: () => void }) {
  const [query, setQuery]     = useState('')
  const [category, setCategory] = useState('general')
  const [results, setResults] = useState<string[]>([])
  const [testing, setTesting] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [ran, setRan]         = useState(false)

  const run = async () => {
    setTesting(true); setError(null); setRan(false)
    try {
      const res = await patientApi.testKnowledgeQuery(query, category)
      setResults(res.results); setRan(true)
    } catch (e) { setError(e instanceof Error ? e.message : 'Query failed') }
    finally { setTesting(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-[#1a1624] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-5 border-b border-white/08 flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Test knowledge query</h2>
          <button className="text-muted-foreground hover:text-foreground" onClick={onClose}><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">{error}</p>}
          <div>
            <label className="label">Category</label>
            <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Query</label>
            <textarea className="input resize-none" rows={2} value={query} onChange={e => setQuery(e.target.value)} placeholder="What is the recovery time for appendix surgery?" />
          </div>
          <button className="btn-primary flex items-center gap-2" disabled={!query || testing} onClick={run}>
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Run query
          </button>
          {ran && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">{results.length} result{results.length !== 1 ? 's' : ''}</p>
              {results.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No relevant chunks found for this query.</p>
              ) : results.map((r, i) => (
                <div key={i} className="rounded-lg border border-white/08 bg-white/[0.03] p-3 mb-2 text-sm text-muted-foreground leading-relaxed">
                  <span className="text-[10px] font-bold text-muted-foreground/40 uppercase mr-2">#{i + 1}</span>
                  {r}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function KnowledgeBase() {
  const [docs, setDocs]         = useState<RagDocument[]>([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [search, setSearch]     = useState('')
  const [catFilter, setCat]     = useState('all')
  const [deleting, setDeleting] = useState<number | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [showTest, setShowTest]     = useState(false)

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const res = await patientApi.listKnowledgeDocs({ category: catFilter, search: search || undefined })
      pageCache.set(`patient:knowledge:${catFilter}`, res)
      setDocs(res.documents ?? []); setTotal(res.total ?? 0)
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(() => {
    const cached = pageCache.get<{ documents: RagDocument[]; total: number }>(`patient:knowledge:${catFilter}`)
    if (cached) { setDocs(cached.documents ?? []); setTotal(cached.total ?? 0); setLoading(false) }
    void load()
  }, [catFilter])

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); void load() }

  const remove = async (id: number) => {
    if (!confirm('Delete this document from the knowledge base?')) return
    setDeleting(id)
    try { await patientApi.deleteKnowledgeDoc(id); pageCache.bust('patient:knowledge'); await load() }
    catch (e) { setError(e instanceof Error ? e.message : 'Delete failed') }
    finally { setDeleting(null) }
  }

  // Deduplicate by title (chunks of same doc share title)
  const unique = docs.reduce<{ title: string; category: string; source: string | null; id: number; created_at: string; chunks: number }[]>((acc, d) => {
    const ex = acc.find(x => x.title === d.title && x.category === d.category)
    if (ex) { ex.chunks++; return acc }
    return [...acc, { title: d.title, category: d.category, source: d.source, id: d.id, created_at: d.created_at, chunks: 1 }]
  }, [])

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">Knowledge Base</h1>
          <p className="caption mt-0.5">RAG documents used by the ERA Patient AI assistant</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary text-sm flex items-center gap-2" onClick={() => setShowTest(true)}>
            <Play className="w-4 h-4" /> Test query
          </button>
          <button className="btn-primary text-sm flex items-center gap-2" onClick={() => setShowUpload(true)}>
            <Upload className="w-4 h-4" /> Upload document
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total chunks',   value: loading ? null : total,        color: 'text-foreground' },
          { label: 'Unique docs',    value: loading ? null : unique.length, color: 'text-teal' },
          { label: 'Categories',     value: loading ? null : new Set(unique.map(d => d.category)).size, color: 'text-primary' },
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

      {/* Search + filter */}
      <div className="flex gap-3 flex-wrap">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input className="input pl-9" placeholder="Search documents…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button type="submit" className="btn-secondary text-sm">Search</button>
        </form>
        <select className="input max-w-[160px]" value={catFilter} onChange={e => { setCat(e.target.value); setSearch('') }}>
          <option value="all">All categories</option>
          {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
        </select>
      </div>

      {/* Stats row */}
      {!loading && (
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">{total} document{total !== 1 ? 's' : ''} total</span>
          <span className="text-muted-foreground/30">·</span>
          <span className="text-muted-foreground">{unique.length} unique titles</span>
        </div>
      )}

      {/* Document list */}
      <div className="rounded-xl border border-white/07 bg-card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : unique.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
            <Database className="w-8 h-8 opacity-20" />
            <p className="text-sm">No documents found</p>
            <button className="btn-primary text-sm mt-1" onClick={() => setShowUpload(true)}>Upload your first document</button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/07">
                {['Title', 'Category', 'Source', 'Chunks', 'Indexed', ''].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {unique.map(d => (
                <tr key={d.id} className="border-b border-white/05 last:border-0 hover:bg-white/[0.03] transition-colors">
                  <td className="px-5 py-3 font-medium text-foreground">{d.title}</td>
                  <td className="px-3 py-3">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/08 text-muted-foreground capitalize">{d.category}</span>
                  </td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">{d.source ?? <span className="opacity-30">—</span>}</td>
                  <td className="px-3 py-3 text-muted-foreground tabular-nums">{d.chunks}</td>
                  <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">{fmtDate(d.created_at)}</td>
                  <td className="px-5 py-3 text-right">
                    <button className="text-muted-foreground hover:text-red-400 transition-colors" disabled={deleting === d.id}
                      onClick={() => void remove(d.id)}>
                      {deleting === d.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onUploaded={load} />}
      {showTest   && <TestModal  onClose={() => setShowTest(false)} />}
    </div>
  )
}

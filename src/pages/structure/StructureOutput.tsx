import { useEffect, useState } from 'react'
import { structureApi, Document, Business } from '../../lib/structure-api'
import { ExternalLink, Search } from 'lucide-react'

const HEALTH_COLOR = { green: '#4DBFB3', amber: '#C9952B', red: '#ef4444' }
const HEALTH_BG    = { green: 'bg-[#4DBFB3]/10 text-[#4DBFB3]', amber: 'bg-[#C9952B]/10 text-[#C9952B]', red: 'bg-red-500/10 text-red-400' }

export function StructureOutput() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [selectedBizId, setSelectedBizId] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([structureApi.listOutput(), structureApi.listBusinesses()])
      .then(([docs, biz]) => { setDocuments(docs); setBusinesses(biz) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = documents.filter(d => {
    const matchBiz = selectedBizId === 'all' || d.business_id === selectedBizId
    const matchSearch = d.title.toLowerCase().includes(search.toLowerCase()) ||
      (d.businesses as { name: string } | null)?.name.toLowerCase().includes(search.toLowerCase())
    return matchBiz && matchSearch
  })

  const grouped = filtered.reduce((acc, d) => {
    const key = (d.businesses as { name: string } | null)?.name ?? d.business_id
    if (!acc[key]) acc[key] = []
    acc[key].push(d)
    return acc
  }, {} as Record<string, Document[]>)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-bold text-foreground">Output</h1>
        <p className="text-xs text-muted-foreground/50 mt-0.5">All client documents and their health status</p>
      </div>

      {error && <div className="text-sm text-red-400 bg-red-500/5 border border-red-500/20 rounded-lg px-4 py-3">{error}</div>}

      <div className="flex gap-3 flex-wrap">
        <select
          value={selectedBizId}
          onChange={e => setSelectedBizId(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-sm bg-white/[0.05] border border-white/10 text-foreground focus:outline-none focus:border-[#C9952B]/50"
        >
          <option value="all">All businesses</option>
          {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/35" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search documents…"
            className="w-full pl-9 pr-4 py-1.5 rounded-lg text-sm bg-white/[0.04] border border-white/08 text-foreground placeholder-muted-foreground/30 focus:outline-none focus:border-[#C9952B]/40"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-sm text-muted-foreground/40">Loading…</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground/40">No documents yet</div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([bizName, docs]) => (
            <div key={bizName} className="rounded-xl border border-white/08 bg-white/[0.03] overflow-hidden">
              <div className="px-4 py-2.5 bg-white/[0.03] border-b border-white/06">
                <p className="text-sm font-semibold text-foreground">{bizName}</p>
              </div>
              <div className="divide-y divide-white/05">
                {docs.map(d => {
                  const daysLeft = d.next_review_due
                    ? Math.ceil((new Date(d.next_review_due).getTime() - Date.now()) / 86400000)
                    : null
                  return (
                    <div key={d.id} className="px-4 py-3 flex items-center gap-3">
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: HEALTH_COLOR[d.health_status] }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{d.title}</p>
                        <p className="text-[11px] text-muted-foreground/40">{d.category}</p>
                      </div>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${HEALTH_BG[d.health_status]}`}>
                        {d.health_status}
                      </span>
                      {daysLeft !== null && (
                        <span className={`text-[11px] tabular-nums ${daysLeft < 0 ? 'text-red-400' : daysLeft < 5 ? 'text-amber-400' : 'text-muted-foreground/40'}`}>
                          {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                        </span>
                      )}
                      {d.doc_url && (
                        <a href={d.doc_url} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-muted-foreground/35 hover:text-[#C9952B] hover:bg-[#C9952B]/10 transition">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

import { useState } from 'react'
import { Users, Ban, Upload, Plus, Search, Trash2 } from 'lucide-react'

interface ContactList {
  id: number
  client: string
  name: string
  count: number
  created: string
}

interface Suppressed {
  id: number
  email: string
  reason: 'bounce' | 'complaint' | 'unsubscribe'
  client: string | 'global'
  date: string
}

const LISTS: ContactList[] = [
  { id: 1, client: 'City General Hospital', name: 'All patients',           count: 840,  created: '3 months ago' },
  { id: 2, client: 'City General Hospital', name: 'Cardiology ward',        count: 120,  created: '1 month ago' },
  { id: 3, client: 'City General Hospital', name: 'Outpatients — June',     count: 310,  created: '2 weeks ago' },
  { id: 4, client: 'QuickWash Laundry',     name: 'All customers',          count: 620,  created: '2 months ago' },
  { id: 5, client: 'QuickWash Laundry',     name: 'VIP subscribers',        count: 88,   created: '3 weeks ago' },
  { id: 6, client: 'Metro Logistics',       name: 'Corporate accounts',     count: 145,  created: '1 month ago' },
  { id: 7, client: 'Metro Logistics',       name: 'All drivers',            count: 310,  created: '2 months ago' },
  { id: 8, client: 'Sunrise Pharmacy',      name: 'Newsletter subscribers', count: 1200, created: '4 months ago' },
]

const SUPPRESSED: Suppressed[] = [
  { id: 1, email: 'bounce@citygeneral.ng',      reason: 'bounce',      client: 'City General Hospital', date: '2 days ago' },
  { id: 2, email: 'noemail@example.com',        reason: 'bounce',      client: 'global',                date: '5 days ago' },
  { id: 3, email: 'complaint@quickwash.ng',     reason: 'complaint',   client: 'QuickWash Laundry',     date: '1 week ago' },
  { id: 4, email: 'unsub@sunrisepharm.ng',      reason: 'unsubscribe', client: 'Sunrise Pharmacy',      date: '3 days ago' },
  { id: 5, email: 'hardbounce@metro.ng',        reason: 'bounce',      client: 'Metro Logistics',       date: '1 day ago' },
  { id: 6, email: 'spam@example.com',           reason: 'complaint',   client: 'global',                date: '2 weeks ago' },
]

const REASON_STYLE: Record<string, string> = {
  bounce:      'bg-red-500/10 text-red-400 border-red-500/20',
  complaint:   'bg-orange-500/10 text-orange-400 border-orange-500/20',
  unsubscribe: 'bg-white/05 text-muted-foreground border-white/10',
}

const CLIENTS = ['All clients', 'City General Hospital', 'QuickWash Laundry', 'Metro Logistics', 'Sunrise Pharmacy']

export function EmailContacts() {
  const [tab, setTab]               = useState<'lists' | 'suppression'>('lists')
  const [clientFilter, setClient]   = useState('All clients')
  const [search, setSearch]         = useState('')
  const [showImport, setShowImport] = useState(false)

  const filteredLists = LISTS
    .filter(l => clientFilter === 'All clients' || l.client === clientFilter)
    .filter(l => !search || l.name.toLowerCase().includes(search.toLowerCase()))

  const filteredSuppressed = SUPPRESSED
    .filter(s => clientFilter === 'All clients' || s.client === clientFilter || (clientFilter === 'All clients' && s.client === 'global'))
    .filter(s => !search || s.email.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">Contacts</h1>
          <p className="caption mt-0.5">Contact lists and global suppression management</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowImport(true)} className="btn-secondary flex items-center gap-2 text-sm">
            <Upload className="w-4 h-4" /> Import CSV
          </button>
          <button className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> New list
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/[0.03] rounded-xl border border-white/07 w-fit">
        {(['lists', 'suppression'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              tab === t
                ? 'bg-white/08 text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'suppression' ? 'Suppression list' : 'Contact lists'}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
          <input
            className="input pl-9 text-sm"
            placeholder={tab === 'lists' ? 'Search lists…' : 'Search email…'}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-0.5">
          {CLIENTS.map(c => (
            <button
              key={c}
              onClick={() => setClient(c)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                clientFilter === c
                  ? 'bg-primary/20 text-primary border-primary/30'
                  : 'text-muted-foreground border-white/08 hover:border-white/16'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Contact lists */}
      {tab === 'lists' && (
        <div className="rounded-2xl border border-white/07 bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: 500 }}>
              <thead>
                <tr className="border-b border-white/06">
                  {['List name', 'Client', 'Contacts', 'Created', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/05">
                {filteredLists.map(l => (
                  <tr key={l.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground/30 shrink-0" />
                        <p className="font-medium text-foreground">{l.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{l.client}</td>
                    <td className="px-4 py-3 text-xs font-bold text-foreground tabular-nums">{l.count.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground/50">{l.created}</td>
                    <td className="px-4 py-3">
                      <button className="p-1.5 text-muted-foreground/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Suppression list */}
      {tab === 'suppression' && (
        <>
          <div className="flex items-start gap-3 p-3 rounded-xl border border-amber-500/20 bg-amber-500/05">
            <Ban className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Suppressed addresses are <span className="font-semibold text-foreground">never sent to</span> — hard bounces, complaints, and unsubscribes are added automatically by Postal. Global suppressions apply across all clients.
            </p>
          </div>
          <div className="rounded-2xl border border-white/07 bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ minWidth: 520 }}>
                <thead>
                  <tr className="border-b border-white/06">
                    {['Email', 'Reason', 'Client', 'Added', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/05">
                  {filteredSuppressed.map(s => (
                    <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-foreground">{s.email}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${REASON_STYLE[s.reason]}`}>
                          {s.reason}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {s.client === 'global' ? <span className="text-amber-400">Global</span> : s.client}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground/50">{s.date}</td>
                      <td className="px-4 py-3">
                        <button className="p-1.5 text-muted-foreground/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition" title="Remove from suppression">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Import modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowImport(false)} />
          <div className="relative z-10 bg-[#1a1624] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-5 border-b border-white/08">
              <h2 className="font-semibold text-foreground">Import contacts from CSV</h2>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="label">Client</label>
                <select className="input"><option>City General Hospital</option></select>
              </div>
              <div>
                <label className="label">List name</label>
                <input className="input" placeholder="e.g. July patients" />
              </div>
              <div>
                <label className="label">CSV file</label>
                <div className="border border-dashed border-white/15 rounded-xl p-8 text-center cursor-pointer hover:border-primary/40 transition">
                  <Upload className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Click or drag CSV here</p>
                  <p className="text-xs text-muted-foreground/40 mt-1">Required columns: email · Optional: first_name, last_name</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-white/08 flex gap-2 justify-end">
              <button className="btn-secondary" onClick={() => setShowImport(false)}>Cancel</button>
              <button className="btn-primary flex items-center gap-2"><Upload className="w-4 h-4" />Import</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

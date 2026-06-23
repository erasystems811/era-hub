import { useState, useEffect } from 'react'
import { Users, Ban, Plus, Loader2, AlertCircle, Trash2, X } from 'lucide-react'
import { emailApi, commsApi, type EmailContactList, type EmailSuppressed, type Client } from '../../lib/comms-api'
import { fmtDate } from '../../lib/utils'
import { EmailTabs } from './EmailOverview'

type Tab = 'lists' | 'suppression'

const REASON_STYLE: Record<string, string> = {
  bounce:      'bg-red-500/10 text-red-400 border-red-500/20',
  complaint:   'bg-orange-500/10 text-orange-400 border-orange-500/20',
  unsubscribe: 'bg-white/05 text-muted-foreground border-white/10',
}

function CreateListModal({ clients, onCreated, onClose }: {
  clients: Client[]
  onCreated: (list: EmailContactList) => void
  onClose: () => void
}) {
  const [clientId, setClientId] = useState('')
  const [name, setName]         = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError]       = useState('')

  const submit = async () => {
    if (!clientId) { setError('Select a client'); return }
    if (!name.trim()) { setError('Enter a list name'); return }
    setCreating(true); setError('')
    try {
      await emailApi.createContactList(clientId, name.trim())
      // Reload full list to get the proper shape
      const lists = await emailApi.listContactLists()
      const created = lists.find(l => l.clientId === clientId && l.name === name.trim())
      if (created) onCreated(created)
      else onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create list')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-[#1a1624] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-5 border-b border-white/08 flex items-center justify-between">
          <h2 className="font-semibold text-foreground">New contact list</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="label">Client</label>
            <select className="input" value={clientId} onChange={e => setClientId(e.target.value)}>
              <option value="">Select client…</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">List name</label>
            <input
              className="input"
              placeholder="Newsletter subscribers"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && void submit()}
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
        <div className="px-6 py-4 border-t border-white/08 flex gap-2 justify-end">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary flex items-center gap-2" onClick={() => void submit()} disabled={creating}>
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
            Create list
          </button>
        </div>
      </div>
    </div>
  )
}

export function EmailContacts() {
  const [tab, setTab]               = useState<Tab>('lists')
  const [lists, setLists]           = useState<EmailContactList[]>([])
  const [suppressed, setSuppressed] = useState<EmailSuppressed[]>([])
  const [clients, setClients]       = useState<Client[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [deleting, setDeleting]     = useState<string | null>(null)

  const load = () => {
    setLoading(true); setError('')
    Promise.all([
      emailApi.listContactLists(),
      emailApi.listSuppressed(),
      commsApi.listClients(),
    ]).then(([l, s, c]) => { setLists(l); setSuppressed(s); setClients(c) })
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const deleteList = async (id: string) => {
    if (!window.confirm('Delete this contact list? This cannot be undone.')) return
    setDeleting(id)
    try {
      await emailApi.deleteContactList(id)
      setLists(prev => prev.filter(l => l.id !== id))
    } catch { } finally { setDeleting(null) }
  }

  const removeSuppressed = async (id: string) => {
    if (!window.confirm('Remove this email from the suppression list?')) return
    setDeleting(id)
    try {
      await emailApi.removeSuppressed(id)
      setSuppressed(prev => prev.filter(s => s.id !== id))
    } catch { } finally { setDeleting(null) }
  }

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">Email</h1>
          <p className="caption mt-0.5">Contact lists · suppression management</p>
        </div>
        {tab === 'lists' && (
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> New list
          </button>
        )}
      </div>

      <EmailTabs />

      <div className="flex gap-1 border-b border-white/07 -mt-2 mb-4">
        {([
          { id: 'lists',       label: `Contact Lists${lists.length > 0 ? ` (${lists.length})` : ''}` },
          { id: 'suppression', label: `Suppression${suppressed.length > 0 ? ` (${suppressed.length})` : ''}` },
        ] as { id: Tab; label: string }[]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t.id
                ? 'text-primary border-primary'
                : 'text-muted-foreground border-transparent hover:text-foreground hover:border-white/20'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-red-500/20 bg-red-500/05">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      ) : tab === 'lists' ? (
        lists.length === 0 ? (
          <div className="rounded-2xl border border-white/07 bg-card flex flex-col items-center justify-center py-16 gap-3 text-center">
            <Users className="w-10 h-10 text-muted-foreground/20" />
            <p className="font-semibold text-foreground">No contact lists yet</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              Create contact lists for each client. Contacts can be imported via the API,
              or businesses can manage their own lists in the business portal.
            </p>
            <button onClick={() => setShowCreate(true)} className="btn-primary mt-1 flex items-center gap-2">
              <Plus className="w-4 h-4" /> New list
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/07 bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/07">
                    {['List name', 'Client', 'Contacts', 'Created', ''].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-5 py-3.5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/05">
                  {lists.map(l => (
                    <tr key={l.id} className="hover:bg-white/[0.025] transition-colors group">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Users className="w-4 h-4 text-primary/50 shrink-0" />
                          <p className="font-medium text-foreground">{l.name}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground text-xs">{l.clientName}</td>
                      <td className="px-5 py-3.5 text-foreground tabular-nums font-semibold">{l.contactCount.toLocaleString()}</td>
                      <td className="px-5 py-3.5 text-muted-foreground text-xs whitespace-nowrap">{fmtDate(l.createdAt)}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end opacity-0 group-hover:opacity-100 transition">
                          <button
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition"
                            onClick={() => void deleteList(l.id)}
                            disabled={deleting === l.id}
                          >
                            {deleting === l.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        suppressed.length === 0 ? (
          <div className="rounded-2xl border border-white/07 bg-card flex flex-col items-center justify-center py-16 gap-3 text-center">
            <Ban className="w-10 h-10 text-muted-foreground/20" />
            <p className="font-semibold text-foreground">No suppressed emails</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              Emails are automatically suppressed after bounces, spam complaints, or unsubscribes.
              None suppressed yet.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/07 bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/07">
                    {['Email', 'Reason', 'Scope', 'Added', ''].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-5 py-3.5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/05">
                  {suppressed.map(s => (
                    <tr key={s.id} className="hover:bg-white/[0.025] transition-colors group">
                      <td className="px-5 py-3.5 font-mono text-sm text-foreground">{s.email}</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border capitalize ${REASON_STYLE[s.reason] ?? REASON_STYLE.unsubscribe}`}>
                          {s.reason}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-muted-foreground">
                        {s.global ? 'Global (all clients)' : s.clientName ?? 'Unknown'}
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground text-xs whitespace-nowrap">{fmtDate(s.createdAt)}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end opacity-0 group-hover:opacity-100 transition">
                          <button
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/07 transition"
                            onClick={() => void removeSuppressed(s.id)}
                            disabled={deleting === s.id}
                            title="Remove from suppression"
                          >
                            {deleting === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {showCreate && (
        <CreateListModal
          clients={clients}
          onCreated={list => { setLists(prev => [list, ...prev]); setShowCreate(false) }}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  )
}

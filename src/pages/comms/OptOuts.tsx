import { useEffect, useState } from 'react'
import { Loader2, XCircle, Search } from 'lucide-react'
import { commsApi } from '../../lib/comms-api'
import { useToast } from '../../components/Toast'

interface OptOut {
  id: string; clientId: string; phoneNumber: string
  optedOut: boolean; optedOutAt: string | null; updatedAt: string
}

export function OptOuts() {
  const showToast = useToast()
  const [rows, setRows]       = useState<OptOut[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')

  async function load() {
    setLoading(true)
    try {
      // Use a direct fetch since commsApi doesn't have optouts yet
      const { getCommsApi, COMMS_SECRET } = await import('../../lib/config')
      const res = await fetch(`${getCommsApi()}/v1/admin/optouts`, {
        headers: { 'X-Operator-Secret': COMMS_SECRET, 'ngrok-skip-browser-warning': 'true' },
      })
      if (!res.ok) throw new Error('Failed to load opt-outs')
      setRows(await res.json() as OptOut[])
    } catch (e) {
      showToast((e as Error).message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const filtered = rows.filter(r =>
    r.phoneNumber.includes(search) || r.clientId.includes(search)
  )

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(196,40,111,0.15)' }}>
            <XCircle className="w-4 h-4" style={{ color: '#C4286F' }} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Opt-Outs</h1>
            <p className="text-xs text-muted-foreground">Contacts who sent STOP</p>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search phone…"
            className="pl-9 pr-3 py-2 rounded-xl bg-white/04 border border-white/06 text-sm text-foreground placeholder:text-muted-foreground/40 w-48"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <XCircle className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No opt-outs found</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map(r => (
            <div key={r.id} className="rounded-xl border border-white/06 bg-card px-4 py-3 flex items-center gap-4">
              <span className="font-mono text-sm text-foreground">{r.phoneNumber}</span>
              <span className="text-xs text-muted-foreground flex-1">Client: {r.clientId.slice(0, 8)}…</span>
              {r.optedOutAt && (
                <span className="text-xs text-red-400">{new Date(r.optedOutAt).toLocaleDateString()}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { structureApi, MonitoredBusiness, AdminNote } from '../../lib/structure-api'
import { RefreshCw, ChevronDown, ChevronUp, Send } from 'lucide-react'

function HealthBar({ value }: { value: number }) {
  const color = value >= 80 ? '#4DBFB3' : value >= 50 ? '#C9952B' : '#ef4444'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-white/10">
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="text-[11px] tabular-nums text-muted-foreground/60">{value}%</span>
    </div>
  )
}

function HealthDot({ value }: { value: number }) {
  return (
    <span
      className="inline-block w-2 h-2 rounded-full"
      style={{ background: value >= 80 ? '#4DBFB3' : value >= 50 ? '#C9952B' : '#ef4444' }}
    />
  )
}

function BusinessRow({ b }: { b: MonitoredBusiness }) {
  const [expanded, setExpanded] = useState(false)
  const [notes, setNotes] = useState<AdminNote[]>([])
  const [noteText, setNoteText] = useState('')
  const [loadingNotes, setLoadingNotes] = useState(false)
  const [savingNote, setSavingNote] = useState(false)

  const loadNotes = async () => {
    if (notes.length > 0) return
    setLoadingNotes(true)
    structureApi.listNotes(b.id).then(setNotes).finally(() => setLoadingNotes(false))
  }

  const toggle = () => {
    if (!expanded) loadNotes()
    setExpanded(v => !v)
  }

  const addNote = async () => {
    if (!noteText.trim()) return
    setSavingNote(true)
    try {
      await structureApi.addNote(b.id, noteText)
      setNotes(prev => [{ id: Date.now().toString(), business_id: b.id, note: noteText, created_by: 'You', created_at: new Date().toISOString() }, ...prev])
      setNoteText('')
    } finally {
      setSavingNote(false)
    }
  }

  return (
    <div className="border-b border-white/05 last:border-0">
      <div
        className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-white/[0.02] transition"
        onClick={toggle}
      >
        <HealthDot value={b.docHealth} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{b.name}</p>
          <p className="text-[11px] text-muted-foreground/40">{b.owner_name}</p>
        </div>
        <div className="hidden sm:grid grid-cols-3 gap-6 text-center">
          <div>
            <p className="text-[10px] text-muted-foreground/35 uppercase tracking-wider">Docs</p>
            <p className="text-sm font-semibold tabular-nums" style={{ color: b.docHealth >= 80 ? '#4DBFB3' : b.docHealth >= 50 ? '#C9952B' : '#ef4444' }}>
              {b.docHealth}%
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground/35 uppercase tracking-wider">Checks</p>
            <p className="text-sm font-semibold tabular-nums" style={{ color: b.checklistRate >= 70 ? '#4DBFB3' : b.checklistRate >= 40 ? '#C9952B' : '#ef4444' }}>
              {b.checklistRate}%
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground/35 uppercase tracking-wider">Stage</p>
            <p className="text-[11px] font-medium text-[#C9952B] capitalize">{b.stage}</p>
          </div>
        </div>
        {b.is_locked && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 font-semibold">LOCKED</span>
        )}
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground/30 shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground/30 shrink-0" />}
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 bg-white/[0.02]">
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="space-y-1.5">
              <p className="text-[11px] text-muted-foreground/40 uppercase tracking-wider">Doc health</p>
              <HealthBar value={b.docHealth} />
            </div>
            <div className="space-y-1.5">
              <p className="text-[11px] text-muted-foreground/40 uppercase tracking-wider">Checklist rate (7d)</p>
              <HealthBar value={b.checklistRate} />
            </div>
          </div>
          <div className="flex gap-4 text-[12px] text-muted-foreground/50">
            {b.overdueDocs > 0 && <span className="text-amber-400">{b.overdueDocs} overdue doc{b.overdueDocs > 1 ? 's' : ''}</span>}
            {b.last_active_at && <span>Last active {new Date(b.last_active_at).toLocaleDateString('en-NG')}</span>}
            {b.owner_phone && <span>{b.owner_phone}</span>}
          </div>

          {/* Notes */}
          <div className="pt-2 space-y-2">
            <p className="text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-wider">Call Notes</p>
            <div className="flex gap-2">
              <input
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addNote()}
                placeholder="Add a note…"
                className="flex-1 px-3 py-1.5 rounded-lg text-sm bg-white/[0.05] border border-white/10 text-foreground placeholder-muted-foreground/30 focus:outline-none focus:border-[#C9952B]/40"
              />
              <button onClick={addNote} disabled={savingNote || !noteText.trim()}
                className="p-2 rounded-lg text-[#C9952B] border border-[#C9952B]/25 hover:bg-[#C9952B]/10 disabled:opacity-40 transition">
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            {loadingNotes ? (
              <p className="text-xs text-muted-foreground/30 py-2">Loading notes…</p>
            ) : notes.length === 0 ? (
              <p className="text-xs text-muted-foreground/30 py-1">No notes yet</p>
            ) : (
              <div className="space-y-1.5">
                {notes.map(n => (
                  <div key={n.id} className="text-[12px] text-muted-foreground/65 flex gap-2">
                    <span className="text-muted-foreground/30 shrink-0">{new Date(n.created_at).toLocaleDateString('en-NG')}</span>
                    <span>{n.note}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function StructureMonitoring() {
  const [businesses, setBusinesses] = useState<MonitoredBusiness[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    structureApi.monitoring()
      .then(data => setBusinesses(data.sort((a, b) => {
        if (a.is_locked !== b.is_locked) return a.is_locked ? -1 : 1
        return a.docHealth - b.docHealth
      })))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground">Monitoring</h1>
          <p className="text-xs text-muted-foreground/50 mt-0.5">All businesses · sorted by health</p>
        </div>
        <button onClick={load} disabled={loading}
          className="p-2 rounded-lg text-muted-foreground/50 hover:text-foreground border border-white/08 hover:bg-white/5 disabled:opacity-40 transition">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && <div className="text-sm text-red-400 bg-red-500/5 border border-red-500/20 rounded-lg px-4 py-3">{error}</div>}

      <div className="rounded-xl border border-white/08 bg-white/[0.03] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground/40">Loading…</div>
        ) : businesses.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground/40">No businesses yet</div>
        ) : (
          businesses.map(b => <BusinessRow key={b.id} b={b} />)
        )}
      </div>
    </div>
  )
}

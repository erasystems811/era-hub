import { useEffect, useState, useRef } from 'react'
import {
  Plus, Trash2, Loader2, Briefcase, ArrowLeft, ArrowRight,
  MoreVertical, CheckCircle2, Circle, X, Users,
} from 'lucide-react'
import { patientApi, CrmLead } from '../../lib/patient-api'
import { pageCache } from '../../lib/cache'

const STAGES = ['prospect', 'demo_scheduled', 'negotiation', 'closed_won', 'closed_lost'] as const
type Stage = typeof STAGES[number]

const STAGE_LABEL: Record<Stage, string> = {
  prospect:       'Prospect',
  demo_scheduled: 'Demo Booked',
  negotiation:    'Negotiating',
  closed_won:     'Won',
  closed_lost:    'Lost',
}

const STAGE_COLORS: Record<Stage, { header: string; badge: string; btn: string }> = {
  prospect:       { header: 'border-primary/30 bg-primary/5',      badge: 'bg-primary/15 text-primary',           btn: 'bg-primary/10 text-primary hover:bg-primary/20' },
  demo_scheduled: { header: 'border-amber-500/30 bg-amber-500/5',  badge: 'bg-amber-500/15 text-amber-400',       btn: 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' },
  negotiation:    { header: 'border-blue-500/30 bg-blue-500/5',    badge: 'bg-blue-500/15 text-blue-400',         btn: 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20' },
  closed_won:     { header: 'border-teal/30 bg-teal/5',            badge: 'bg-teal/15 text-teal',                 btn: 'bg-teal/10 text-teal hover:bg-teal/20' },
  closed_lost:    { header: 'border-white/10 bg-white/[0.02]',     badge: 'bg-white/08 text-muted-foreground',    btn: 'bg-white/06 text-muted-foreground hover:bg-white/10' },
}

function timeAgo(iso: string | null) {
  if (!iso) return null
  const diff = Date.now() - new Date(iso).getTime()
  const d = Math.floor(diff / 86400000)
  if (d === 0) return 'today'
  if (d === 1) return '1d ago'
  if (d < 30) return `${d}d ago`
  return `${Math.floor(d / 30)}mo ago`
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')
}

// ── Lead Card ─────────────────────────────────────────────────

function LeadCard({
  lead,
  stageIndex,
  onMove,
  onDelete,
  onTaskToggle,
}: {
  lead: CrmLead
  stageIndex: number
  onMove: (id: string, direction: 'prev' | 'next') => void
  onDelete: (id: string) => void
  onTaskToggle: (lead: CrmLead, taskId: string, done: boolean) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const doneTasks  = lead.crm_requests?.filter(r => r.done).length ?? 0
  const totalTasks = lead.crm_requests?.length ?? 0
  const contacted  = timeAgo(lead.last_contacted)

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  return (
    <div className="rounded-xl border border-white/07 bg-card overflow-hidden transition-all duration-150">
      {/* Card header — click to expand */}
      <button
        className="w-full text-left px-4 pt-4 pb-3"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
            {initials(lead.name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{lead.name}</p>
            {lead.contact_person && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">{lead.contact_person}</p>
            )}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {totalTasks > 0 && (
                <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {doneTasks}/{totalTasks} tasks
                </span>
              )}
              {contacted && (
                <span className="text-[10px] text-muted-foreground/50">· {contacted}</span>
              )}
            </div>
          </div>
        </div>
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-white/06 space-y-3 mt-1">
          {lead.notes && (
            <p className="text-xs text-muted-foreground leading-relaxed pt-3">{lead.notes}</p>
          )}

          {(lead.crm_requests?.length ?? 0) > 0 && (
            <div className="space-y-1.5 pt-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tasks</p>
              {lead.crm_requests.map(task => (
                <button
                  key={task.id}
                  onClick={() => onTaskToggle(lead, task.id, !task.done)}
                  className="flex items-start gap-2 w-full text-left group"
                >
                  {task.done
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-teal shrink-0 mt-0.5" />
                    : <Circle className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0 mt-0.5 group-hover:text-muted-foreground/60" />}
                  <span className={`text-xs leading-snug ${task.done ? 'line-through text-muted-foreground/50' : 'text-foreground'}`}>
                    {task.text}
                  </span>
                </button>
              ))}
            </div>
          )}

          {lead.last_contacted && (
            <p className="text-[10px] text-muted-foreground/40 pt-1">
              Last contacted {new Date(lead.last_contacted).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          )}

          <button
            onClick={() => { if (window.confirm(`Remove "${lead.name}" from pipeline?`)) onDelete(lead.id) }}
            className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition mt-1"
          >
            <Trash2 className="w-3 h-3" /> Delete lead
          </button>
        </div>
      )}

      {/* Action bar */}
      <div className="px-3 pb-3 flex items-center gap-1">
        <button
          disabled={stageIndex === 0}
          onClick={(e) => { e.stopPropagation(); onMove(lead.id, 'prev') }}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition disabled:opacity-20 disabled:cursor-not-allowed bg-white/04 text-muted-foreground hover:bg-white/08 hover:text-foreground"
          title="Move to previous stage"
        >
          <ArrowLeft className="w-3 h-3" /> Move
        </button>
        <button
          disabled={stageIndex === STAGES.length - 1}
          onClick={(e) => { e.stopPropagation(); onMove(lead.id, 'next') }}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition disabled:opacity-20 disabled:cursor-not-allowed bg-white/04 text-muted-foreground hover:bg-white/08 hover:text-foreground"
          title="Move to next stage"
        >
          Move <ArrowRight className="w-3 h-3" />
        </button>

        <div className="ml-auto relative" ref={menuRef}>
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v) }}
            className="w-6 h-6 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/08 transition"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-7 z-20 w-32 rounded-xl border border-white/10 bg-card shadow-card-lg overflow-hidden">
              <button
                onClick={() => { setMenuOpen(false); if (window.confirm(`Remove "${lead.name}"?`)) onDelete(lead.id) }}
                className="flex items-center gap-2 w-full px-3 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Add Lead Modal ────────────────────────────────────────────

function AddLeadModal({
  defaultStage,
  onClose,
  onAdd,
}: {
  defaultStage: Stage
  onClose: () => void
  onAdd: (data: { name: string; contact_person: string; stage: Stage; notes: string }) => Promise<void>
}) {
  const [name,    setName]    = useState('')
  const [contact, setContact] = useState('')
  const [stage,   setStage]   = useState<Stage>(defaultStage)
  const [notes,   setNotes]   = useState('')
  const [saving,  setSaving]  = useState(false)

  const submit = async () => {
    if (!name.trim()) return
    setSaving(true)
    try { await onAdd({ name: name.trim(), contact_person: contact.trim(), stage, notes: notes.trim() }) }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-card shadow-card-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">Add lead</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/08 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-1.5 block">Hospital / Organisation *</label>
          <input
            autoFocus
            className="input w-full text-sm"
            placeholder="City General Hospital"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && void submit()}
          />
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-1.5 block">Contact person</label>
          <input
            className="input w-full text-sm"
            placeholder="Dr. Amaka Obi"
            value={contact}
            onChange={e => setContact(e.target.value)}
          />
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-1.5 block">Initial stage</label>
          <select className="input w-full text-sm" value={stage} onChange={e => setStage(e.target.value as Stage)}>
            {STAGES.map(s => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-1.5 block">Notes</label>
          <textarea
            className="input w-full text-sm resize-none"
            rows={2}
            placeholder="Context, next steps, pain points…"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="btn-secondary flex-1 text-sm">Cancel</button>
          <button
            onClick={() => void submit()}
            disabled={!name.trim() || saving}
            className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            Add lead
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────

export function CRM() {
  const [leads,   setLeads]   = useState<CrmLead[]>(() => pageCache.get<CrmLead[]>('crm:leads') ?? [])
  const [loading, setLoading] = useState(() => !pageCache.get('crm:leads'))
  const [modal,   setModal]   = useState<{ stage: Stage } | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const data = await patientApi.listCrmLeads()
      pageCache.set('crm:leads', data)
      setLeads(data)
    } finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [])

  const handleAdd = async (data: { name: string; contact_person: string; stage: Stage; notes: string }) => {
    const newLead = await patientApi.createCrmLead(data)
    setLeads(prev => [newLead, ...prev])
    pageCache.bust('crm:leads')
    setModal(null)
  }

  const handleMove = async (id: string, direction: 'prev' | 'next') => {
    const lead = leads.find(l => l.id === id)
    if (!lead) return
    const idx = STAGES.indexOf(lead.stage as Stage)
    const newStage = direction === 'prev' ? STAGES[idx - 1] : STAGES[idx + 1]
    if (!newStage) return

    // Optimistic update
    setLeads(prev => prev.map(l => l.id === id ? { ...l, stage: newStage } : l))
    try {
      await patientApi.updateCrmLead(id, { stage: newStage })
      pageCache.bust('crm:leads')
    } catch {
      // Revert
      setLeads(prev => prev.map(l => l.id === id ? { ...l, stage: lead.stage } : l))
    }
  }

  const handleDelete = async (id: string) => {
    setLeads(prev => prev.filter(l => l.id !== id))
    await patientApi.deleteCrmLead(id)
    pageCache.bust('crm:leads')
  }

  const handleTaskToggle = async (lead: CrmLead, taskId: string, done: boolean) => {
    const updated = {
      ...lead,
      crm_requests: lead.crm_requests.map(r => r.id === taskId ? { ...r, done } : r),
    }
    setLeads(prev => prev.map(l => l.id === lead.id ? updated : l))
    await patientApi.updateCrmLead(lead.id, { crm_requests: updated.crm_requests } as Partial<CrmLead>)
    pageCache.bust('crm:leads')
  }

  const counts = STAGES.reduce<Record<string, number>>((a, s) => {
    a[s] = leads.filter(l => l.stage === s).length
    return a
  }, {})

  const wonCount = counts.closed_won ?? 0

  return (
    <div className="h-full flex flex-col">
      {modal && (
        <AddLeadModal
          defaultStage={modal.stage}
          onClose={() => setModal(null)}
          onAdd={handleAdd}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="page-title">Sales Pipeline</h1>
          <p className="caption mt-0.5">{leads.length} leads · {wonCount} won</p>
        </div>
        <button
          className="btn-primary flex items-center gap-2 text-sm"
          onClick={() => setModal({ stage: 'prospect' })}
        >
          <Plus className="w-4 h-4" /> Add Lead
        </button>
      </div>

      {/* Stage summary chips */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {STAGES.map(s => (
          <div key={s} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${STAGE_COLORS[s].badge} border-current/20`}>
            {STAGE_LABEL[s]}
            <span className="opacity-60 tabular-nums">{loading ? '—' : (counts[s] ?? 0)}</span>
          </div>
        ))}
      </div>

      {/* Kanban board */}
      {loading ? (
        <div className="flex items-center justify-center flex-1 gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading pipeline…
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4 flex-1 min-h-0">
          {STAGES.map((stage, stageIdx) => {
            const col = STAGE_COLORS[stage]
            const colLeads = leads.filter(l => l.stage === stage)
            return (
              <div key={stage} className="flex flex-col shrink-0 w-[260px]">
                {/* Column header */}
                <div className={`flex items-center justify-between px-3 py-2.5 rounded-t-xl border ${col.header} border-b-0`}>
                  <span className="text-xs font-bold text-foreground">{STAGE_LABEL[stage]}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${col.badge}`}>
                    {colLeads.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex-1 border border-white/07 border-t-0 rounded-b-xl bg-[hsl(262_18%_9%)] p-2 space-y-2 overflow-y-auto min-h-[120px]">
                  {colLeads.length === 0 && (
                    <div className="flex items-center justify-center py-8 text-muted-foreground/30">
                      <Briefcase className="w-6 h-6" />
                    </div>
                  )}
                  {colLeads.map(lead => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      stageIndex={stageIdx}
                      onMove={handleMove}
                      onDelete={handleDelete}
                      onTaskToggle={handleTaskToggle}
                    />
                  ))}

                  {/* Add to this column */}
                  <button
                    onClick={() => setModal({ stage })}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-white/10 text-[11px] text-muted-foreground/40 hover:text-muted-foreground hover:border-white/20 transition"
                  >
                    <Plus className="w-3 h-3" /> Add
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {leads.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center">
          <Users className="w-10 h-10 text-muted-foreground/20" />
          <p className="font-semibold text-foreground">No leads yet</p>
          <p className="caption text-sm">Add your first lead to start tracking your sales pipeline</p>
          <button className="btn-primary flex items-center gap-2 text-sm mt-1" onClick={() => setModal({ stage: 'prospect' })}>
            <Plus className="w-4 h-4" /> Add first lead
          </button>
        </div>
      )}
    </div>
  )
}

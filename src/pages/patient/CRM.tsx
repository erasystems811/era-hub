import { useEffect, useState } from 'react'
import { Plus, Briefcase, Trash2, CheckCircle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { patientApi, CrmLead } from '../../lib/patient-api'
import { fmtDate } from '../../lib/utils'
import { pageCache } from '../../lib/cache'

const STAGES = ['prospect', 'demo_scheduled', 'negotiation', 'closed_won', 'closed_lost'] as const
const STAGE_LABEL: Record<string, string> = {
  prospect: 'Prospect', demo_scheduled: 'Demo Booked', negotiation: 'Negotiating',
  closed_won: 'Won', closed_lost: 'Lost',
}
const STAGE_BADGE: Record<string, string> = {
  prospect:       'bg-primary/10 text-primary border-primary/20',
  demo_scheduled: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  negotiation:    'bg-blue-500/10 text-blue-400 border-blue-500/20',
  closed_won:     'bg-teal/10 text-teal border-teal/20',
  closed_lost:    'bg-white/06 text-muted-foreground border-white/10',
}

function LeadCard({ lead, onUpdate, onDelete }: {
  lead: CrmLead
  onUpdate: (id: string, data: Partial<CrmLead>) => void
  onDelete: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-2xl border border-white/07 bg-card overflow-hidden">
      <button className="w-full text-left px-5 py-4" onClick={() => setExpanded(v => !v)}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/06 text-foreground text-sm font-bold flex items-center justify-center shrink-0">
              {lead.name[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground truncate">{lead.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{lead.contact_person || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${STAGE_BADGE[lead.stage] ?? 'bg-white/06 text-muted-foreground border-white/10'}`}>
              {STAGE_LABEL[lead.stage] ?? lead.stage}
            </span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 pt-0 border-t border-white/07 space-y-4">
          <div className="pt-4">
            <label className="label">Update stage</label>
            <select className="input mt-1.5" value={lead.stage}
              onChange={e => onUpdate(lead.id, { stage: e.target.value })}>
              {STAGES.map(s => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
            </select>
          </div>

          {lead.notes && (
            <div>
              <p className="label mb-1.5">Notes</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{lead.notes}</p>
            </div>
          )}

          {lead.crm_requests?.length > 0 && (
            <div>
              <p className="label mb-2">Tasks</p>
              <div className="space-y-1.5">
                {lead.crm_requests.map(r => (
                  <div key={r.id} className="flex items-start gap-2 text-sm">
                    <CheckCircle className={`w-4 h-4 shrink-0 mt-0.5 ${r.done ? 'text-teal' : 'text-muted-foreground/25'}`} />
                    <span className={r.done ? 'line-through text-muted-foreground' : 'text-foreground'}>{r.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-muted-foreground">Added {fmtDate(lead.created_at)}</p>
            <button className="text-xs text-red-400 flex items-center gap-1.5 hover:text-red-300 transition"
              onClick={() => { if (confirm(`Remove ${lead.name}?`)) onDelete(lead.id) }}>
              <Trash2 className="w-3.5 h-3.5" /> Remove lead
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function CRM() {
  const [leads, setLeads] = useState<CrmLead[]>(() => pageCache.get<CrmLead[]>('crm:leads') ?? [])
  const [loading, setLoading] = useState(() => !pageCache.get('crm:leads'))
  const [stageFilter, setStageFilter] = useState<string>('all')
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newContact, setNewContact] = useState('')
  const [creating, setCreating] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const data = await patientApi.listCrmLeads()
      pageCache.set('crm:leads', data)
      setLeads(data)
    } finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [])

  const update = async (id: string, data: Partial<CrmLead>) => {
    await patientApi.updateCrmLead(id, data)
    void load()
  }

  const deleteLead = async (id: string) => {
    await patientApi.deleteCrmLead(id)
    setLeads(prev => prev.filter(l => l.id !== id))
  }

  const create = async () => {
    if (!newName) return
    setCreating(true)
    try {
      await patientApi.createCrmLead({ name: newName, contact_person: newContact })
      setNewName(''); setNewContact(''); setShowCreate(false)
      void load()
    } finally { setCreating(false) }
  }

  const filtered = stageFilter === 'all' ? leads : leads.filter(l => l.stage === stageFilter)
  const counts = STAGES.reduce((a, s) => { a[s] = leads.filter(l => l.stage === s).length; return a }, {} as Record<string, number>)
  const won = counts.closed_won ?? 0

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="page-title">Sales CRM</h1>
          <p className="caption mt-0.5">{leads.length} leads · {won} won</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShowCreate(v => !v)}>
          <Plus className="w-4 h-4" /> {showCreate ? 'Cancel' : 'Add lead'}
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="rounded-2xl border border-white/07 bg-card p-5 mb-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Add a lead</h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="label">Hospital / organisation</label>
              <input className="input mt-1.5" value={newName} onChange={e => setNewName(e.target.value)} placeholder="City General Hospital" />
            </div>
            <div>
              <label className="label">Contact person</label>
              <input className="input mt-1.5" value={newContact} onChange={e => setNewContact(e.target.value)} placeholder="Dr. Amaka Obi" />
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
            <button className="btn-primary flex items-center gap-2" disabled={!newName || creating} onClick={create}>
              {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> Adding…</> : 'Add lead'}
            </button>
          </div>
        </div>
      )}

      {/* Stage filter pills */}
      <div className="flex flex-wrap gap-2 mb-5">
        {(['all', ...STAGES] as const).map(s => (
          <button key={s} onClick={() => setStageFilter(s)}
            className={`text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-all ${
              stageFilter === s
                ? 'bg-teal text-white border-teal'
                : 'bg-white/05 border-white/10 text-muted-foreground hover:border-teal/40 hover:text-foreground'
            }`}>
            {s === 'all' ? 'All' : STAGE_LABEL[s]}
            <span className="ml-1.5 opacity-60 tabular-nums">
              {s === 'all' ? leads.length : counts[s]}
            </span>
          </button>
        ))}
      </div>

      {/* Leads list */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading leads…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/07 bg-card flex flex-col items-center justify-center py-16 gap-3">
          <Briefcase className="w-10 h-10 text-muted-foreground/20" />
          <p className="font-semibold text-foreground">No leads here</p>
          <p className="caption text-sm">{stageFilter === 'all' ? 'Add your first lead to start tracking' : 'No leads in this stage'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(l => (
            <LeadCard key={l.id} lead={l} onUpdate={update} onDelete={deleteLead} />
          ))}
        </div>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Plus, Briefcase, Trash2, CheckCircle } from 'lucide-react'
import { Glass } from '../../components/Glass'
import { patientApi, CrmLead } from '../../lib/patient-api'
import { fmtDate } from '../../lib/utils'
import { pageCache } from '../../lib/cache'

const STAGES = ['prospect', 'demo_scheduled', 'negotiation', 'closed_won', 'closed_lost']
const STAGE_LABEL: Record<string, string> = {
  prospect: 'Prospect', demo_scheduled: 'Demo Booked', negotiation: 'Negotiating',
  closed_won: 'Won', closed_lost: 'Lost',
}
const STAGE_COLOR: Record<string, string> = {
  prospect: 'bg-pink-light text-pink border-pink-border',
  demo_scheduled: 'bg-amber-50 text-amber-600 border-amber-200',
  negotiation: 'bg-blue-50 text-blue-600 border-blue-200',
  closed_won: 'bg-teal-light text-teal border-teal/20',
  closed_lost: 'bg-gray-100 text-gray-400 border-gray-200',
}

function LeadCard({ lead, onUpdate, onDelete }: {
  lead: CrmLead
  onUpdate: (id: string, data: Partial<CrmLead>) => void
  onDelete: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="glass-sm" style={{ padding: 0 }}>
      <button className="w-full text-left px-4 py-3.5" onClick={() => setExpanded(v => !v)}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-medium text-charcoal text-sm">{lead.name}</div>
            <div className="text-xs text-charcoal-soft mt-0.5">{lead.contact_person || '—'}</div>
          </div>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${STAGE_COLOR[lead.stage] ?? 'bg-gray-100'}`}>
            {STAGE_LABEL[lead.stage] ?? lead.stage}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-pink-border pt-3 space-y-3">
          <div>
            <label className="label">Stage</label>
            <select
              className="input"
              value={lead.stage}
              onChange={e => onUpdate(lead.id, { stage: e.target.value })}
            >
              {STAGES.map(s => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
            </select>
          </div>
          {lead.notes && (
            <div>
              <div className="label">Notes</div>
              <div className="text-sm text-charcoal">{lead.notes}</div>
            </div>
          )}
          {lead.crm_requests?.length > 0 && (
            <div>
              <div className="label mb-2">Tasks</div>
              <div className="space-y-1">
                {lead.crm_requests.map(r => (
                  <div key={r.id} className="flex items-start gap-2 text-xs">
                    <CheckCircle className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${r.done ? 'text-teal' : 'text-charcoal-soft opacity-30'}`} />
                    <span className={r.done ? 'line-through text-charcoal-soft' : 'text-charcoal'}>{r.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="text-xs text-charcoal-soft">Added {fmtDate(lead.created_at)}</div>
          <button
            className="text-xs text-rose flex items-center gap-1 hover:underline"
            onClick={() => { if (confirm(`Remove ${lead.name}?`)) onDelete(lead.id) }}
          >
            <Trash2 className="w-3.5 h-3.5" /> Remove lead
          </button>
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

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Sales CRM</h1>
          <p className="caption mt-0.5">{leads.length} leads · {counts.closed_won ?? 0} won</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShowCreate(v => !v)}>
          <Plus className="w-4 h-4" /> Add lead
        </button>
      </div>

      {showCreate && (
        <Glass className="mb-4">
          <h3 className="section-title mb-4">Add a lead</h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="label">Hospital / organisation name</label>
              <input className="input" value={newName} onChange={e => setNewName(e.target.value)} placeholder="City General Hospital" />
            </div>
            <div>
              <label className="label">Contact person</label>
              <input className="input" value={newContact} onChange={e => setNewContact(e.target.value)} placeholder="Dr. Amaka Obi" />
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
            <button className="btn-primary" disabled={!newName || creating} onClick={create}>
              {creating ? 'Adding…' : 'Add lead'}
            </button>
          </div>
        </Glass>
      )}

      {/* Stage filter */}
      <div className="flex flex-wrap gap-2 mb-5">
        {['all', ...STAGES].map(s => (
          <button
            key={s}
            onClick={() => setStageFilter(s)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
              stageFilter === s
                ? 'bg-teal text-white border-teal'
                : 'bg-white border-pink-border text-charcoal-soft hover:border-teal'
            }`}
          >
            {s === 'all' ? 'All leads' : STAGE_LABEL[s]}
            <span className="ml-1.5 opacity-60">{s === 'all' ? leads.length : counts[s]}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-charcoal-soft">Loading…</div>
      ) : filtered.length === 0 ? (
        <Glass className="text-center py-12">
          <Briefcase className="w-10 h-10 text-pink mx-auto mb-3 opacity-40" />
          <p className="font-medium text-charcoal">No leads here</p>
          <p className="caption mt-1">Add your first lead to start tracking</p>
        </Glass>
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

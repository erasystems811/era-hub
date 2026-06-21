import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Clock, CheckCircle2, Loader2, Bell, ChevronRight, AlertTriangle } from 'lucide-react'
import { commsApi, type Client, type OnboardingRequest } from '../../lib/comms-api'

type Stage = 'request_submitted' | 'approved' | 'login_created' | 'whatsapp_connected' | 'ai_configured' | 'live'

const STAGES: { key: Stage; label: string }[] = [
  { key: 'request_submitted',  label: 'Submitted' },
  { key: 'approved',           label: 'Approved' },
  { key: 'login_created',      label: 'Login Created' },
  { key: 'whatsapp_connected', label: 'WhatsApp Connected' },
  { key: 'ai_configured',      label: 'AI Configured' },
  { key: 'live',               label: 'Live' },
]

const STAGE_INDEX: Record<Stage, number> = Object.fromEntries(STAGES.map((s, i) => [s.key, i])) as Record<Stage, number>

interface PipelineEntry {
  id: string
  name: string
  plan: string
  stage: Stage
  stageIndex: number
  createdAt: string
  isStuck: boolean
  clientId?: string
}

function deriveStage(client: Client): Stage {
  if (client.active && client.sessionCount > 0) return 'live'
  if (client.sessionCount > 0) return 'whatsapp_connected'
  return 'approved'
}

function isStuck(createdAt: string, hourThreshold = 48): boolean {
  return (Date.now() - new Date(createdAt).getTime()) > hourThreshold * 3600 * 1000
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1)  return 'just now'
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

function StageProgress({ stageIndex }: { stageIndex: number }) {
  const total = STAGES.length
  const pct   = Math.round((stageIndex / (total - 1)) * 100)
  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <div className="flex-1 min-w-0 h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background: pct === 100
              ? 'hsl(161 70% 50%)'
              : 'linear-gradient(90deg, #BF7C93, #d4a0b5)',
          }}
        />
      </div>
      <span className="text-xs text-muted-foreground shrink-0">{STAGES[stageIndex].label}</span>
    </div>
  )
}

export function Onboarding() {
  const nav = useNavigate()
  const [clients,  setClients]  = useState<Client[]>([])
  const [requests, setRequests] = useState<OnboardingRequest[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    Promise.all([
      commsApi.listClients().catch(() => [] as Client[]),
      commsApi.listRequests().catch(() => [] as OnboardingRequest[]),
    ]).then(([c, r]) => { setClients(c); setRequests(r) }).finally(() => setLoading(false))
  }, [])

  // Build pipeline entries
  const pipeline: PipelineEntry[] = []

  // Clients (approved and beyond)
  for (const c of clients) {
    const stage = deriveStage(c)
    pipeline.push({
      id:         c.id,
      name:       c.name,
      plan:       c.planName,
      stage,
      stageIndex: STAGE_INDEX[stage],
      createdAt:  c.createdAt,
      isStuck:    !c.active && isStuck(c.createdAt),
      clientId:   c.id,
    })
  }

  // Approved requests not yet in clients
  const clientNames = new Set(clients.map(c => c.name.toLowerCase()))
  for (const r of requests) {
    if (r.status !== 'approved') continue
    if (clientNames.has(r.businessName.toLowerCase())) continue
    pipeline.push({
      id:         r.id,
      name:       r.businessName,
      plan:       r.planName ?? '—',
      stage:      'login_created',
      stageIndex: STAGE_INDEX['login_created'],
      createdAt:  r.createdAt,
      isStuck:    isStuck(r.createdAt, 24),
    })
  }

  // Pending requests
  for (const r of requests) {
    if (r.status !== 'pending') continue
    pipeline.push({
      id:         r.id,
      name:       r.businessName,
      plan:       r.planName ?? '—',
      stage:      'request_submitted',
      stageIndex: STAGE_INDEX['request_submitted'],
      createdAt:  r.createdAt,
      isStuck:    isStuck(r.createdAt, 12),
    })
  }

  pipeline.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const totalInPipeline  = pipeline.length
  const stuckCount       = pipeline.filter(p => p.isStuck && p.stageIndex < STAGE_INDEX['live']).length
  const liveCount        = pipeline.filter(p => p.stage === 'live').length
  const avgDaysToLive    = (() => {
    const live = pipeline.filter(p => p.stage === 'live')
    if (!live.length) return null
    const avg = live.reduce((s, p) => s + (Date.now() - new Date(p.createdAt).getTime()), 0) / live.length
    return Math.round(avg / 86400000)
  })()

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h1 className="page-title">Onboarding</h1>
        <p className="caption mt-0.5">Track business setup progress end to end</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Users,         label: 'In Pipeline',         value: loading ? '—' : String(totalInPipeline) },
          { icon: AlertTriangle, label: 'Stuck',               value: loading ? '—' : String(stuckCount),  amber: true },
          { icon: CheckCircle2,  label: 'Live',                value: loading ? '—' : String(liveCount),   green: true },
          { icon: Clock,         label: 'Avg Days to Live',    value: loading ? '—' : avgDaysToLive !== null ? `${avgDaysToLive}d` : '—' },
        ].map(({ icon: Icon, label, value, amber, green }) => (
          <div key={label} className="rounded-xl border border-white/[0.07] bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-3.5 h-3.5 ${amber ? 'text-amber-400' : green ? 'text-emerald-400' : 'text-primary/70'}`} />
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">{label}</span>
            </div>
            <div className={`text-2xl font-bold ${amber && stuckCount > 0 ? 'text-amber-400' : green ? 'text-emerald-400' : 'text-foreground'}`}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Stage legend */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {STAGES.map((s, i) => (
          <div key={s.key} className="flex items-center gap-1 shrink-0">
            <div className="flex flex-col items-center">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold bg-white/[0.06] text-muted-foreground/60 border border-white/[0.08]">
                {i + 1}
              </div>
              <span className="text-[9px] text-muted-foreground/40 mt-1 whitespace-nowrap">{s.label}</span>
            </div>
            {i < STAGES.length - 1 && <div className="w-6 h-px bg-white/[0.08] mb-3" />}
          </div>
        ))}
      </div>

      {/* Pipeline list */}
      <div className="rounded-xl border border-white/[0.07] bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.07]">
          <h2 className="text-sm font-semibold text-foreground">All Businesses</h2>
        </div>
        {loading ? (
          <div className="divide-y divide-white/[0.04]">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-5 py-4 flex items-center gap-4 animate-pulse">
                <div className="h-4 bg-white/06 rounded w-32" />
                <div className="h-2 bg-white/06 rounded flex-1" />
                <div className="h-4 bg-white/06 rounded w-20" />
              </div>
            ))}
          </div>
        ) : pipeline.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Users className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No businesses in the pipeline yet</p>
            <p className="text-xs text-muted-foreground/50 mt-1">Businesses appear here when they submit an onboarding request</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {pipeline.map(entry => (
              <div key={entry.id} className="px-5 py-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
                <div className="w-52 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">{entry.name}</p>
                    {entry.isStuck && entry.stageIndex < STAGE_INDEX['live'] && (
                      <span title="Stalled — no progress in 48h+">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{entry.plan} · {timeAgo(entry.createdAt)}</p>
                </div>

                <StageProgress stageIndex={entry.stageIndex} />

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-amber-400 transition-colors px-2 py-1 rounded-lg hover:bg-amber-500/10"
                    onClick={() => {/* TODO: send reminder email via API */}}
                    title="Send reminder"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Remind</span>
                  </button>
                  {entry.clientId && (
                    <button
                      onClick={() => nav('/comms/businesses')}
                      className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors px-2 py-1 rounded-lg hover:bg-primary/10"
                    >
                      View <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                  {!entry.clientId && entry.stage === 'request_submitted' && (
                    <button
                      onClick={() => nav('/comms/requests')}
                      className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors px-2 py-1 rounded-lg hover:bg-primary/10"
                    >
                      Review <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Loader for loading state */}
      {loading && (
        <div className="flex justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  )
}

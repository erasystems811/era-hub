import { useState, useEffect } from 'react'
import { Brain, RefreshCw, Trash2 } from 'lucide-react'
import { CORE_API, CORE_SECRET } from '../../lib/config'

type Category = 'principle' | 'preference' | 'weakness' | 'style' | 'blindspot' | 'decision'
type Mode = 'business' | 'personal' | 'both'

interface Memory {
  id: string
  category: Category
  mode: Mode
  content: string
  confidence: number
  evidence: string | null
  reinforced: number
  created_at: string
}

const CATEGORY_LABELS: Record<Category, string> = {
  principle:  'Principles',
  preference: 'Preferences',
  weakness:   'Weaknesses',
  style:      'Style',
  blindspot:  'Blind Spots',
  decision:   'Decisions',
}

const CATEGORY_COLORS: Record<Category, string> = {
  principle:  '#9B7FD4',
  preference: '#4DBFB3',
  weakness:   '#f87171',
  style:      '#CC7896',
  blindspot:  '#f59e0b',
  decision:   '#60a5fa',
}

const MODE_LABELS: Record<Mode, string> = {
  business: 'Business',
  personal: 'Personal',
  both:     'Both',
}

export function CoreMemory() {
  const [memories, setMemories] = useState<Memory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Mode | 'all'>('all')
  const [deleting, setDeleting] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const url = filter === 'all' ? `${CORE_API}/v1/memories` : `${CORE_API}/v1/memories?mode=${filter}`
      const res = await fetch(url, { headers: { 'x-core-secret': CORE_SECRET } })
      if (!res.ok) throw new Error(`${res.status}`)
      setMemories(await res.json() as Memory[])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  async function deleteMemory(id: string) {
    setDeleting(id)
    try {
      await fetch(`${CORE_API}/v1/memories/${id}`, {
        method: 'DELETE',
        headers: { 'x-core-secret': CORE_SECRET },
      })
      setMemories(prev => prev.filter(m => m.id !== id))
    } finally {
      setDeleting(null)
    }
  }

  useEffect(() => { void load() }, [filter])

  const grouped = memories.reduce<Record<Category, Memory[]>>((acc, m) => {
    if (!acc[m.category]) acc[m.category] = []
    acc[m.category].push(m)
    return acc
  }, {} as Record<Category, Memory[]>)

  const PURPLE = '#9B7FD4'

  return (
    <div className="max-w-3xl mx-auto py-8 px-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${PURPLE}22`, border: `1px solid ${PURPLE}44` }}>
            <Brain className="w-4 h-4" style={{ color: PURPLE }} />
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground">What Core knows about you</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{memories.length} memories · extracted from your conversations</p>
          </div>
        </div>
        <button
          onClick={() => void load()}
          className="p-2 rounded-lg transition-all hover:bg-white/5"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Mode filter */}
      <div className="flex items-center gap-2 mb-6">
        {(['all', 'business', 'personal'] as const).map(m => (
          <button
            key={m}
            onClick={() => setFilter(m)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
            style={filter === m
              ? { background: `${PURPLE}22`, color: PURPLE, border: `1px solid ${PURPLE}44` }
              : { color: 'rgba(255,255,255,0.35)', border: '1px solid transparent' }
            }
          >
            {m === 'all' ? 'All' : MODE_LABELS[m]}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl px-4 py-3 mb-6 text-sm" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171' }}>
          {error === '401' ? 'Cannot connect to ERA Core — check your CORE_SECRET env var' : `Error: ${error}`}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: `${PURPLE}44`, borderTopColor: PURPLE }} />
        </div>
      )}

      {!loading && memories.length === 0 && !error && (
        <div className="text-center py-20">
          <Brain className="w-10 h-10 mx-auto mb-4 opacity-20" style={{ color: PURPLE }} />
          <p className="text-sm text-muted-foreground">No memories yet.</p>
          <p className="text-xs text-muted-foreground/50 mt-1">Start chatting or ingest your conversations to build Core's knowledge of you.</p>
        </div>
      )}

      {/* Grouped memories */}
      <div className="space-y-8">
        {(Object.keys(CATEGORY_LABELS) as Category[]).map(cat => {
          const mems = grouped[cat]
          if (!mems || mems.length === 0) return null
          const color = CATEGORY_COLORS[cat]
          return (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color }}>{CATEGORY_LABELS[cat]}</p>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: `${color}18`, color }}>{mems.length}</span>
              </div>
              <div className="space-y-2">
                {mems.map(m => (
                  <div
                    key={m.id}
                    className="group rounded-xl px-4 py-3 flex items-start gap-3 transition-all"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground/85 leading-relaxed">{m.content}</p>
                      {m.evidence && (
                        <p className="text-xs mt-1.5 italic leading-relaxed" style={{ color: 'rgba(255,255,255,0.28)' }}>
                          "{m.evidence}"
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: `${color}15`, color }}>
                          {MODE_LABELS[m.mode]}
                        </span>
                        <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.22)' }}>
                          {Math.round(m.confidence * 100)}% confidence · reinforced {m.reinforced}×
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => void deleteMemory(m.id)}
                      disabled={deleting === m.id}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded transition-all shrink-0 mt-0.5"
                      style={{ color: 'rgba(255,255,255,0.25)' }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

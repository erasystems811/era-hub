import { useState, useEffect } from 'react'
import { Brain, RefreshCw, Trash2, Settings, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { coreFetch } from '../../lib/coreFetch'
import { getCoreApi } from '../../lib/config'

type Category = 'principle' | 'preference' | 'weakness' | 'style' | 'blindspot' | 'decision' | 'company' | 'product'
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
  company:    'ERA Systems',
  product:    'Products',
  principle:  'Principles',
  preference: 'Preferences',
  weakness:   'Weaknesses',
  style:      'Style',
  blindspot:  'Blind Spots',
  decision:   'Decisions',
}

const CATEGORY_COLORS: Record<Category, string> = {
  company:    '#f59e0b',
  product:    '#10b981',
  principle:  '#9B7FD4',
  preference: '#4DBFB3',
  weakness:   '#f87171',
  style:      '#CC7896',
  blindspot:  '#fb923c',
  decision:   '#60a5fa',
}

const MODE_LABELS: Record<Mode, string> = {
  business: 'Business',
  personal: 'Personal',
  both:     'Both',
}

const CATEGORY_ORDER: Category[] = ['company', 'product', 'principle', 'preference', 'style', 'decision', 'weakness', 'blindspot']

const PURPLE = '#9B7FD4'

function NotConfiguredMemory() {
  const nav = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-24">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: `${PURPLE}18`, border: `1px solid ${PURPLE}30` }}>
        <Brain className="w-7 h-7" style={{ color: PURPLE }} />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-2">ERA Core not connected</h3>
      <p className="text-sm max-w-xs leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.38)' }}>
        Set your ERA Core URL and secret key first.
      </p>
      <button
        onClick={() => nav('/core/settings')}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
        style={{ background: PURPLE, color: 'white' }}
      >
        <Settings className="w-4 h-4" />
        Connect ERA Core
      </button>
    </div>
  )
}

export function CoreMemory() {
  const [memories, setMemories] = useState<Memory[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [filter, setFilter]     = useState<Mode | 'all'>('all')
  const [deleting, setDeleting] = useState<string | null>(null)

  // Manual input state
  const [fact, setFact]             = useState('')
  const [factCat, setFactCat]       = useState<Category>('company')
  const [factMode, setFactMode]     = useState<Mode>('business')
  const [saving, setSaving]         = useState(false)
  const [saveMsg, setSaveMsg]       = useState<string | null>(null)

  const configured = !!getCoreApi()

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const path = filter === 'all' ? '/v1/memories' : `/v1/memories?mode=${filter}`
      setMemories(await coreFetch<Memory[]>(path))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  async function addFact() {
    const content = fact.trim()
    if (!content) return
    setSaving(true)
    setSaveMsg(null)
    try {
      await coreFetch('/v1/memories', {
        method: 'POST',
        body: JSON.stringify({ category: factCat, mode: factMode, content, confidence: 1.0 }),
      })
      setFact('')
      setSaveMsg('Stored.')
      setTimeout(() => setSaveMsg(null), 2000)
      void load()
    } catch (e) {
      setSaveMsg(e instanceof Error ? e.message : 'Failed')
    } finally {
      setSaving(false)
    }
  }

  async function deleteMemory(id: string) {
    setDeleting(id)
    try {
      await coreFetch(`/v1/memories/${id}`, { method: 'DELETE' })
      setMemories(prev => prev.filter(m => m.id !== id))
    } finally {
      setDeleting(null)
    }
  }

  useEffect(() => { if (configured) void load() }, [filter, configured])

  if (!configured) return <NotConfiguredMemory />

  const grouped = memories.reduce<Partial<Record<Category, Memory[]>>>((acc, m) => {
    if (!acc[m.category]) acc[m.category] = []
    acc[m.category]!.push(m)
    return acc
  }, {})

  return (
    <div className="max-w-3xl mx-auto py-8 px-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${PURPLE}22`, border: `1px solid ${PURPLE}44` }}>
            <Brain className="w-4 h-4" style={{ color: PURPLE }} />
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground">What Core knows</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{memories.length} memories</p>
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

      {/* Teach it something directly */}
      <div className="rounded-2xl p-4 mb-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Teach Core something
        </p>
        <textarea
          value={fact}
          onChange={e => setFact(e.target.value)}
          placeholder="e.g. ERA Hub is the web dashboard for ERA Core. It lets Chi manage memories, import chats, and chat in business or personal mode."
          rows={2}
          className="w-full rounded-xl px-4 py-3 text-sm resize-none outline-none mb-3 leading-relaxed"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.88)' }}
        />
        <div className="flex items-center gap-2 flex-wrap">
          {/* Category picker */}
          <select
            value={factCat}
            onChange={e => setFactCat(e.target.value as Category)}
            className="rounded-lg px-3 py-1.5 text-xs outline-none"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.75)' }}
          >
            {CATEGORY_ORDER.map(c => (
              <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
            ))}
          </select>

          {/* Mode picker */}
          <select
            value={factMode}
            onChange={e => setFactMode(e.target.value as Mode)}
            className="rounded-lg px-3 py-1.5 text-xs outline-none"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.75)' }}
          >
            <option value="business">Business</option>
            <option value="personal">Personal</option>
            <option value="both">Both</option>
          </select>

          <button
            onClick={() => void addFact()}
            disabled={!fact.trim() || saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: fact.trim() ? PURPLE : 'rgba(255,255,255,0.06)',
              color: fact.trim() ? 'white' : 'rgba(255,255,255,0.25)',
              opacity: saving ? 0.6 : 1,
            }}
          >
            <Plus className="w-3 h-3" />
            {saving ? 'Storing…' : 'Store'}
          </button>

          {saveMsg && (
            <span className="text-xs" style={{ color: saveMsg === 'Stored.' ? '#4ade80' : '#f87171' }}>
              {saveMsg}
            </span>
          )}
        </div>
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
          {error === '401' ? 'Cannot connect to ERA Core — check your secret key' : `Error: ${error}`}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: `${PURPLE}44`, borderTopColor: PURPLE }} />
        </div>
      )}

      {!loading && memories.length === 0 && !error && (
        <div className="text-center py-16">
          <Brain className="w-10 h-10 mx-auto mb-4 opacity-20" style={{ color: PURPLE }} />
          <p className="text-sm text-muted-foreground">No memories yet.</p>
          <p className="text-xs text-muted-foreground/50 mt-1">Use the panel above to teach Core directly, or import your conversations.</p>
        </div>
      )}

      {/* Grouped memories */}
      <div className="space-y-8">
        {CATEGORY_ORDER.map(cat => {
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

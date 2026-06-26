import { useEffect, useState } from 'react'
import { Loader2, Shield, Plus, Trash2, X, CheckCircle2, AlertTriangle } from 'lucide-react'
import { moderationApi, type ModerationRule, type ModerationEvent } from '../../lib/comms-api'
import { useToast } from '../../components/Toast'

const ACTION_COLOURS: Record<string, string> = {
  flag:    'bg-yellow-500/15 text-yellow-400',
  warn:    'bg-orange-500/15 text-orange-400',
  suspend: 'bg-red-500/15 text-red-400',
}

export function Moderation() {
  const showToast = useToast()
  const [rules, setRules]     = useState<ModerationRule[]>([])
  const [events, setEvents]   = useState<ModerationEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [action, setAction]   = useState<'flag' | 'warn' | 'suspend'>('flag')
  const [adding, setAdding]   = useState(false)
  const [tab, setTab]         = useState<'rules' | 'events'>('events')

  async function load() {
    setLoading(true)
    try {
      const [r, e] = await Promise.all([moderationApi.listRules(), moderationApi.listEvents()])
      setRules(r); setEvents(e)
    } catch (e) {
      showToast((e as Error).message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  async function addRule() {
    if (!keyword.trim()) { showToast('Enter a keyword', 'error'); return }
    setAdding(true)
    try {
      await moderationApi.createRule({ keyword: keyword.trim(), action })
      showToast('Rule added', 'success')
      setKeyword('')
      void load()
    } catch (e) {
      showToast((e as Error).message, 'error')
    } finally {
      setAdding(false)
    }
  }

  async function deleteRule(id: string) {
    if (!confirm('Delete this moderation rule?')) return
    try {
      await moderationApi.deleteRule(id)
      showToast('Deleted', 'success')
      void load()
    } catch (e) {
      showToast((e as Error).message, 'error')
    }
  }

  async function resolve(id: string) {
    try {
      await moderationApi.resolveEvent(id)
      showToast('Resolved', 'success')
      void load()
    } catch (e) {
      showToast((e as Error).message, 'error')
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(196,40,111,0.15)' }}>
          <Shield className="w-4 h-4" style={{ color: '#C4286F' }} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">Content Moderation</h1>
          <p className="text-xs text-muted-foreground">Keyword rules and violation events</p>
        </div>
        {events.length > 0 && (
          <span className="ml-auto px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/15 text-red-400">
            {events.length} open
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/04 rounded-xl p-1 w-fit">
        {(['events', 'rules'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
              tab === t ? 'bg-white/10 text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : tab === 'events' ? (
        <div className="space-y-2">
          {events.length === 0 ? (
            <div className="text-center py-16">
              <CheckCircle2 className="w-10 h-10 mx-auto text-teal/40 mb-3" />
              <p className="text-sm text-muted-foreground">No open moderation events</p>
            </div>
          ) : (
            events.map(ev => (
              <div key={ev.id} className="rounded-2xl border border-white/06 bg-card p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                      <span className="text-sm font-semibold text-foreground">{ev.clientName}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${ACTION_COLOURS[ev.actionTaken] ?? 'bg-white/10 text-white/50'}`}>
                        {ev.actionTaken}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Triggered by: <span className="font-mono text-foreground/70">{ev.matchedKeyword}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 italic truncate">"{ev.content}"</p>
                    <p className="text-[10px] text-muted-foreground/50 mt-1">{new Date(ev.createdAt).toLocaleString()}</p>
                  </div>
                  <button onClick={() => void resolve(ev.id)}
                    className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border border-white/10 text-muted-foreground hover:text-foreground transition-colors">
                    Resolve
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Add rule */}
          <div className="rounded-2xl border border-white/06 bg-card p-4 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Add Keyword Rule</h2>
            <div className="flex gap-2">
              <input
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') void addRule() }}
                placeholder="keyword or phrase…"
                className="flex-1 px-3 py-2 rounded-xl bg-[hsl(262_20%_11%)] border border-white/06 text-sm text-foreground placeholder:text-muted-foreground/40"
              />
              <select value={action} onChange={e => setAction(e.target.value as 'flag' | 'warn' | 'suspend')}
                className="px-3 py-2 rounded-xl bg-[hsl(262_20%_11%)] border border-white/06 text-sm text-foreground">
                <option value="flag">Flag</option>
                <option value="warn">Warn</option>
                <option value="suspend">Suspend</option>
              </select>
              <button onClick={() => void addRule()} disabled={adding}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 flex items-center gap-1.5"
                style={{ background: '#C4286F' }}>
                {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Add
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Flag = log only · Warn = log + increment warning count · Suspend = auto-suspend account
            </p>
          </div>

          {/* Rules list */}
          {rules.length === 0 ? (
            <div className="text-center py-10">
              <Shield className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No rules yet</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {rules.map(r => (
                <div key={r.id} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/06 bg-card">
                  <span className="flex-1 text-sm font-mono text-foreground">{r.keyword}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${ACTION_COLOURS[r.action] ?? 'bg-white/10 text-white/50'}`}>
                    {r.action}
                  </span>
                  <button onClick={() => void deleteRule(r.id)}
                    className="text-muted-foreground hover:text-red-400 transition-colors ml-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

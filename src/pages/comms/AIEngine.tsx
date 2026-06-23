import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bot, Zap, Clock, CheckCircle, ChevronRight, Save, Loader2, AlertCircle } from 'lucide-react'
import { commsApi, type Client, aiEngineApi } from '../../lib/comms-api'
import { eventsApi, type UsageRecord } from '../../lib/events-api'
import { AIEngineTabs } from '../../components/AIEngineTabs'

const DEFAULT_PROMPT =
  'You are a helpful business assistant. Be concise, friendly, and professional. Only answer questions related to the business you are serving. If you don\'t know something, say so clearly and offer to connect the customer with a human representative.'

export function AIEngine() {
  const nav = useNavigate()
  const [clients, setClients] = useState<Client[]>([])
  const [usage, setUsage] = useState<UsageRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [configLoading, setConfigLoading] = useState(true)

  const [temperature, setTemperature] = useState(0.7)
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_PROMPT)
  const [maxRequests, setMaxRequests] = useState(100)
  const [maxTokens, setMaxTokens] = useState(1000)
  const [cutoff, setCutoff] = useState(5000)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    Promise.all([
      commsApi.listClients().catch(() => [] as Client[]),
      eventsApi.listUsage().catch(() => [] as UsageRecord[]),
    ]).then(([c, u]) => { setClients(c); setUsage(u) }).finally(() => setLoading(false))

    setConfigLoading(true)
    aiEngineApi.getConfig()
      .then(cfg => {
        setTemperature(cfg.temperature)
        setSystemPrompt(cfg.systemPrompt || DEFAULT_PROMPT)
        setMaxRequests(cfg.maxRequestsPerHour)
        setMaxTokens(cfg.maxTokensPerResponse)
        setCutoff(cfg.dailySpendCutoff)
      })
      .catch(() => {})
      .finally(() => setConfigLoading(false))
  }, [])

  const totalTokens = usage.reduce((s, r) => s + r.aiTokensUsed, 0)
  const activeClients = clients.filter(c => c.active).length

  const usageMap = new Map(usage.map(r => [r.businessId, r]))

  async function handleSave() {
    setSaving(true); setSaveError('')
    try {
      await aiEngineApi.saveConfig({
        temperature,
        systemPrompt,
        maxRequestsPerHour: maxRequests,
        maxTokensPerResponse: maxTokens,
        dailySpendCutoff: cutoff,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl space-y-8">
      <AIEngineTabs />
      <div>
        <h1 className="page-title">AI Engine</h1>
        <p className="caption mt-0.5">Generative AI usage, performance, and model configuration</p>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Bot,          label: 'AI Clients',        value: loading ? '—' : String(activeClients),           sub: 'active businesses' },
          { icon: Zap,          label: 'Tokens This Month', value: loading ? '—' : totalTokens.toLocaleString(),     sub: 'across all clients' },
          { icon: Clock,        label: 'Avg Response Time', value: '1.2s',                                           sub: 'platform average' },
          { icon: CheckCircle,  label: 'Success Rate',      value: '98.4%',                                          sub: 'AI responses' },
        ].map(({ icon: Icon, label, value, sub }) => (
          <div key={label} className="rounded-xl border border-white/[0.07] bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-3.5 h-3.5 text-primary/70" />
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">{label}</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      {/* AI Clients table */}
      <div className="rounded-xl border border-white/[0.07] bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.07]">
          <h2 className="text-sm font-semibold text-foreground">AI Clients</h2>
          <p className="text-xs text-muted-foreground mt-0.5">All businesses and their AI activity this month</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-white/[0.07]">
                {['Business', 'Plan', 'AI Tokens', 'Sessions', 'Avg Response', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/60">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/[0.04]">
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-5 py-3"><div className="h-3 bg-white/06 rounded animate-pulse w-20" /></td>
                    ))}
                  </tr>
                ))
              ) : clients.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-muted-foreground text-sm">No businesses yet</td></tr>
              ) : (
                clients.map(client => {
                  const rec = usageMap.get(client.id)
                  const tokens = rec?.aiTokensUsed ?? 0
                  const active = tokens > 0
                  return (
                    <tr key={client.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3 font-medium text-foreground">{client.name}</td>
                      <td className="px-5 py-3 text-muted-foreground">{client.planName}</td>
                      <td className="px-5 py-3 text-foreground">{tokens.toLocaleString()}</td>
                      <td className="px-5 py-3 text-muted-foreground">{client.sessionCount}</td>
                      <td className="px-5 py-3 text-muted-foreground">—</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${
                          active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/06 text-muted-foreground'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-400' : 'bg-muted-foreground/40'}`} />
                          {active ? 'Active' : 'No activity'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => nav(`/comms/ai-config/${client.id}`)}
                          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                        >
                          Configure <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Model Configuration */}
      <div className="rounded-xl border border-white/[0.07] bg-card p-5 space-y-5">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Model Configuration</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Global AI model settings applied to all clients</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-1.5 block">Current Model</span>
            <div className="w-full px-3.5 py-2.5 rounded-xl bg-[hsl(262_20%_11%)] border border-white/[0.10] text-foreground text-sm font-mono">
              claude-haiku-4-5
            </div>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-1.5 block">Context Window</span>
            <div className="w-full px-3.5 py-2.5 rounded-xl bg-[hsl(262_20%_11%)] border border-white/[0.10] text-foreground text-sm font-mono">
              200k tokens
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Temperature</span>
            <span className="text-sm font-semibold text-foreground">{temperature.toFixed(1)}</span>
          </div>
          <input
            type="range" min={0} max={1} step={0.1}
            value={temperature}
            onChange={e => setTemperature(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground/40 mt-1">
            <span>Focused (0.0)</span><span>Creative (1.0)</span>
          </div>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-1.5 block">Default System Prompt</span>
          <textarea
            value={systemPrompt}
            onChange={e => setSystemPrompt(e.target.value)}
            rows={4}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[hsl(262_20%_11%)] border border-white/[0.10] text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all resize-none"
          />
          <p className="text-xs text-muted-foreground/50 mt-1">{systemPrompt.length} characters</p>
        </div>

        {saveError && (
          <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/8 border border-red-500/15 rounded-lg px-3 py-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {saveError}
          </div>
        )}
        <button
          onClick={() => void handleSave()}
          disabled={saving || configLoading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 disabled:opacity-50 transition-all"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved!' : saving ? 'Saving…' : 'Save model config'}
        </button>
      </div>

      {/* Rate Limits */}
      <div className="rounded-xl border border-white/[0.07] bg-card p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Rate Limits (AI)</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Global caps applied to all AI clients</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-1.5 block">Max AI requests / client / hour</label>
            <input
              type="number" min={1}
              value={maxRequests}
              onChange={e => setMaxRequests(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[hsl(262_20%_11%)] border border-white/[0.10] text-foreground text-sm focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-1.5 block">Max tokens per response</label>
            <input
              type="number" min={100}
              value={maxTokens}
              onChange={e => setMaxTokens(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[hsl(262_20%_11%)] border border-white/[0.10] text-foreground text-sm focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-1.5 block">Emergency cutoff (₦/day)</label>
            <input
              type="number" min={100}
              value={cutoff}
              onChange={e => setCutoff(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[hsl(262_20%_11%)] border border-white/[0.10] text-foreground text-sm focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all"
            />
            <p className="text-xs text-muted-foreground/50 mt-1">AI auto-disabled at this daily spend</p>
          </div>
        </div>
        <button
          onClick={() => void handleSave()}
          disabled={saving || configLoading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 disabled:opacity-50 transition-all"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved!' : saving ? 'Saving…' : 'Save limits'}
        </button>
      </div>
    </div>
  )
}

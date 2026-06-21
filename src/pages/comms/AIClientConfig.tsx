import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { commsApi, type ClientDetail } from '../../lib/comms-api'

const INPUT = 'w-full px-3.5 py-2.5 rounded-xl bg-[hsl(262_20%_11%)] border border-white/[0.10] text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all'
const LABEL = 'text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-1.5 block'

const DEFAULT_PROMPT = 'You are a helpful business assistant. Be concise, friendly, and professional. Only answer questions related to the business you are serving.'

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-white/10'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
  )
}

export function AIClientConfig() {
  const { clientId } = useParams<{ clientId: string }>()
  const nav = useNavigate()

  const [detail, setDetail]     = useState<ClientDetail | null>(null)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [error, setError]       = useState<string | null>(null)

  // Section 1
  const [aiEnabled, setAiEnabled] = useState(true)

  // Section 2
  const [useCustomPrompt, setUseCustomPrompt] = useState(false)
  const [customPrompt, setCustomPrompt]       = useState(DEFAULT_PROMPT)

  // Section 3
  const [kbEnabled, setKbEnabled] = useState(true)

  // Section 4
  const [tone, setTone]             = useState('friendly')
  const [responseLen, setResponseLen] = useState('medium')
  const [language, setLanguage]     = useState('english')
  const [followLang, setFollowLang] = useState(false)

  // Section 5
  const [overrideHourly, setOverrideHourly]   = useState(false)
  const [hourlyLimit, setHourlyLimit]         = useState(100)
  const [overrideTokens, setOverrideTokens]   = useState(false)
  const [maxTokens, setMaxTokens]             = useState(1000)
  const [dailyCap, setDailyCap]               = useState<number | ''>('')

  useEffect(() => {
    if (!clientId) return
    commsApi.getClient(clientId)
      .then(d => { setDetail(d); setAiEnabled(d.active) })
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [clientId])

  async function handleSave() {
    if (!clientId || !detail) return
    setSaving(true); setError(null)
    try {
      await commsApi.updateClient(clientId, { active: aiEnabled })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => nav('/comms/ai-engine')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> AI Engine
        </button>
        <h1 className="page-title">{detail?.name ?? 'Business'}</h1>
        <p className="caption mt-0.5">AI Configuration</p>
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</div>
      )}

      {/* Section 1 — AI Status */}
      <div className="rounded-xl border border-white/[0.07] bg-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">AI Status</p>
            <p className="text-xs text-muted-foreground mt-0.5">Enable or disable AI responses for this business</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-medium ${aiEnabled ? 'text-emerald-400' : 'text-muted-foreground'}`}>
              {aiEnabled ? 'Enabled' : 'Disabled'}
            </span>
            <Toggle checked={aiEnabled} onChange={setAiEnabled} />
          </div>
        </div>
      </div>

      {/* Section 2 — Custom System Prompt */}
      <div className="rounded-xl border border-white/[0.07] bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Custom System Prompt</p>
            <p className="text-xs text-muted-foreground mt-0.5">Override the global AI prompt for this business</p>
          </div>
          <Toggle checked={useCustomPrompt} onChange={setUseCustomPrompt} />
        </div>
        {useCustomPrompt && (
          <div>
            <textarea
              value={customPrompt}
              onChange={e => setCustomPrompt(e.target.value)}
              rows={5}
              className={`${INPUT} resize-none`}
              placeholder="Describe how the AI should behave for this business…"
            />
            <p className="text-xs text-muted-foreground/50 mt-1">{customPrompt.length} characters</p>
          </div>
        )}
        {!useCustomPrompt && (
          <p className="text-xs text-muted-foreground/60 italic">Using global default prompt</p>
        )}
      </div>

      {/* Section 3 — Knowledge Base */}
      <div className="rounded-xl border border-white/[0.07] bg-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Knowledge Base Integration</p>
            <p className="text-xs text-muted-foreground mt-0.5">Include this business's KB in AI context</p>
          </div>
          <Toggle checked={kbEnabled} onChange={setKbEnabled} />
        </div>
        {kbEnabled && (
          <p className="text-xs text-muted-foreground/60 mt-3">KB entries will be automatically included when the AI responds</p>
        )}
      </div>

      {/* Section 4 — Response Behaviour */}
      <div className="rounded-xl border border-white/[0.07] bg-card p-5 space-y-4">
        <div>
          <p className="text-sm font-semibold text-foreground">Response Behavior</p>
          <p className="text-xs text-muted-foreground mt-0.5">How the AI communicates with customers</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={LABEL}>Tone</label>
            <select value={tone} onChange={e => setTone(e.target.value)} className={INPUT}>
              <option value="friendly">Friendly</option>
              <option value="professional">Professional</option>
              <option value="formal">Formal</option>
              <option value="casual">Casual</option>
            </select>
          </div>
          <div>
            <label className={LABEL}>Response Length</label>
            <select value={responseLen} onChange={e => setResponseLen(e.target.value)} className={INPUT}>
              <option value="short">Short</option>
              <option value="medium">Medium</option>
              <option value="detailed">Detailed</option>
            </select>
          </div>
          <div>
            <label className={LABEL}>Language</label>
            <select value={language} onChange={e => setLanguage(e.target.value)} className={INPUT}>
              <option value="english">English</option>
              <option value="yoruba">Yoruba</option>
              <option value="igbo">Igbo</option>
              <option value="hausa">Hausa</option>
              <option value="pidgin">Pidgin</option>
              <option value="auto">Auto-detect</option>
            </select>
          </div>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
          <div>
            <p className="text-sm text-foreground">Always respond in customer's language</p>
            <p className="text-xs text-muted-foreground mt-0.5">AI detects and mirrors the customer's language</p>
          </div>
          <Toggle checked={followLang} onChange={setFollowLang} />
        </div>
      </div>

      {/* Section 5 — Per-client Limits */}
      <div className="rounded-xl border border-white/[0.07] bg-card p-5 space-y-4">
        <div>
          <p className="text-sm font-semibold text-foreground">Limits for this Client</p>
          <p className="text-xs text-muted-foreground mt-0.5">Override global rate limits for this business</p>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <Toggle checked={overrideHourly} onChange={setOverrideHourly} />
            <label className="text-sm text-foreground flex-1">Override hourly AI request limit</label>
            {overrideHourly && (
              <input
                type="number" min={1}
                value={hourlyLimit}
                onChange={e => setHourlyLimit(Number(e.target.value))}
                className="w-24 px-3 py-1.5 rounded-lg bg-[hsl(262_20%_11%)] border border-white/[0.10] text-foreground text-sm focus:outline-none focus:border-primary/50"
              />
            )}
          </div>
          <div className="flex items-center gap-4">
            <Toggle checked={overrideTokens} onChange={setOverrideTokens} />
            <label className="text-sm text-foreground flex-1">Override max tokens per response</label>
            {overrideTokens && (
              <input
                type="number" min={100}
                value={maxTokens}
                onChange={e => setMaxTokens(Number(e.target.value))}
                className="w-24 px-3 py-1.5 rounded-lg bg-[hsl(262_20%_11%)] border border-white/[0.10] text-foreground text-sm focus:outline-none focus:border-primary/50"
              />
            )}
          </div>
          <div>
            <label className={LABEL}>Daily spend cap (₦) — leave blank for no cap</label>
            <input
              type="number" min={0}
              value={dailyCap}
              onChange={e => setDailyCap(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="e.g. 2000"
              className={INPUT}
            />
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 disabled:opacity-50 transition-all"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved!' : saving ? 'Saving…' : 'Save configuration'}
        </button>
      </div>
    </div>
  )
}

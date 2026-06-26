import { useEffect, useState } from 'react'
import { Loader2, Bot, Save, Plus, X } from 'lucide-react'
import { bizApi } from './business-api'

const INPUT = 'w-full px-3.5 py-2.5 rounded-xl bg-[hsl(262_20%_11%)] border border-white/[0.10] text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 transition-all'
const LABEL = 'text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-1.5 block'

type Profile = {
  exists: boolean; aiReply: boolean; persona: string; tone: string; systemPrompt: string
  permittedTopics: string[]; prohibitedTopics: string[]; escalationTriggers: string[]
  maxTokens: number; temperature: number
}

function TagInput({ label, values, onChange }: { label: string; values: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState('')
  function add() {
    const v = input.trim()
    if (v && !values.includes(v)) onChange([...values, v])
    setInput('')
  }
  return (
    <div>
      <label className={LABEL}>{label}</label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {values.map(v => (
          <span key={v} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-white/08 text-foreground">
            {v}
            <button onClick={() => onChange(values.filter(x => x !== v))} className="text-muted-foreground hover:text-white ml-0.5">
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder="Type and press Enter…"
          className={`${INPUT} text-xs`} />
        <button onClick={add} className="px-3 py-2 rounded-xl border border-white/10 text-xs text-muted-foreground hover:text-foreground">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

export function AutoReplyModule() {
  const [profile, setProfile]   = useState<Profile | null>(null)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const [aiReply, setAiReply]           = useState(false)
  const [persona, setPersona]           = useState('')
  const [tone, setTone]                 = useState('')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [permitted, setPermitted]       = useState<string[]>([])
  const [prohibited, setProhibited]     = useState<string[]>([])
  const [escalation, setEscalation]     = useState<string[]>([])
  const [maxTokens, setMaxTokens]       = useState(500)
  const [temperature, setTemperature]   = useState(0.7)

  useEffect(() => {
    bizApi.getAiProfile()
      .then(p => {
        setProfile(p); setAiReply(p.aiReply); setPersona(p.persona); setTone(p.tone)
        setSystemPrompt(p.systemPrompt); setPermitted(p.permittedTopics)
        setProhibited(p.prohibitedTopics); setEscalation(p.escalationTriggers)
        setMaxTokens(p.maxTokens); setTemperature(p.temperature)
      })
      .catch(() => setError('Failed to load auto-reply settings'))
      .finally(() => setLoading(false))
  }, [])

  async function save() {
    setSaving(true); setError(null)
    try {
      await bizApi.saveAiProfile({
        aiReply, persona, tone, systemPrompt,
        permittedTopics: permitted, prohibitedTopics: prohibited,
        escalationTriggers: escalation, maxTokens, temperature,
      })
      setSaved(true); setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Bot className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h2 className="text-base font-bold text-foreground">Auto-Reply Setup</h2>
          <p className="text-xs text-muted-foreground">Configure how ERA responds to your customers on WhatsApp</p>
        </div>
      </div>

      {error && <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">{error}</div>}

      {/* Enable toggle */}
      <div className="p-5 rounded-xl border border-white/[0.07] bg-card flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Enable Auto-Reply</p>
          <p className="text-xs text-muted-foreground mt-0.5">ERA will automatically respond to inbound WhatsApp messages</p>
        </div>
        <button onClick={() => setAiReply(v => !v)}
          className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${aiReply ? 'bg-primary' : 'bg-white/10'}`}>
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${aiReply ? 'translate-x-5' : ''}`} />
        </button>
      </div>

      <div className="p-5 rounded-xl border border-white/[0.07] bg-card space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">Persona & Tone</p>

        <div>
          <label className={LABEL}>Persona</label>
          <input value={persona} onChange={e => setPersona(e.target.value)}
            placeholder="e.g. a helpful customer service agent for our store"
            className={INPUT} />
        </div>

        <div>
          <label className={LABEL}>Communication Style</label>
          <input value={tone} onChange={e => setTone(e.target.value)}
            placeholder="e.g. friendly, professional, concise"
            className={INPUT} />
        </div>

        <div>
          <label className={LABEL}>Custom Instructions (optional)</label>
          <textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)}
            rows={3} placeholder="Additional instructions — leave blank to use your persona + style above"
            className={`${INPUT} resize-none`} />
        </div>
      </div>

      <div className="p-5 rounded-xl border border-white/[0.07] bg-card space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">Topic Controls</p>
        <TagInput label="Only reply about (leave empty for everything)" values={permitted} onChange={setPermitted} />
        <TagInput label="Never discuss" values={prohibited} onChange={setProhibited} />
        <TagInput label="Hand off to human when customer says" values={escalation} onChange={setEscalation} />
      </div>

      <button onClick={() => void save()} disabled={saving}
        className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2 transition-opacity"
        style={{ background: '#C4286F' }}>
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saved ? 'Saved!' : 'Save Settings'}
      </button>
    </div>
  )
}

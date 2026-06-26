import { useEffect, useState } from 'react'
import { Loader2, Bot, Save, Plus, X } from 'lucide-react'
import { commsApi, aiProfileApi, type Client, type AIReplyProfile } from '../../lib/comms-api'
import { useToast } from '../../components/Toast'

const FIELD = "w-full px-3 py-2.5 rounded-xl bg-[hsl(262_20%_11%)] border border-white/06 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-pink-500/40 transition-colors"
const LABEL = "text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5"

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
            <button onClick={() => onChange(values.filter(x => x !== v))} className="text-muted-foreground hover:text-foreground ml-0.5">
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder="Type and press Enter…"
          className={`${FIELD} text-xs`}
        />
        <button onClick={add} className="px-3 py-2 rounded-xl border border-white/10 text-xs text-muted-foreground hover:text-foreground">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

export function AIReplyConfig() {
  const showToast = useToast()
  const [clients, setClients]   = useState<Client[]>([])
  const [clientId, setClientId] = useState('')
  const [profile, setProfile]   = useState<AIReplyProfile | null>(null)
  const [loading, setLoading]   = useState(false)
  const [saving, setSaving]     = useState(false)

  // Form state
  const [aiReply, setAiReply]   = useState(false)
  const [persona, setPersona]   = useState('')
  const [tone, setTone]         = useState('')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [permitted, setPermitted]       = useState<string[]>([])
  const [prohibited, setProhibited]     = useState<string[]>([])
  const [escalation, setEscalation]     = useState<string[]>([])
  const [maxTokens, setMaxTokens]       = useState(500)
  const [temperature, setTemperature]   = useState(0.7)

  useEffect(() => {
    commsApi.listClients().then(setClients).catch(() => {})
  }, [])

  useEffect(() => {
    if (!clientId) { setProfile(null); return }
    setLoading(true)
    aiProfileApi.get(clientId)
      .then(p => {
        setProfile(p)
        setAiReply(p.aiReply)
        setPersona(p.persona)
        setTone(p.tone)
        setSystemPrompt(p.systemPrompt)
        setPermitted(p.permittedTopics)
        setProhibited(p.prohibitedTopics)
        setEscalation(p.escalationTriggers)
        setMaxTokens(p.maxTokens)
        setTemperature(p.temperature)
      })
      .catch(() => showToast('Failed to load profile', 'error'))
      .finally(() => setLoading(false))
  }, [clientId])

  async function save() {
    if (!clientId) return
    setSaving(true)
    try {
      await aiProfileApi.save(clientId, {
        aiReply, persona, tone, systemPrompt,
        permittedTopics: permitted, prohibitedTopics: prohibited,
        escalationTriggers: escalation, maxTokens, temperature,
      })
      showToast('Auto-reply profile saved', 'success')
    } catch (e) {
      showToast((e as Error).message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(196,40,111,0.15)' }}>
          <Bot className="w-4 h-4" style={{ color: '#C4286F' }} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">Auto-Reply Setup</h1>
          <p className="text-xs text-muted-foreground">Configure per-business WhatsApp auto-reply</p>
        </div>
      </div>

      {/* Business selector */}
      <div>
        <label className={LABEL}>Select Business</label>
        <select value={clientId} onChange={e => setClientId(e.target.value)} className={FIELD}>
          <option value="">Choose a business…</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {clientId && (
        loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="space-y-5">
            {/* Enable toggle */}
            <div className="rounded-2xl border border-white/06 bg-card p-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-foreground">Enable Auto-Reply</div>
                <div className="text-xs text-muted-foreground mt-0.5">Automatically replies to inbound WhatsApp messages</div>
              </div>
              <button
                onClick={() => setAiReply(v => !v)}
                className={`relative w-11 h-6 rounded-full transition-colors ${aiReply ? 'bg-pink-600' : 'bg-white/10'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${aiReply ? 'translate-x-5' : ''}`} />
              </button>
            </div>

            {/* Profile fields */}
            <div className="space-y-4 rounded-2xl border border-white/06 bg-card p-5">
              <h2 className="text-sm font-semibold text-foreground">Persona & Tone</h2>

              <div>
                <label className={LABEL}>Persona</label>
                <input value={persona} onChange={e => setPersona(e.target.value)}
                  placeholder="e.g. a helpful customer service agent for Acme Store"
                  className={FIELD} />
              </div>

              <div>
                <label className={LABEL}>Tone</label>
                <input value={tone} onChange={e => setTone(e.target.value)}
                  placeholder="e.g. friendly, professional, concise"
                  className={FIELD} />
              </div>

              <div>
                <label className={LABEL}>System Prompt (optional override)</label>
                <textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)}
                  rows={4} placeholder="Leave blank to auto-generate from persona + tone…"
                  className={`${FIELD} resize-none`} />
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border border-white/06 bg-card p-5">
              <h2 className="text-sm font-semibold text-foreground">Topic Controls</h2>
              <TagInput label="Permitted Topics (leave empty = all topics)" values={permitted} onChange={setPermitted} />
              <TagInput label="Prohibited Topics" values={prohibited} onChange={setProhibited} />
              <TagInput label="Escalation Triggers (hand off to human)" values={escalation} onChange={setEscalation} />
            </div>

            <div className="grid grid-cols-2 gap-4 rounded-2xl border border-white/06 bg-card p-5">
              <h2 className="text-sm font-semibold text-foreground col-span-2">Model Settings</h2>
              <div>
                <label className={LABEL}>Max Tokens</label>
                <input type="number" min={100} max={2000} value={maxTokens}
                  onChange={e => setMaxTokens(parseInt(e.target.value) || 500)}
                  className={FIELD} />
              </div>
              <div>
                <label className={LABEL}>Temperature (0 = precise, 1 = creative)</label>
                <input type="number" min={0} max={1} step={0.1} value={temperature}
                  onChange={e => setTemperature(parseFloat(e.target.value) || 0.7)}
                  className={FIELD} />
              </div>
            </div>

            <button
              onClick={() => void save()}
              disabled={saving}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: '#C4286F' }}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Profile
            </button>
          </div>
        )
      )}
    </div>
  )
}

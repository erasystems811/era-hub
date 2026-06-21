import { useState, useEffect } from 'react'
import { Mic, FileText, ArrowRight, CheckCircle2, Save, X } from 'lucide-react'
import { bizApi, type VoiceConfig } from './business-api'

const INPUT = 'w-full px-3.5 py-2.5 rounded-xl bg-[hsl(262_20%_11%)] border border-white/[0.10] text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all'
const LABEL = 'text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-1.5 block'

const DEFAULT_CFG: VoiceConfig = {
  responseMode:      'text',
  responseVoice:     'natural',
  showTranscription: true,
  languageHint:      'English',
}

const HOW_IT_WORKS = [
  { icon: Mic,          label: 'Customer sends voice note' },
  { icon: FileText,     label: 'ERA Comms transcribes it' },
  { icon: CheckCircle2, label: 'AI reads the text' },
  { icon: ArrowRight,   label: 'AI responds' },
]

function Toggle({ checked, onChange, label, sub }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; sub?: string
}) {
  return (
    <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        style={{ minWidth: 40, height: 22 }}
        className={`relative rounded-full shrink-0 transition-colors mt-0.5 ${checked ? 'bg-primary' : 'bg-white/10'}`}
      >
        <span className={`absolute top-[3px] w-4 h-4 rounded-full bg-white transition-all ${checked ? 'left-[20px]' : 'left-[3px]'}`} />
      </button>
    </div>
  )
}

export function VoiceNotesModule() {
  const [cfg, setCfg]         = useState<VoiceConfig>(DEFAULT_CFG)
  const [status, setStatus]   = useState<{ available: boolean; transcriptionsToday: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [error, setError]     = useState('')

  useEffect(() => {
    Promise.all([
      bizApi.getVoiceConfig().catch(() => null),
      bizApi.getVoiceStatus().catch(() => null),
    ]).then(([c, s]) => {
      if (c) setCfg({ ...DEFAULT_CFG, ...c })
      if (s) setStatus(s)
    }).finally(() => setLoading(false))
  }, [])

  const set = <K extends keyof VoiceConfig>(k: K, v: VoiceConfig[K]) =>
    setCfg(c => ({ ...c, [k]: v }))

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      await bizApi.updateVoiceConfig(cfg)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-center py-16 text-muted-foreground text-sm">Loading...</div>

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-foreground">Voice Notes</h2>
        <p className="text-sm text-muted-foreground mt-1">Handle voice messages your customers send on WhatsApp</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between">
          {error} <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* How it works */}
      <div className="p-5 rounded-xl border border-white/[0.07] bg-card">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground mb-4">How it works</p>
        <div className="flex items-center gap-2 flex-wrap">
          {HOW_IT_WORKS.map(({ icon: Icon, label }, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                <Icon className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs text-foreground">{label}</span>
              </div>
              {i < HOW_IT_WORKS.length - 1 && (
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Status card */}
      <div className="p-4 rounded-xl border border-white/[0.07] bg-card flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground mb-1">Transcription service</p>
          {status ? (
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${status.available ? 'bg-green-400' : 'bg-red-400'}`} />
              <span className="text-sm text-foreground">{status.available ? 'Online' : 'Unavailable'}</span>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">Status unknown</span>
          )}
        </div>
        {status && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Today</p>
            <p className="text-lg font-bold text-foreground">{status.transcriptionsToday.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">transcriptions</p>
          </div>
        )}
      </div>

      {/* Settings */}
      <div className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">Response settings</p>

        <div>
          <label className={LABEL}>When a customer sends a voice note, respond with</label>
          <div className="grid grid-cols-2 gap-2">
            {(['text', 'voice'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => set('responseMode', mode)}
                className={`flex items-center gap-2 p-3.5 rounded-xl border text-sm font-medium transition-all ${
                  cfg.responseMode === mode
                    ? 'border-primary/50 bg-primary/10 text-primary'
                    : 'border-white/[0.08] bg-white/[0.02] text-muted-foreground hover:border-white/[0.15]'
                }`}
              >
                {mode === 'text' ? <FileText className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                {mode === 'text' ? 'Text message' : 'Voice note'}
              </button>
            ))}
          </div>
        </div>

        {cfg.responseMode === 'voice' && (
          <div>
            <label className={LABEL}>Response voice style</label>
            <select className={INPUT} value={cfg.responseVoice} onChange={e => set('responseVoice', e.target.value as VoiceConfig['responseVoice'])}>
              <option value="natural">Natural</option>
              <option value="formal">Formal</option>
              <option value="friendly">Friendly</option>
            </select>
          </div>
        )}

        <Toggle
          checked={cfg.showTranscription}
          onChange={v => set('showTranscription', v)}
          label="Show transcription in inbox"
          sub="Displays what the customer said (text) alongside the voice note in your inbox"
        />

        <div>
          <label className={LABEL}>Language hint</label>
          <select className={INPUT} value={cfg.languageHint} onChange={e => set('languageHint', e.target.value)}>
            <option>English</option>
            <option>Yoruba</option>
            <option>Igbo</option>
            <option>Hausa</option>
            <option>Pidgin</option>
          </select>
          <p className="text-xs text-muted-foreground/50 mt-1">Helps the transcription service understand your customers better</p>
        </div>
      </div>

      <button onClick={save} disabled={saving}
        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors">
        <Save className="w-4 h-4" />
        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save settings'}
      </button>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { Loader2, MessageSquare } from 'lucide-react'
import { bizApi } from './business-api'

const TAGS = ['{customer_name}', '{business_name}', '{time_of_day}']
const INPUT = 'w-full px-3.5 py-2.5 rounded-xl bg-[hsl(262_20%_11%)] border border-white/[0.10] text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-[#BF7C93]/50 focus:ring-2 focus:ring-[#BF7C93]/15 transition-all'
const RECOMMENDED_LIMIT = 500
const MAX_LIMIT = 4096

export function AutoGreetModule() {
  const [message,  setMessage]  = useState('')
  const [saved,    setSaved]    = useState('')
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [toast,    setToast]    = useState<{ text: string; ok: boolean } | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function showToast(text: string, ok = true) {
    setToast({ text, ok })
    setTimeout(() => setToast(null), 2600)
  }

  useEffect(() => {
    bizApi.getAutoGreet()
      .then(r => { setMessage(r.message ?? ''); setSaved(r.message ?? '') })
      .catch(() => showToast('Could not load current greeting', false))
      .finally(() => setLoading(false))
  }, [])

  function insertTag(tag: string) {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end   = el.selectionEnd
    const next  = message.slice(0, start) + tag + message.slice(end)
    setMessage(next)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start + tag.length, start + tag.length)
    })
  }

  async function save() {
    setSaving(true)
    try {
      await bizApi.updateAutoGreet(message)
      setSaved(message)
      showToast('Auto greet saved')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to save', false)
    } finally {
      setSaving(false)
    }
  }

  const charCount = message.length
  const overLimit = charCount > MAX_LIMIT

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 rounded-full border-2 border-[#BF7C93]/30 border-t-[#BF7C93] animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-xl">
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-5 right-5 z-50 px-4 py-2.5 rounded-xl border text-sm shadow-xl"
          style={{
            background: 'hsl(262 20% 14%)',
            borderColor: toast.ok ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)',
            color: toast.ok ? '#86efac' : '#fca5a5',
          }}
        >
          {toast.text}
        </div>
      )}

      {/* Header */}
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-foreground">Auto Greet</h1>
        <p className="text-sm text-muted-foreground mt-0.5">The first message sent when a customer starts a conversation</p>
      </div>

      {/* WhatsApp preview */}
      <div
        className="mb-6 p-4 rounded-xl border"
        style={{ background: 'hsl(262 20% 10%)', borderColor: 'rgba(255,255,255,0.07)' }}
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3">Preview</p>
        <div className="flex justify-end">
          <div
            className="relative max-w-[80%] px-3.5 py-2.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed"
            style={{ background: '#005C4B', color: '#e9edef' }}
          >
            {saved || (
              <span style={{ color: 'rgba(233,237,239,0.35)' }}>
                <MessageSquare className="inline w-3.5 h-3.5 mr-1.5 opacity-50" />
                Not configured yet
              </span>
            )}
            {saved && (
              <span className="block text-right text-[10px] mt-1.5" style={{ color: 'rgba(233,237,239,0.5)' }}>
                Now · Delivered
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Form */}
      <div
        className="p-5 rounded-xl border"
        style={{ background: 'hsl(262 20% 10%)', borderColor: 'rgba(255,255,255,0.07)' }}
      >
        {/* Personalization tags */}
        <div className="mb-3 flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Insert:</span>
          {TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => insertTag(tag)}
              className="px-2.5 py-1 rounded-lg text-xs font-mono transition-all hover:bg-[#BF7C93]/15"
              style={{
                background: 'rgba(191,124,147,0.08)',
                color: '#BF7C93',
                border: '1px solid rgba(191,124,147,0.18)',
              }}
            >
              {tag}
            </button>
          ))}
        </div>

        <textarea
          ref={textareaRef}
          className={`${INPUT} resize-none`}
          rows={6}
          value={message}
          onChange={e => setMessage(e.target.value.slice(0, MAX_LIMIT))}
          placeholder="Hi! Welcome to {business_name}. How can we help you today?"
        />

        {/* Character count */}
        <div className="flex items-center justify-between mt-1.5 mb-4">
          <span
            className="text-xs"
            style={{ color: charCount > RECOMMENDED_LIMIT ? '#f59e0b' : 'rgba(255,255,255,0.3)' }}
          >
            {charCount} / {MAX_LIMIT}
            {charCount > RECOMMENDED_LIMIT && charCount <= MAX_LIMIT && (
              <span className="ml-1 text-[10px]">(keep under {RECOMMENDED_LIMIT} for best results)</span>
            )}
          </span>
          {overLimit && <span className="text-xs text-red-400">Limit reached</span>}
        </div>

        <button
          onClick={save}
          disabled={saving || overLimit || message === saved}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#BF7C93] text-white text-sm font-bold hover:bg-[#BF7C93]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? 'Saving…' : 'Save greeting'}
        </button>
      </div>

      {/* Tips */}
      <div
        className="mt-5 p-4 rounded-xl border"
        style={{ background: 'hsl(262 20% 9%)', borderColor: 'rgba(255,255,255,0.05)' }}
      >
        <p className="text-xs font-semibold text-muted-foreground mb-2">Tips</p>
        <ul className="text-xs text-muted-foreground/70 space-y-1.5 list-disc list-inside">
          <li>Keep it short and friendly — under {RECOMMENDED_LIMIT} characters</li>
          <li>Tell customers what you can help with</li>
          <li>Use <code className="text-[#BF7C93]/80 text-[11px]">{'{business_name}'}</code> to personalise automatically</li>
          <li>Example: "Hi! Welcome to {'{business_name}'}. How can I help you today? 😊"</li>
        </ul>
      </div>
    </div>
  )
}

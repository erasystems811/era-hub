import { useEffect, useState } from 'react'
import { Headphones, Send, Loader2 } from 'lucide-react'
import { patientApi, SupportTicket } from '../../lib/patient-api'
import { fmtDateTime, timeAgo } from '../../lib/utils'
import { pageCache } from '../../lib/cache'

type Thread = {
  ticket: object
  messages: { id: number; sender: string; message: string; created_at: string }[]
}

function statusBadge(s: string) {
  if (s === 'open')    return 'bg-red-500/10 text-red-400 border-red-500/20'
  if (s === 'pending') return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
  return 'bg-teal/10 text-teal border-teal/20'
}

export function Support() {
  const [tickets, setTickets] = useState<SupportTicket[]>(() => pageCache.get<SupportTicket[]>('support:tickets') ?? [])
  const [selected, setSelected] = useState<number | null>(null)
  const [thread, setThread] = useState<Thread | null>(null)
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(() => !pageCache.get('support:tickets'))
  const [sending, setSending] = useState(false)

  const loadTickets = async () => {
    setLoading(true)
    try {
      const data = await patientApi.listSupportTickets()
      pageCache.set('support:tickets', data)
      setTickets(data)
    } finally { setLoading(false) }
  }

  const openThread = async (id: number) => {
    setSelected(id)
    setThread(null)
    try { setThread(await patientApi.getSupportThread(id)) } catch { /* ignore */ }
  }

  const sendReply = async () => {
    if (!selected || !reply.trim()) return
    setSending(true)
    try {
      await patientApi.replyToTicket(selected, reply)
      setReply('')
      setThread(await patientApi.getSupportThread(selected))
      void loadTickets()
    } finally { setSending(false) }
  }

  useEffect(() => { void loadTickets() }, [])

  const openCount = tickets.filter(t => t.status === 'open').length

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] min-h-[500px]">
      {/* Header */}
      <div className="mb-5 shrink-0">
        <h1 className="page-title">Support inbox</h1>
        <p className="caption mt-0.5">{openCount} open conversation{openCount !== 1 ? 's' : ''}</p>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Ticket list — hidden on mobile when a thread is open */}
        <div className={`${selected ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-72 shrink-0 rounded-2xl border border-white/07 bg-card overflow-y-auto`}>
          {loading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading…
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 px-4 text-center">
              <Headphones className="w-8 h-8 text-muted-foreground/20" />
              <p className="text-sm text-muted-foreground">No support tickets yet</p>
            </div>
          ) : (
            <div className="divide-y divide-white/06">
              {tickets.map(t => (
                <button key={t.id} className={`w-full text-left px-4 py-3.5 transition-colors ${
                  selected === t.id ? 'bg-teal/10' : 'hover:bg-white/[0.03]'
                }`} onClick={() => void openThread(t.id)}>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p className="text-sm font-semibold text-foreground truncate">{t.hospital_name}</p>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 capitalize ${statusBadge(t.status)}`}>
                      {t.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mb-1">{t.subject}</p>
                  {t.last_message && (
                    <p className="text-xs text-muted-foreground/60 truncate">{t.last_message.preview}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground/40 mt-1">{timeAgo(t.created_at)}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Thread panel — hidden on mobile when no ticket selected */}
        <div className={`${!selected ? 'hidden md:flex' : 'flex'} flex-1 rounded-2xl border border-white/07 bg-card flex-col min-w-0`}>
          {/* Mobile back button */}
          {selected && (
            <button
              className="md:hidden flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground border-b border-white/07 hover:text-foreground transition shrink-0"
              onClick={() => { setSelected(null); setThread(null) }}
            >
              ← Back to tickets
            </button>
          )}
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
              <div className="w-12 h-12 rounded-2xl bg-white/05 flex items-center justify-center">
                <Headphones className="w-6 h-6 text-muted-foreground/30" />
              </div>
              <p className="text-sm text-muted-foreground">Select a conversation to open it</p>
            </div>
          ) : !thread ? (
            <div className="flex-1 flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading thread…
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {thread.messages.map(m => {
                  const isOp = m.sender === 'operator' || m.sender === 'super_admin'
                  return (
                    <div key={m.id} className={`flex ${isOp ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[72%] px-4 py-3 rounded-2xl text-sm ${
                        isOp
                          ? 'bg-teal text-white rounded-br-md'
                          : 'bg-white/06 border border-white/08 text-foreground rounded-bl-md'
                      }`}>
                        <p className="leading-relaxed">{m.message}</p>
                        <p className={`text-[10px] mt-1.5 ${isOp ? 'text-white/50' : 'text-muted-foreground'}`}>
                          {m.sender === 'hospital' ? 'Hospital' : 'You'} · {fmtDateTime(m.created_at)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="p-4 border-t border-white/07 flex gap-2 shrink-0">
                <input
                  className="input flex-1"
                  placeholder="Type a reply…"
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void sendReply() } }}
                />
                <button className="btn-primary px-4" disabled={!reply.trim() || sending} onClick={() => void sendReply()}>
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Headphones, Send, ChevronRight } from 'lucide-react'
import { Glass } from '../../components/Glass'
import { patientApi, SupportTicket } from '../../lib/patient-api'
import { fmtDateTime, timeAgo } from '../../lib/utils'

type Thread = {
  ticket: object
  messages: { id: number; sender: string; message: string; created_at: string }[]
}

function statusColor(s: string) {
  return s === 'open' ? 'text-rose bg-rose/10' : s === 'pending' ? 'text-amber-600 bg-amber-50' : 'text-teal bg-teal-light'
}

export function Support() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [thread, setThread] = useState<Thread | null>(null)
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  const loadTickets = async () => {
    setLoading(true)
    try { setTickets(await patientApi.listSupportTickets()) } finally { setLoading(false) }
  }

  const openThread = async (id: number) => {
    setSelected(id)
    try { setThread(await patientApi.getSupportThread(id)) } catch { /* ignore */ }
  }

  const sendReply = async () => {
    if (!selected || !reply.trim()) return
    setSending(true)
    try {
      await patientApi.replyToTicket(selected, reply)
      setReply('')
      const t = await patientApi.getSupportThread(selected)
      setThread(t)
      void loadTickets()
    } finally { setSending(false) }
  }

  useEffect(() => { void loadTickets() }, [])

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="page-title">Support inbox</h1>
        <p className="caption mt-0.5">{tickets.filter(t => t.status === 'open').length} open conversations</p>
      </div>

      <div className="flex gap-4 h-[calc(100vh-220px)] min-h-[400px]">
        {/* Ticket list */}
        <div className="w-72 shrink-0 glass overflow-y-auto" style={{ padding: 0 }}>
          {loading ? (
            <div className="text-center py-10 text-charcoal-soft text-sm">Loading…</div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-10">
              <Headphones className="w-8 h-8 text-pink mx-auto mb-2 opacity-40" />
              <p className="caption">No tickets yet</p>
            </div>
          ) : (
            tickets.map(t => (
              <button
                key={t.id}
                className={`w-full text-left px-4 py-3 border-b border-pink-border last:border-0 transition-colors ${
                  selected === t.id ? 'bg-teal-light' : 'hover:bg-pink-light'
                }`}
                onClick={() => void openThread(t.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-charcoal truncate">{t.hospital_name}</div>
                    <div className="text-xs text-charcoal-soft mt-0.5 truncate">{t.subject}</div>
                    {t.last_message && (
                      <div className="text-xs text-charcoal-soft mt-0.5 opacity-60 truncate">{t.last_message.preview}</div>
                    )}
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-charcoal-soft shrink-0 mt-1" />
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wide ${statusColor(t.status)}`}>
                    {t.status}
                  </span>
                  <span className="text-[10px] text-charcoal-soft">{timeAgo(t.created_at)}</span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Thread panel */}
        <div className="flex-1 glass flex flex-col" style={{ padding: 0 }}>
          {!selected ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Headphones className="w-10 h-10 text-pink mx-auto mb-3 opacity-40" />
                <p className="text-sm text-charcoal-soft">Select a conversation to open it</p>
              </div>
            </div>
          ) : !thread ? (
            <div className="flex-1 flex items-center justify-center text-charcoal-soft text-sm">Loading thread…</div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {thread.messages.map(m => {
                  const isOp = m.sender === 'operator' || m.sender === 'super_admin'
                  return (
                    <div key={m.id} className={`flex ${isOp ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[72%] px-4 py-2.5 rounded-2xl text-sm ${
                          isOp
                            ? 'bg-teal text-white rounded-br-sm'
                            : 'glass-sm text-charcoal rounded-bl-sm'
                        }`}
                        style={!isOp ? { padding: '10px 16px' } : {}}
                      >
                        <p>{m.message}</p>
                        <p className={`text-[10px] mt-1 ${isOp ? 'text-white/60' : 'text-charcoal-soft'}`}>
                          {m.sender === 'hospital' ? 'Hospital' : 'You'} · {fmtDateTime(m.created_at)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="p-4 border-t border-pink-border flex gap-2">
                <input
                  className="input flex-1"
                  placeholder="Type a reply…"
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void sendReply() } }}
                />
                <button className="btn-primary px-4" disabled={!reply.trim() || sending} onClick={() => void sendReply()}>
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, Headphones, Send, Loader2 } from 'lucide-react'
import { patientApi, SupportTicket } from '../../lib/patient-api'
import { fmtDateTime, timeAgo } from '../../lib/utils'
import { pageCache } from '../../lib/cache'

type Msg    = { id: number; sender: string; message: string; created_at: string }
type Thread = { ticket: object; messages: Msg[] }

function statusBadge(s: string) {
  if (s === 'open')    return 'bg-red-500/10 text-red-400 border-red-500/20'
  if (s === 'pending') return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
  return 'bg-teal/10 text-teal border-teal/20'
}

/* ── Proper chat bubbles ────────────────────────────────────────────────── */
function MessageList({ thread, endRef }: { thread: Thread | null; endRef: React.RefObject<HTMLDivElement> }) {
  if (!thread) return (
    <div className="flex-1 flex items-center justify-center gap-2 text-muted-foreground text-sm">
      <Loader2 className="w-4 h-4 animate-spin" /> Loading…
    </div>
  )
  if (thread.messages.length === 0) return (
    <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">No messages yet</div>
  )
  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2" style={{ WebkitOverflowScrolling: 'touch' }}>
      {thread.messages.map((m, i) => {
        const isMe   = m.sender !== 'hospital'
        const prev   = thread.messages[i - 1]
        const sameGroup = prev && (prev.sender !== 'hospital') === isMe
        return (
          <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${sameGroup ? 'mt-0.5' : 'mt-3'}`}>
            {!sameGroup && (
              <p className="text-[10px] text-muted-foreground/50 mb-1 px-1">
                {isMe ? 'You' : 'Hospital'}
              </p>
            )}
            <div
              className={`max-w-[78%] px-4 py-2.5 text-sm leading-relaxed ${
                isMe
                  ? 'rounded-2xl rounded-br-sm text-white'
                  : 'rounded-2xl rounded-bl-sm text-foreground border border-white/10'
              }`}
              style={{
                background: isMe
                  ? 'linear-gradient(135deg, #4DBFB3, #3AADA1)'
                  : 'rgba(255,255,255,0.06)',
              }}
            >
              {m.message}
            </div>
            <p className="text-[10px] text-muted-foreground/35 mt-0.5 px-1">
              {fmtDateTime(m.created_at)}
            </p>
          </div>
        )
      })}
      <div ref={endRef} />
    </div>
  )
}

/* ── Stable reply bar (solid bg — no blur, no layout thrash) ───────────── */
function ReplyBar({ reply, sending, onChange, onSend }: {
  reply: string
  sending: boolean
  onChange: (v: string) => void
  onSend: () => void
}) {
  return (
    <div
      className="shrink-0 flex gap-2 px-3 py-2 border-t border-white/10"
      style={{
        background: 'rgb(14, 11, 20)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)',
      }}
    >
      <input
        className="input flex-1 text-sm"
        placeholder="Type a reply…"
        value={reply}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend() } }}
      />
      <button
        className="btn-primary px-4 shrink-0"
        disabled={!reply.trim() || sending}
        onClick={onSend}
      >
        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
      </button>
    </div>
  )
}

/* ── Ticket list (shared mobile + desktop) ──────────────────────────────── */
function TicketList({ tickets, loading, selected, onOpen }: {
  tickets: SupportTicket[]
  loading: boolean
  selected: number | null
  onOpen: (id: number) => void
}) {
  if (loading) return (
    <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
      <Loader2 className="w-4 h-4 animate-spin" /> Loading…
    </div>
  )
  if (tickets.length === 0) return (
    <div className="flex flex-col items-center justify-center py-12 gap-3 px-4 text-center">
      <Headphones className="w-8 h-8 text-muted-foreground/20" />
      <p className="text-sm text-muted-foreground">No support tickets yet</p>
    </div>
  )
  return (
    <div className="divide-y divide-white/06">
      {tickets.map(t => (
        <button key={t.id} className={`w-full text-left px-4 py-4 transition-colors ${
          selected === t.id ? 'bg-teal/10' : 'hover:bg-white/[0.03] active:bg-white/[0.06]'
        }`} onClick={() => onOpen(t.id)}>
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
  )
}

/* ── Main Support component ─────────────────────────────────────────────── */
export function Support() {
  const [tickets, setTickets]   = useState<SupportTicket[]>(() => pageCache.get<SupportTicket[]>('support:tickets') ?? [])
  const [selected, setSelected] = useState<number | null>(null)
  const [thread, setThread]     = useState<Thread | null>(null)
  const [reply, setReply]       = useState('')
  const [loading, setLoading]   = useState(() => !pageCache.get('support:tickets'))
  const [sending, setSending]   = useState(false)
  const endRef                  = useRef<HTMLDivElement>(null)

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

  const closeThread = () => { setSelected(null); setThread(null) }

  useEffect(() => { void loadTickets() }, [])

  useEffect(() => {
    if (thread) endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [thread])

  const selectedTicket = tickets.find(t => t.id === selected)
  const openCount      = tickets.filter(t => t.status === 'open').length

  /* Mobile full-screen thread — rendered at document.body via portal.
     Uses height:100dvh so it correctly shrinks when the iOS keyboard opens.
     Solid colors only — no backdrop-filter so nothing recalculates on resize. */
  const mobileThread = selected ? createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        height: '100dvh',
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        background: 'hsl(262 22% 6%)',
        overflow: 'hidden',
      }}
    >
      {/* Header — solid bg, no blur */}
      <div
        className="shrink-0 flex items-center gap-3 px-4 border-b"
        style={{
          height: 56,
          background: 'rgb(14, 11, 20)',
          borderBottomColor: 'rgba(255,255,255,0.10)',
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >
        <button
          onClick={closeThread}
          className="p-2 -ml-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/06 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground truncate">
            {selectedTicket?.hospital_name ?? 'Conversation'}
          </p>
          {selectedTicket && (
            <p className="text-[10px] text-muted-foreground/60 truncate">{selectedTicket.subject}</p>
          )}
        </div>
        {selectedTicket && (
          <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full border capitalize ${statusBadge(selectedTicket.status)}`}>
            {selectedTicket.status}
          </span>
        )}
      </div>

      {/* Messages */}
      <MessageList thread={thread} endRef={endRef} />

      {/* Reply bar */}
      <ReplyBar
        reply={reply}
        sending={sending}
        onChange={setReply}
        onSend={() => void sendReply()}
      />
    </div>,
    document.body,
  ) : null

  return (
    <>
      {mobileThread}

      {/* ── Desktop two-pane layout ── */}
      <div className="hidden md:flex flex-col h-[calc(100vh-120px)] min-h-[500px]">
        <div className="mb-5 shrink-0">
          <h1 className="page-title">Support inbox</h1>
          <p className="caption mt-0.5">{openCount} open conversation{openCount !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-4 flex-1 min-h-0">
          <div className="w-72 shrink-0 rounded-2xl border border-white/07 bg-card overflow-y-auto flex flex-col">
            <TicketList tickets={tickets} loading={loading} selected={selected} onOpen={openThread} />
          </div>
          <div className="flex-1 rounded-2xl border border-white/07 bg-card flex flex-col min-w-0">
            {!selected ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
                <div className="w-12 h-12 rounded-2xl bg-white/05 flex items-center justify-center">
                  <Headphones className="w-6 h-6 text-muted-foreground/30" />
                </div>
                <p className="text-sm text-muted-foreground">Select a conversation to open it</p>
              </div>
            ) : (
              <>
                <MessageList thread={thread} endRef={endRef} />
                <ReplyBar
                  reply={reply}
                  sending={sending}
                  onChange={setReply}
                  onSend={() => void sendReply()}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile ticket list (only shown when no thread is open) ── */}
      <div className="md:hidden flex flex-col">
        <div className="mb-4">
          <h1 className="page-title">Support inbox</h1>
          <p className="caption mt-0.5">{openCount} open conversation{openCount !== 1 ? 's' : ''}</p>
        </div>
        <div className="rounded-2xl border border-white/07 bg-card overflow-hidden">
          <TicketList tickets={tickets} loading={loading} selected={selected} onOpen={openThread} />
        </div>
      </div>
    </>
  )
}

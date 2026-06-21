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

/* ─── Chat bubbles ──────────────────────────────────────────────── */
function MessageList({ thread, endRef }: {
  thread: Thread | null
  endRef: React.RefObject<HTMLDivElement>
}) {
  if (!thread) return (
    <div className="flex-1 flex items-center justify-center gap-2 text-muted-foreground text-sm">
      <Loader2 className="w-4 h-4 animate-spin" />Loading…
    </div>
  )
  if (thread.messages.length === 0) return (
    <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
      No messages yet
    </div>
  )
  return (
    <div
      className="flex-1 overflow-y-auto px-4 py-4"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {thread.messages.map((m, i) => {
        const isMe     = m.sender !== 'hospital'
        const prev     = thread.messages[i - 1]
        const newGroup = !prev || (prev.sender !== 'hospital') !== isMe

        return (
          <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${newGroup ? 'mt-4' : 'mt-1'}`}>
            {newGroup && (
              <p className="text-[10px] text-muted-foreground/45 mb-1 px-1">
                {isMe ? 'You' : 'Hospital'}
              </p>
            )}
            <div
              className="max-w-[78%] px-4 py-2.5 text-sm leading-relaxed"
              style={{
                borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background:   isMe
                  ? 'linear-gradient(135deg,#4DBFB3,#3AADA1)'
                  : 'rgba(255,255,255,0.08)',
                border: isMe ? 'none' : '1px solid rgba(255,255,255,0.10)',
                color:  isMe ? '#fff' : 'var(--foreground)',
                wordBreak: 'break-word',
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
      <div ref={endRef} style={{ height: 1 }} />
    </div>
  )
}

/* ─── Reply bar ─────────────────────────────────────────────────── */
function ReplyBar({ reply, sending, onChange, onSend }: {
  reply: string
  sending: boolean
  onChange: (v: string) => void
  onSend: () => void
}) {
  return (
    <div
      className="flex gap-2 px-3 pt-2 pb-2 border-t border-white/10"
      style={{ background: '#0e0b14', flexShrink: 0 }}
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

/* ─── Ticket list ───────────────────────────────────────────────── */
function TicketList({ tickets, loading, selected, onOpen }: {
  tickets: SupportTicket[]
  loading: boolean
  selected: number | null
  onOpen: (id: number) => void
}) {
  if (loading) return (
    <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
      <Loader2 className="w-4 h-4 animate-spin" />Loading…
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
        <button
          key={t.id}
          className={`w-full text-left px-4 py-4 transition-colors ${
            selected === t.id ? 'bg-teal/10' : 'hover:bg-white/[0.03] active:bg-white/[0.06]'
          }`}
          onClick={() => onOpen(t.id)}
        >
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

/* ─── Main ──────────────────────────────────────────────────────── */
export function Support() {
  const [tickets, setTickets]   = useState<SupportTicket[]>(() => pageCache.get<SupportTicket[]>('support:tickets') ?? [])
  const [selected, setSelected] = useState<number | null>(null)
  const [thread, setThread]     = useState<Thread | null>(null)
  const [reply, setReply]       = useState('')
  const [loading, setLoading]   = useState(() => !pageCache.get('support:tickets'))
  const [sending, setSending]   = useState(false)
  const endRef     = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

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
    try { setThread(await patientApi.getSupportThread(id)) } catch { /**/ }
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

  // Scroll to bottom whenever messages change or are first loaded
  useEffect(() => {
    if (thread?.messages.length) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [thread])

  /* ── iOS-stable body lock + keyboard handling ──────────────────
     When the thread is open:
     1. Lock body with position:fixed (the ONLY reliable iOS scroll-lock;
        overflow:hidden alone does not stop iOS from repainting gradients).
     2. Listen to visualViewport to sync the overlay height to the real
        visible area (shrinks when keyboard opens).
     3. Debounce the scroll-to-bottom so it fires once after the keyboard
        finishes animating, not 60 times during the slide. */
  useEffect(() => {
    if (!selected) return

    // Save scroll, freeze body
    const savedScroll = window.scrollY
    Object.assign(document.body.style, {
      position: 'fixed',
      top:      `-${savedScroll}px`,
      left:     '0',
      right:    '0',
      overflow: 'hidden',
    })

    let debounceId = 0

    const syncViewport = () => {
      const vv = window.visualViewport
      if (!vv || !overlayRef.current) return

      // Snap overlay to exact visible area — no animation, just sync
      overlayRef.current.style.height = `${vv.height}px`

      // Scroll to last message once keyboard finishes (debounced 120ms)
      clearTimeout(debounceId)
      debounceId = window.setTimeout(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 120)
    }

    window.visualViewport?.addEventListener('resize', syncViewport)
    syncViewport() // initial sync

    return () => {
      window.visualViewport?.removeEventListener('resize', syncViewport)
      clearTimeout(debounceId)

      // Restore body and scroll position
      Object.assign(document.body.style, {
        position: '',
        top:      '',
        left:     '',
        right:    '',
        overflow: '',
      })
      window.scrollTo(0, savedScroll)
    }
  }, [selected])

  const selectedTicket = tickets.find(t => t.id === selected)
  const openCount      = tickets.filter(t => t.status === 'open').length

  /* ── Mobile full-screen thread overlay ─────────────────────────
     Rendered at document.body via portal so no parent overflow/z-index
     can interfere. 100% opaque backgrounds throughout — nothing to
     composite or repaint when keyboard moves. */
  const mobileThread = selected ? createPortal(
    <div
      ref={overlayRef}
      style={{
        position:        'fixed',
        top:             0,
        left:            0,
        right:           0,
        height:          '100dvh', // JS overrides immediately via syncViewport
        zIndex:          300,
        display:         'flex',
        flexDirection:   'column',
        background:      '#0e0b14',
        overflow:        'hidden',
        WebkitTransform: 'translateZ(0)', // own GPU layer — no bleed from page
      }}
    >
      {/* Header */}
      <div
        style={{
          flexShrink:      0,
          height:          56,
          display:         'flex',
          alignItems:      'center',
          gap:             12,
          padding:         '0 16px',
          background:      '#0e0b14',
          borderBottom:    '1px solid rgba(255,255,255,0.10)',
        }}
      >
        <button
          onClick={closeThread}
          style={{ padding: 8, margin: '-4px 0 -4px -4px', borderRadius: 12, color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}
        >
          <ArrowLeft size={20} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {selectedTicket?.hospital_name ?? 'Conversation'}
          </p>
          {selectedTicket && (
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {selectedTicket.subject}
            </p>
          )}
        </div>
        {selectedTicket && (
          <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full border capitalize ${statusBadge(selectedTicket.status)}`}>
            {selectedTicket.status}
          </span>
        )}
      </div>

      {/* Messages — flex-1 so reply bar is always at bottom */}
      <MessageList thread={thread} endRef={endRef} />

      {/* Reply bar — solid background, never moves */}
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

      {/* Desktop two-pane */}
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
                <ReplyBar reply={reply} sending={sending} onChange={setReply} onSend={() => void sendReply()} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile ticket list */}
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

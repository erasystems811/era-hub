import { useState, useEffect, useRef } from 'react'
import { Search, ArrowLeft, Send, Mic } from 'lucide-react'
import { bizApi, type Conversation, type ConversationMessage } from './business-api'

const INPUT = 'w-full px-3.5 py-2.5 rounded-xl bg-[hsl(262_20%_11%)] border border-white/[0.10] text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all'

const STATUS_FILTERS = ['All', 'AI Active', 'Awaiting Human', 'Resolved'] as const
type FilterTab = typeof STATUS_FILTERS[number]

function maskPhone(phone: string) {
  if (phone.length < 7) return phone
  return phone.slice(0, phone.length - 7) + ' ***' + phone.slice(-4)
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return `${Math.floor(diff / 86400000)}d ago`
}

function StatusDot({ status }: { status: Conversation['status'] }) {
  if (status === 'ai_active') return <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
  if (status === 'human')     return <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
  return <span className="w-2 h-2 rounded-full bg-white/20 shrink-0" />
}

function ConvListItem({ conv, selected, onClick }: { conv: Conversation; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-start gap-3 px-4 py-3.5 text-left border-b border-white/[0.05] transition-colors hover:bg-white/[0.03] ${selected ? 'bg-white/[0.05]' : ''}`}
    >
      <div className="mt-1.5"><StatusDot status={conv.status} /></div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <p className="text-sm font-semibold text-foreground truncate">{maskPhone(conv.customerPhone)}</p>
          <p className="text-[10px] text-muted-foreground/50 shrink-0 ml-2">{timeAgo(conv.lastMessageAt)}</p>
        </div>
        <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
      </div>
      {conv.unreadCount > 0 && (
        <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-[10px] font-bold text-white flex items-center justify-center">
          {conv.unreadCount}
        </span>
      )}
    </button>
  )
}

function MessageBubble({ msg }: { msg: ConversationMessage }) {
  const isCustomer = msg.role === 'customer'
  const isAI       = msg.role === 'ai'

  return (
    <div className={`flex ${isCustomer ? 'justify-start' : 'justify-end'} mb-3`}>
      <div
        className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isCustomer
            ? 'bg-white/[0.07] text-foreground rounded-tl-sm'
            : isAI
            ? 'rounded-tr-sm text-white'
            : 'rounded-tr-sm text-white'
        }`}
        style={isAI ? { background: 'rgba(191,124,147,0.25)', border: '1px solid rgba(191,124,147,0.3)' }
          : !isCustomer ? { background: 'rgba(74,168,157,0.25)', border: '1px solid rgba(74,168,157,0.3)' } : {}}
      >
        {msg.voiceNote && (
          <div className="flex items-center gap-1.5 mb-1 opacity-60">
            <Mic className="w-3 h-3" /><span className="text-[10px]">Voice note</span>
          </div>
        )}
        {msg.content}
        <div className="mt-1 text-[10px] opacity-40">{timeAgo(msg.createdAt)}</div>
      </div>
    </div>
  )
}

export function InboxModule() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages]           = useState<ConversationMessage[]>([])
  const [selected, setSelected]           = useState<Conversation | null>(null)
  const [filter, setFilter]               = useState<FilterTab>('All')
  const [search, setSearch]               = useState('')
  const [loadingList, setLoadingList]     = useState(true)
  const [loadingThread, setLoadingThread] = useState(false)
  const [sending, setSending]             = useState(false)
  const [draft, setDraft]                 = useState('')
  const [showThread, setShowThread]       = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bizApi.listConversations()
      .then(setConversations)
      .catch(() => {})
      .finally(() => setLoadingList(false))
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const openConv = async (conv: Conversation) => {
    setSelected(conv)
    setShowThread(true)
    setLoadingThread(true)
    try {
      const msgs = await bizApi.listMessages(conv.id)
      setMessages(msgs)
    } catch {
      setMessages([])
    } finally {
      setLoadingThread(false)
    }
  }

  const handleTakeOver = async () => {
    if (!selected) return
    await bizApi.takeOver(selected.id).catch(() => {})
    setSelected(s => s ? { ...s, status: 'human' } : s)
    setConversations(c => c.map(x => x.id === selected.id ? { ...x, status: 'human' } : x))
  }

  const handleHandBack = async () => {
    if (!selected) return
    await bizApi.handBack(selected.id).catch(() => {})
    setSelected(s => s ? { ...s, status: 'ai_active' } : s)
    setConversations(c => c.map(x => x.id === selected.id ? { ...x, status: 'ai_active' } : x))
  }

  const sendMsg = async () => {
    if (!selected || !draft.trim() || sending) return
    setSending(true)
    try {
      const msg = await bizApi.sendMessage(selected.id, draft.trim())
      setMessages(m => [...m, msg])
      setDraft('')
    } catch {} finally {
      setSending(false)
    }
  }

  const filterStatus = (conv: Conversation): boolean => {
    if (filter === 'All') return true
    if (filter === 'AI Active') return conv.status === 'ai_active'
    if (filter === 'Awaiting Human') return conv.status === 'human'
    if (filter === 'Resolved') return conv.status === 'resolved'
    return true
  }

  const filtered = conversations.filter(c =>
    filterStatus(c) &&
    (search === '' || c.customerPhone.includes(search) || c.lastMessage.toLowerCase().includes(search.toLowerCase()))
  )

  const canSend = selected?.status === 'human'

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
      <div className="mb-4 shrink-0">
        <h2 className="text-xl font-bold text-foreground">Inbox</h2>
        <p className="text-sm text-muted-foreground mt-1">Monitor and join conversations your AI is handling</p>
      </div>

      <div className="flex-1 flex rounded-xl border border-white/[0.07] bg-card overflow-hidden min-h-0">

        {/* Left pane */}
        <div className={`flex flex-col border-r border-white/[0.07] shrink-0 ${showThread ? 'hidden md:flex' : 'flex'}`}
          style={{ width: 320 }}>
          {/* Search */}
          <div className="p-3 border-b border-white/[0.07]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
              <input className={INPUT + ' pl-9'} placeholder="Search conversations"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          {/* Filter tabs */}
          <div className="flex border-b border-white/[0.07] overflow-x-auto">
            {STATUS_FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-2.5 text-[11px] font-semibold whitespace-nowrap transition-colors ${
                  filter === f ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'
                }`}>
                {f}
              </button>
            ))}
          </div>
          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {loadingList ? (
              <div className="text-center py-10 text-muted-foreground text-sm">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">No conversations</div>
            ) : filtered.map(conv => (
              <ConvListItem key={conv.id} conv={conv} selected={selected?.id === conv.id} onClick={() => openConv(conv)} />
            ))}
          </div>
        </div>

        {/* Right pane */}
        <div className={`flex-1 flex flex-col min-w-0 ${showThread ? 'flex' : 'hidden md:flex'}`}>
          {!selected ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">Select a conversation</p>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.07]">
                <button className="md:hidden p-1.5 rounded-lg hover:bg-white/[0.05]" onClick={() => setShowThread(false)}>
                  <ArrowLeft className="w-4 h-4 text-muted-foreground" />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{maskPhone(selected.customerPhone)}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <StatusDot status={selected.status} />
                    <p className="text-xs text-muted-foreground capitalize">
                      {selected.status === 'ai_active' ? 'AI handling' : selected.status === 'human' ? 'Human handling' : 'Resolved'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selected.status === 'ai_active' && (
                    <button onClick={handleTakeOver}
                      className="px-3 py-1.5 rounded-xl bg-amber-400/10 text-amber-400 text-xs font-semibold hover:bg-amber-400/20 transition-colors border border-amber-400/20">
                      Take over
                    </button>
                  )}
                  {selected.status === 'human' && (
                    <button onClick={handleHandBack}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors border"
                      style={{ background: 'rgba(74,168,157,0.1)', color: '#4AA89D', borderColor: 'rgba(74,168,157,0.2)' }}>
                      Hand back to AI
                    </button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4">
                {loadingThread ? (
                  <div className="text-center py-10 text-muted-foreground text-sm">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground text-sm">No messages</div>
                ) : (
                  messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="px-4 py-3 border-t border-white/[0.07]">
                {!canSend && (
                  <p className="text-xs text-center text-muted-foreground/50 mb-2">
                    {selected.status === 'resolved' ? 'Conversation resolved' : 'Click "Take over" to send messages'}
                  </p>
                )}
                <div className="flex gap-2">
                  <input
                    className={INPUT}
                    placeholder={canSend ? 'Type a message...' : 'AI is handling this conversation'}
                    disabled={!canSend}
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg() } }}
                  />
                  <button
                    onClick={sendMsg}
                    disabled={!canSend || !draft.trim() || sending}
                    className="p-2.5 rounded-xl bg-primary text-white disabled:opacity-30 hover:bg-primary/90 transition-colors shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect, useRef } from 'react'
import { Send, Plus, Brain, Trash2 } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'core'
  content: string
  createdAt: string
}

interface Session {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

const SESSIONS_KEY = 'era_core_sessions'
const msgKey = (id: string) => `era_core_msg_${id}`

function loadSessions(): Session[] {
  try { return JSON.parse(localStorage.getItem(SESSIONS_KEY) ?? '[]') } catch { return [] }
}
function saveSessions(s: Session[]) { localStorage.setItem(SESSIONS_KEY, JSON.stringify(s)) }
function loadMessages(id: string): Message[] {
  try { return JSON.parse(localStorage.getItem(msgKey(id)) ?? '[]') } catch { return [] }
}
function saveMessages(id: string, msgs: Message[]) { localStorage.setItem(msgKey(id), JSON.stringify(msgs)) }
function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36) }

// Replace with ERA Core backend call when ready
async function getCoreResponse(_msgs: Message[]): Promise<string> {
  await new Promise(r => setTimeout(r, 900))
  return 'ERA Core backend not connected yet — the memory layer and response engine are being built. Your message has been stored in this session.'
}

const PURPLE = '#9B7FD4'

export function CoreChat() {
  const [sessions, setSessions] = useState<Session[]>(loadSessions)
  const [activeId, setActiveId] = useState<string | null>(() => loadSessions()[0]?.id ?? null)
  const [messages, setMessages] = useState<Message[]>(() => {
    const first = loadSessions()[0]
    return first ? loadMessages(first.id) : []
  })
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setMessages(activeId ? loadMessages(activeId) : [])
  }, [activeId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }, [input])

  function newChat() {
    const id = uid()
    const session: Session = { id, title: 'New conversation', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    const updated = [session, ...sessions]
    setSessions(updated)
    saveSessions(updated)
    setActiveId(id)
    setMessages([])
    textareaRef.current?.focus()
  }

  function deleteSession(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    const updated = sessions.filter(s => s.id !== id)
    setSessions(updated)
    saveSessions(updated)
    localStorage.removeItem(msgKey(id))
    if (activeId === id) setActiveId(updated[0]?.id ?? null)
  }

  async function send() {
    if (!input.trim() || loading) return
    const text = input.trim()

    let sid = activeId
    let currentSessions = sessions

    if (!sid) {
      sid = uid()
      const session: Session = { id: sid, title: text.slice(0, 45), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      currentSessions = [session, ...sessions]
      setSessions(currentSessions)
      saveSessions(currentSessions)
      setActiveId(sid)
    }

    const userMsg: Message = { id: uid(), role: 'user', content: text, createdAt: new Date().toISOString() }
    const withUser = [...messages, userMsg]
    setMessages(withUser)
    saveMessages(sid, withUser)
    setInput('')

    if (messages.length === 0) {
      const updated = currentSessions.map(s => s.id === sid ? { ...s, title: text.slice(0, 45), updatedAt: new Date().toISOString() } : s)
      setSessions(updated)
      saveSessions(updated)
    }

    setLoading(true)
    try {
      const reply = await getCoreResponse(withUser)
      const coreMsg: Message = { id: uid(), role: 'core', content: reply, createdAt: new Date().toISOString() }
      const final = [...withUser, coreMsg]
      setMessages(final)
      saveMessages(sid, final)
      const updated = currentSessions.map(s => s.id === sid ? { ...s, updatedAt: new Date().toISOString() } : s)
      setSessions(updated)
      saveSessions(updated)
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send() }
  }

  function formatTime(iso: string) {
    const d = new Date(iso)
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  }

  return (
    <div className="flex h-full">

      {/* Sessions panel */}
      <div
        className="w-64 shrink-0 flex flex-col border-r"
        style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.015)' }}
      >
        <div className="px-4 pt-5 pb-3 border-b shrink-0" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2.5 mb-4">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: `${PURPLE}22`, border: `1px solid ${PURPLE}44` }}
            >
              <Brain className="w-3.5 h-3.5" style={{ color: PURPLE }} />
            </div>
            <div>
              <p className="text-xs font-bold tracking-wider uppercase" style={{ color: PURPLE }}>ERA Core</p>
              <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.28)' }}>Your digital mind</p>
            </div>
          </div>

          <button
            onClick={newChat}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ background: `${PURPLE}15`, border: `1px solid ${PURPLE}30`, color: PURPLE }}
          >
            <Plus className="w-3.5 h-3.5" />
            New chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
          {sessions.length === 0 && (
            <p className="text-[11px] px-3 py-6 text-center" style={{ color: 'rgba(255,255,255,0.22)' }}>
              No conversations yet
            </p>
          )}
          {sessions.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveId(s.id)}
              className="w-full text-left px-3 py-2.5 rounded-lg transition-all group flex items-start gap-2"
              style={activeId === s.id
                ? { background: `${PURPLE}18`, borderLeft: `2px solid ${PURPLE}`, paddingLeft: 10 }
                : { color: 'rgba(255,255,255,0.40)' }
              }
            >
              <div className="flex-1 min-w-0">
                <p
                  className="text-xs font-medium truncate leading-snug"
                  style={activeId === s.id ? { color: PURPLE } : {}}
                >
                  {s.title}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.22)' }}>
                  {formatTime(s.updatedAt)}
                </p>
              </div>
              <button
                onClick={(e) => deleteSession(s.id, e)}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded transition-all shrink-0 mt-0.5"
                style={{ color: 'rgba(255,255,255,0.25)' }}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center select-none">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: `${PURPLE}18`, border: `1px solid ${PURPLE}30` }}
              >
                <Brain className="w-7 h-7" style={{ color: PURPLE }} />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-2">ERA Core</h3>
              <p className="text-sm max-w-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.38)' }}>
                Your mind in a system. Ask anything, think through decisions, or deploy Core to your ERA tools.
              </p>
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2.5`}>
              {msg.role === 'core' && (
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mb-0.5"
                  style={{ background: `${PURPLE}22`, border: `1px solid ${PURPLE}44` }}
                >
                  <Brain className="w-3 h-3" style={{ color: PURPLE }} />
                </div>
              )}
              <div
                className="max-w-[68%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap"
                style={msg.role === 'user'
                  ? {
                      background: 'rgba(196,40,111,0.13)',
                      border: '1px solid rgba(196,40,111,0.22)',
                      color: 'rgba(255,255,255,0.88)',
                      borderRadius: '18px 18px 4px 18px',
                    }
                  : {
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.09)',
                      color: 'rgba(255,255,255,0.82)',
                      borderRadius: '18px 18px 18px 4px',
                    }
                }
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-end gap-2.5">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mb-0.5"
                style={{ background: `${PURPLE}22`, border: `1px solid ${PURPLE}44` }}
              >
                <Brain className="w-3 h-3" style={{ color: PURPLE }} />
              </div>
              <div
                className="px-4 py-3.5"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '18px 18px 18px 4px' }}
              >
                <div className="flex gap-1 items-center">
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full animate-bounce"
                      style={{ background: PURPLE, animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-8 py-4 shrink-0 border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <div
            className="flex items-end gap-3 rounded-2xl px-4 py-3 transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Talk to ERA Core…"
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm text-foreground outline-none leading-relaxed"
              style={{ maxHeight: 160, overflowY: 'auto', color: 'rgba(255,255,255,0.88)', caretColor: PURPLE }}
            />
            <button
              onClick={() => void send()}
              disabled={!input.trim() || loading}
              className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all"
              style={input.trim() && !loading
                ? { background: PURPLE, color: 'white' }
                : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.22)' }
              }
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[10px] text-center mt-2" style={{ color: 'rgba(255,255,255,0.18)' }}>
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  )
}

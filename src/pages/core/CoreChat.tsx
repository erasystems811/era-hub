import { useState, useEffect, useRef } from 'react'
import { Send, Plus, Brain, Trash2, Settings, Globe } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getCoreApi, getCoreSecret } from '../../lib/config'

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
function uid() { return crypto.randomUUID() }

function getCoreBase(): string {
  return import.meta.env.DEV ? getCoreApi() : '/api/core'
}

const PURPLE = '#9B7FD4'

function NotConfigured() {
  const nav = useNavigate()
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: `${PURPLE}18`, border: `1px solid ${PURPLE}30` }}>
        <Brain className="w-7 h-7" style={{ color: PURPLE }} />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-2">ERA Core not connected</h3>
      <p className="text-sm max-w-xs leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.38)' }}>
        Set your ERA Core URL and secret key first.
      </p>
      <button
        onClick={() => nav('/core/settings')}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
        style={{ background: PURPLE, color: 'white' }}
      >
        <Settings className="w-4 h-4" />
        Connect ERA Core
      </button>
    </div>
  )
}

export function CoreChat() {
  const [mode, setMode] = useState<'business' | 'personal'>('business')
  const [sessions, setSessions] = useState<Session[]>(loadSessions)
  const [activeId, setActiveId] = useState<string | null>(() => loadSessions()[0]?.id ?? null)
  const [messages, setMessages] = useState<Message[]>(() => {
    const first = loadSessions()[0]
    return first ? loadMessages(first.id) : []
  })
  const [input, setInput] = useState('')
  const [webSearch, setWebSearch] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [streamText, setStreamText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    setMessages(activeId ? loadMessages(activeId) : [])
  }, [activeId])

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, streamText, streaming])

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
    if (activeId === id) {
      setActiveId(updated[0]?.id ?? null)
      setMessages(updated[0] ? loadMessages(updated[0].id) : [])
    }
  }

  async function send() {
    if (!input.trim() || streaming) return
    const text = input.trim()
    setInput('')
    setError(null)

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

    if (messages.length === 0) {
      const updated = currentSessions.map(s => s.id === sid ? { ...s, title: text.slice(0, 45) } : s)
      setSessions(updated)
      saveSessions(updated)
    }

    setStreaming(true)
    setStreamText('')

    const abort = new AbortController()
    abortRef.current = abort

    try {
      const res = await fetch(`${getCoreBase()}/v1/chat?stream=true`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-core-secret': getCoreSecret(),
        },
        body: JSON.stringify({ session_id: sid, mode, message: text, web_search: webSearch }),
        signal: abort.signal,
      })

      if (!res.ok) {
        const errText = await res.text().catch(() => '')
        throw new Error(`${res.status}: ${errText}`)
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buf = ''
      let fullText = ''
      let finalSessionId = sid

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const parts = buf.split('\n\n')
        buf = parts.pop() ?? ''
        for (const part of parts) {
          if (!part.startsWith('data: ')) continue
          let data: Record<string, unknown>
          try {
            data = JSON.parse(part.slice(6))
          } catch {
            continue  // skip malformed SSE line
          }
          if (typeof data.text === 'string') {
            fullText += data.text
            setStreamText(fullText)
          }
          if (data.done) {
            finalSessionId = (data.session_id as string) ?? sid
          }
          if (data.error) {
            throw new Error(data.error as string)
          }
        }
      }

      const coreMsg: Message = { id: uid(), role: 'core', content: fullText, createdAt: new Date().toISOString() }
      const final = [...withUser, coreMsg]

      // If server created a new session ID, adopt it
      if (finalSessionId !== sid) {
        const updated = currentSessions.map(s => s.id === sid ? { ...s, id: finalSessionId } : s)
        setSessions(updated)
        saveSessions(updated)
        setActiveId(finalSessionId)
        saveMessages(finalSessionId, final)
      } else {
        saveMessages(sid, final)
        const updated = currentSessions.map(s => s.id === sid ? { ...s, updatedAt: new Date().toISOString() } : s)
        setSessions(updated)
        saveSessions(updated)
      }

      setMessages(final)
      setStreamText('')
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setStreaming(false)
      abortRef.current = null
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send() }
  }

  function formatTime(iso: string) {
    const d = new Date(iso)
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  }

  if (!getCoreApi()) return <div className="flex h-full"><NotConfigured /></div>

  return (
    <div className="flex h-full">

      {/* Sessions panel */}
      <div className="w-64 shrink-0 flex flex-col border-r" style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.015)' }}>
        <div className="px-4 pt-5 pb-3 border-b shrink-0" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${PURPLE}22`, border: `1px solid ${PURPLE}44` }}>
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
            <p className="text-[11px] px-3 py-6 text-center" style={{ color: 'rgba(255,255,255,0.22)' }}>No conversations yet</p>
          )}
          {sessions.map(s => (
            <button
              key={s.id}
              onClick={() => { setActiveId(s.id); setMessages(loadMessages(s.id)) }}
              className="w-full text-left px-3 py-2.5 rounded-lg transition-all group flex items-start gap-2"
              style={activeId === s.id
                ? { background: `${PURPLE}18`, borderLeft: `2px solid ${PURPLE}`, paddingLeft: 10 }
                : { color: 'rgba(255,255,255,0.40)' }
              }
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate leading-snug" style={activeId === s.id ? { color: PURPLE } : {}}>
                  {s.title}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.22)' }}>{formatTime(s.updatedAt)}</p>
              </div>
              <button
                onClick={e => deleteSession(s.id, e)}
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

        {/* Mode toggle */}
        <div className="shrink-0 px-8 py-3 border-b flex items-center gap-2" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          {(['business', 'personal'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all"
              style={mode === m
                ? { background: `${PURPLE}22`, color: PURPLE, border: `1px solid ${PURPLE}44` }
                : { color: 'rgba(255,255,255,0.30)', border: '1px solid transparent' }
              }
            >
              {m}
            </button>
          ))}
          <span className="text-[10px] ml-2" style={{ color: 'rgba(255,255,255,0.20)' }}>
            {mode === 'business' ? 'GPT-4o · ERA Systems' : 'GPT-4o · Personal life'}
          </span>

          <button
            onClick={() => setWebSearch(w => !w)}
            className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all"
            style={webSearch
              ? { background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.35)', color: '#34d399' }
              : { border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.30)' }
            }
          >
            <Globe className="w-3 h-3" />
            {webSearch ? 'Web on' : 'Web off'}
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="flex flex-col justify-end min-h-full px-8 py-6 gap-4">
          {messages.length === 0 && !streaming && (
            <div className="flex flex-col items-center justify-center text-center select-none py-20">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: `${PURPLE}18`, border: `1px solid ${PURPLE}30` }}>
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
                <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mb-0.5" style={{ background: `${PURPLE}22`, border: `1px solid ${PURPLE}44` }}>
                  <Brain className="w-3 h-3" style={{ color: PURPLE }} />
                </div>
              )}
              <div
                className="max-w-[68%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap"
                style={msg.role === 'user'
                  ? { background: 'rgba(196,40,111,0.13)', border: '1px solid rgba(196,40,111,0.22)', color: 'rgba(255,255,255,0.88)', borderRadius: '18px 18px 4px 18px' }
                  : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.82)', borderRadius: '18px 18px 18px 4px' }
                }
              >
                {msg.content}
              </div>
            </div>
          ))}

          {/* Live streaming bubble */}
          {streaming && (
            <div className="flex justify-start items-end gap-2.5">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mb-0.5" style={{ background: `${PURPLE}22`, border: `1px solid ${PURPLE}44` }}>
                <Brain className="w-3 h-3" style={{ color: PURPLE }} />
              </div>
              <div
                className="max-w-[68%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.82)', borderRadius: '18px 18px 18px 4px' }}
              >
                {streamText || (
                  <div className="flex gap-1 items-center py-0.5">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: PURPLE, animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                )}
                {streamText && <span className="inline-block w-0.5 h-4 ml-0.5 align-middle animate-pulse" style={{ background: PURPLE }} />}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
          </div>
        </div>

        {/* Input */}
        <div className="px-8 py-4 shrink-0 border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <div
            className="flex items-end gap-3 rounded-2xl px-4 py-3 transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${streaming ? PURPLE + '44' : 'rgba(255,255,255,0.10)'}` }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Talk to ERA Core…"
              rows={1}
              disabled={streaming}
              className="flex-1 resize-none bg-transparent text-sm text-foreground outline-none leading-relaxed"
              style={{ maxHeight: 160, overflowY: 'auto', color: 'rgba(255,255,255,0.88)', caretColor: PURPLE, opacity: streaming ? 0.5 : 1 }}
            />
            <button
              onClick={() => void send()}
              disabled={!input.trim() || streaming}
              className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all"
              style={input.trim() && !streaming
                ? { background: PURPLE, color: 'white' }
                : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.22)' }
              }
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
          {error && <p className="text-[11px] mt-2 text-center" style={{ color: '#f87171' }}>{error}</p>}
          {!error && (
            <p className="text-[10px] text-center mt-2" style={{ color: 'rgba(255,255,255,0.18)' }}>
              {streaming ? 'ERA Core is thinking…' : 'Enter to send · Shift+Enter for new line'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

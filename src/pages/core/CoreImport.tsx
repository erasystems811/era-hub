import { useState, useRef, useCallback } from 'react'
import { Upload, CheckCircle, XCircle, Loader, Brain } from 'lucide-react'
import JSZip from 'jszip'
import { CORE_API, CORE_SECRET } from '../../lib/config'

const PURPLE = '#9B7FD4'
const BATCH = 20

// --- Claude export transformer ---
function transformClaude(raw: unknown[]) {
  return raw
    .map((conv: any) => {
      const messages = (conv.chat_messages ?? [])
        .filter((m: any) => m.text?.trim())
        .map((m: any, i: number) => ({
          role: m.sender === 'human' ? 'human' : 'assistant',
          content: m.text.trim(),
          position: i,
        }))
      return {
        platform: 'claude' as const,
        external_id: conv.uuid ?? undefined,
        title: conv.name ?? 'Claude conversation',
        happened_at: conv.created_at ?? undefined,
        messages,
      }
    })
    .filter(c => c.messages.length > 0)
}

// --- ChatGPT export transformer ---
function walkMapping(mapping: Record<string, any>, nodeId: string, out: any[]) {
  const node = mapping[nodeId]
  if (!node) return
  const msg = node.message
  if (msg?.author?.role && msg?.content?.parts) {
    const role = msg.author.role as string
    const content = (msg.content.parts as unknown[])
      .filter(p => typeof p === 'string')
      .join('')
      .trim()
    if (content && (role === 'user' || role === 'assistant')) {
      out.push({
        role: role === 'user' ? 'human' : 'assistant',
        content,
        position: out.length,
      })
    }
  }
  for (const child of node.children ?? []) walkMapping(mapping, child, out)
}

function transformChatGPT(raw: unknown[]) {
  return raw
    .map((conv: any) => {
      const mapping: Record<string, any> = conv.mapping ?? {}
      const nodes = Object.values(mapping)
      const rootNode = nodes.find(n => !n.parent || !mapping[n.parent])
      const messages: any[] = []
      if (rootNode) walkMapping(mapping, rootNode.id, messages)
      return {
        platform: 'chatgpt' as const,
        external_id: conv.id ?? undefined,
        title: conv.title ?? 'ChatGPT conversation',
        happened_at: conv.create_time ? new Date(conv.create_time * 1000).toISOString() : undefined,
        messages,
      }
    })
    .filter(c => c.messages.length > 0)
}

// --- Upload in batches ---
async function uploadBulk(
  conversations: any[],
  onProgress: (done: number, total: number) => void
): Promise<{ ingested: number; errors: number }> {
  let ingested = 0
  let errors = 0

  for (let i = 0; i < conversations.length; i += BATCH) {
    const batch = conversations.slice(i, i + BATCH)
    try {
      const res = await fetch(`${CORE_API}/v1/ingest/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-core-secret': CORE_SECRET },
        body: JSON.stringify({ conversations: batch }),
      })
      if (res.ok) {
        const data = await res.json() as { ingested: number }
        ingested += data.ingested
      } else {
        errors += batch.length
      }
    } catch {
      errors += batch.length
    }
    onProgress(Math.min(i + BATCH, conversations.length), conversations.length)
  }

  // Trigger memory extraction
  await fetch(`${CORE_API}/v1/ingest/process`, {
    method: 'POST',
    headers: { 'x-core-secret': CORE_SECRET },
  }).catch(() => {})

  return { ingested, errors }
}

// --- Parse a dropped file ---
async function parseFile(file: File, platform: 'claude' | 'chatgpt'): Promise<unknown[]> {
  if (file.name.endsWith('.zip')) {
    const zip = await JSZip.loadAsync(file)
    const jsonFile = zip.file('conversations.json')
    if (!jsonFile) throw new Error('conversations.json not found inside ZIP')
    const text = await jsonFile.async('string')
    return JSON.parse(text) as unknown[]
  }
  const text = await file.text()
  return JSON.parse(text) as unknown[]
}

type Status = 'idle' | 'parsing' | 'uploading' | 'done' | 'error'

interface PlatformState {
  status: Status
  file: File | null
  total: number
  done: number
  ingested: number
  errors: number
  errorMsg: string
}

const defaultState = (): PlatformState => ({
  status: 'idle', file: null, total: 0, done: 0, ingested: 0, errors: 0, errorMsg: '',
})

export function CoreImport() {
  const [claude, setClaude] = useState<PlatformState>(defaultState())
  const [chatgpt, setChatgpt] = useState<PlatformState>(defaultState())
  const claudeRef = useRef<HTMLInputElement>(null)
  const chatgptRef = useRef<HTMLInputElement>(null)

  const handle = useCallback(async (file: File, platform: 'claude' | 'chatgpt') => {
    const set = platform === 'claude' ? setClaude : setChatgpt

    set(s => ({ ...s, status: 'parsing', file, errorMsg: '' }))

    try {
      const raw = await parseFile(file, platform)
      const conversations = platform === 'claude' ? transformClaude(raw) : transformChatGPT(raw)

      set(s => ({ ...s, status: 'uploading', total: conversations.length, done: 0 }))

      const result = await uploadBulk(conversations, (done, total) => {
        set(s => ({ ...s, done, total }))
      })

      set(s => ({ ...s, status: 'done', ingested: result.ingested, errors: result.errors }))
    } catch (err) {
      set(s => ({ ...s, status: 'error', errorMsg: err instanceof Error ? err.message : 'Failed' }))
    }
  }, [])

  const onDrop = useCallback((e: React.DragEvent, platform: 'claude' | 'chatgpt') => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) void handle(file, platform)
  }, [handle])

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, platform: 'claude' | 'chatgpt') => {
    const file = e.target.files?.[0]
    if (file) void handle(file, platform)
  }, [handle])

  return (
    <div className="max-w-2xl mx-auto py-8 px-6">

      <div className="flex items-center gap-3 mb-8">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${PURPLE}22`, border: `1px solid ${PURPLE}44` }}>
          <Brain className="w-4 h-4" style={{ color: PURPLE }} />
        </div>
        <div>
          <h1 className="text-base font-bold text-foreground">Import Conversations</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Drop your export files — ERA Core learns from them</p>
        </div>
      </div>

      <div className="space-y-4">
        <DropZone
          platform="claude"
          label="Claude"
          hint="Export from Claude.ai → Settings → Export data"
          accepts=".json,.zip"
          state={claude}
          inputRef={claudeRef}
          onDrop={e => onDrop(e, 'claude')}
          onClick={() => claudeRef.current?.click()}
          onChange={e => onFileChange(e, 'claude')}
        />
        <DropZone
          platform="chatgpt"
          label="ChatGPT"
          hint="Export from ChatGPT → Settings → Data controls → Export — drop the ZIP or extracted conversations.json"
          accepts=".json,.zip"
          state={chatgpt}
          inputRef={chatgptRef}
          onDrop={e => onDrop(e, 'chatgpt')}
          onClick={() => chatgptRef.current?.click()}
          onChange={e => onFileChange(e, 'chatgpt')}
        />
      </div>

      <div className="mt-8 rounded-xl px-5 py-4 space-y-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.45)' }}>How to export</p>
        <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.30)' }}>
          <span style={{ color: PURPLE }}>Claude:</span> claude.ai → Settings → Privacy → Export data → download JSON
        </p>
        <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.30)' }}>
          <span style={{ color: '#4DBFB3' }}>ChatGPT:</span> chatgpt.com → Settings → Data controls → Export data → download ZIP and drop it directly here
        </p>
        <p className="text-xs leading-relaxed mt-1" style={{ color: 'rgba(255,255,255,0.20)' }}>
          After import, ERA Core automatically extracts your principles, thinking style, preferences, and decision patterns from every conversation.
        </p>
      </div>
    </div>
  )
}

interface DropZoneProps {
  platform: 'claude' | 'chatgpt'
  label: string
  hint: string
  accepts: string
  state: PlatformState
  inputRef: React.RefObject<HTMLInputElement>
  onDrop: (e: React.DragEvent) => void
  onClick: () => void
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

function DropZone({ platform, label, hint, accepts, state, inputRef, onDrop, onClick, onChange }: DropZoneProps) {
  const [dragging, setDragging] = useState(false)
  const color = platform === 'claude' ? PURPLE : '#4DBFB3'
  const { status, total, done, ingested, errors, errorMsg } = state

  const progress = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div
      onClick={status === 'idle' || status === 'error' ? onClick : undefined}
      onDrop={e => { setDragging(false); onDrop(e) }}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      className="rounded-2xl transition-all"
      style={{
        border: `1.5px dashed ${dragging ? color : 'rgba(255,255,255,0.10)'}`,
        background: dragging ? `${color}08` : 'rgba(255,255,255,0.025)',
        cursor: status === 'idle' || status === 'error' ? 'pointer' : 'default',
        padding: '28px 24px',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accepts}
        className="hidden"
        onChange={onChange}
      />

      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
          {status === 'idle' && <Upload className="w-4 h-4" style={{ color }} />}
          {(status === 'parsing' || status === 'uploading') && <Loader className="w-4 h-4 animate-spin" style={{ color }} />}
          {status === 'done' && <CheckCircle className="w-4 h-4" style={{ color: '#22c55e' }} />}
          {status === 'error' && <XCircle className="w-4 h-4" style={{ color: '#f87171' }} />}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>{label}</p>

          {status === 'idle' && (
            <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'rgba(255,255,255,0.30)' }}>
              Drop file or click to browse · .json or .zip
            </p>
          )}

          {status === 'parsing' && (
            <p className="text-xs mt-0.5" style={{ color }}>Reading file…</p>
          )}

          {status === 'uploading' && (
            <div className="mt-2">
              <div className="flex justify-between mb-1">
                <p className="text-xs" style={{ color }}>Uploading {done} / {total} conversations</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{progress}%</p>
              </div>
              <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${progress}%`, background: color }}
                />
              </div>
            </div>
          )}

          {status === 'done' && (
            <p className="text-xs mt-0.5" style={{ color: '#22c55e' }}>
              {ingested} conversations ingested{errors > 0 ? ` · ${errors} failed` : ''} · ERA Core is learning
            </p>
          )}

          {status === 'error' && (
            <p className="text-xs mt-0.5" style={{ color: '#f87171' }}>{errorMsg} — click to try again</p>
          )}
        </div>
      </div>
    </div>
  )
}

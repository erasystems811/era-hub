import { useState, useRef, useCallback, useEffect } from 'react'
import { Upload, CheckCircle, XCircle, Loader, Brain, FileText, RefreshCw } from 'lucide-react'
import JSZip from 'jszip'
import { getCoreApi, getCoreSecret } from '../../lib/config'

const PURPLE = '#9B7FD4'
const BATCH = 20

function getCoreBase(): string {
  return import.meta.env.DEV ? getCoreApi() : '/api/core'
}

// --- Claude export transformer ---
function transformClaude(raw: unknown[]) {
  return (raw as any[])
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
    .filter((c: any) => c.messages.length > 0)
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
      out.push({ role: role === 'user' ? 'human' : 'assistant', content, position: out.length })
    }
  }
  for (const child of node.children ?? []) walkMapping(mapping, child, out)
}

function transformChatGPT(raw: unknown[]) {
  return (raw as any[])
    .map((conv: any) => {
      const mapping: Record<string, any> = conv.mapping ?? {}
      const nodes = Object.values(mapping)
      const rootNode = nodes.find((n: any) => !n.parent || !mapping[n.parent])
      const messages: any[] = []
      if (rootNode) walkMapping(mapping, (rootNode as any).id, messages)
      return {
        platform: 'chatgpt' as const,
        external_id: conv.id ?? undefined,
        title: conv.title ?? 'ChatGPT conversation',
        happened_at: conv.create_time ? new Date(conv.create_time * 1000).toISOString() : undefined,
        messages,
      }
    })
    .filter((c: any) => c.messages.length > 0)
}

// --- Parse a single file ---
async function parseFile(file: File, platform: 'claude' | 'chatgpt'): Promise<unknown[]> {
  if (file.name.endsWith('.zip')) {
    const zip = await JSZip.loadAsync(file)
    const jsonFile = zip.file('conversations.json')
    if (!jsonFile) throw new Error('conversations.json not found inside ZIP')
    return JSON.parse(await jsonFile.async('string')) as unknown[]
  }
  return JSON.parse(await file.text()) as unknown[]
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
      const res = await fetch(`${getCoreBase()}/v1/ingest/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-core-secret': getCoreSecret() },
        body: JSON.stringify({ conversations: batch }),
      })
      if (res.ok) {
        ingested += ((await res.json()) as { ingested: number }).ingested
      } else {
        errors += batch.length
      }
    } catch {
      errors += batch.length
    }
    onProgress(Math.min(i + BATCH, conversations.length), conversations.length)
  }
  await fetch(`${getCoreBase()}/v1/ingest/process`, {
    method: 'POST',
    headers: { 'x-core-secret': getCoreSecret() },
  }).catch(() => {})
  return { ingested, errors }
}

// --- Types ---
interface DbConversation {
  id: string
  platform: 'claude' | 'chatgpt'
  title: string | null
  message_count: number
  processed: boolean
  happened_at: string | null
  ingested_at: string
}

interface FileJob {
  file: File
  platform: 'claude' | 'chatgpt'
  status: 'queued' | 'parsing' | 'uploading' | 'done' | 'error'
  total: number
  done: number
  ingested: number
  errors: number
  errorMsg: string
}

async function fetchDbHistory(): Promise<DbConversation[]> {
  try {
    const res = await fetch(`${getCoreBase()}/v1/ingest/conversations?limit=200`, {
      headers: { 'x-core-secret': getCoreSecret() },
    })
    if (!res.ok) return []
    return res.json() as Promise<DbConversation[]>
  } catch {
    return []
  }
}

export function CoreImport() {
  const [jobs, setJobs] = useState<FileJob[]>([])
  const [dbHistory, setDbHistory] = useState<DbConversation[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const claudeRef = useRef<HTMLInputElement>(null)
  const chatgptRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setHistoryLoading(true)
    fetchDbHistory().then(rows => { setDbHistory(rows); setHistoryLoading(false) })
  }, [])

  const refreshHistory = () => {
    setHistoryLoading(true)
    fetchDbHistory().then(rows => { setDbHistory(rows); setHistoryLoading(false) })
  }

  const runJobs = useCallback(async (newJobs: FileJob[]) => {
    if (processing) return
    setProcessing(true)
    const startIndex = jobs.length
    setJobs(prev => [...prev, ...newJobs])

    for (let i = 0; i < newJobs.length; i++) {
      const idx = startIndex + i
      const job = newJobs[i]

      setJobs(prev => prev.map((j, k) => k === idx ? { ...j, status: 'parsing' } : j))

      try {
        const raw = await parseFile(job.file, job.platform)
        const conversations = job.platform === 'claude' ? transformClaude(raw) : transformChatGPT(raw)

        setJobs(prev => prev.map((j, k) => k === idx ? { ...j, status: 'uploading', total: conversations.length } : j))

        const result = await uploadBulk(conversations, (done, total) =>
          setJobs(prev => prev.map((j, k) => k === idx ? { ...j, done, total } : j))
        )

        setJobs(prev => prev.map((j, k) => k === idx ? { ...j, status: 'done', ingested: result.ingested, errors: result.errors } : j))
        refreshHistory()
      } catch (err) {
        setJobs(prev => prev.map((j, k) => k === idx ? { ...j, status: 'error', errorMsg: err instanceof Error ? err.message : 'Failed' } : j))
      }
    }
    setProcessing(false)
  }, [jobs, processing])

  const addFiles = useCallback((files: FileList | null, platform: 'claude' | 'chatgpt') => {
    if (!files || files.length === 0) return
    const newJobs: FileJob[] = Array.from(files).map(file => ({
      file, platform, status: 'queued', total: 0, done: 0, ingested: 0, errors: 0, errorMsg: '',
    }))
    void runJobs(newJobs)
  }, [runJobs])

  const clearDone = () => setJobs(prev => prev.filter(j => j.status !== 'done' && j.status !== 'error'))

  return (
    <div className="max-w-2xl mx-auto py-8 px-6">

      <div className="flex items-center gap-3 mb-8">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${PURPLE}22`, border: `1px solid ${PURPLE}44` }}>
          <Brain className="w-4 h-4" style={{ color: PURPLE }} />
        </div>
        <div>
          <h1 className="text-base font-bold text-foreground">Import Conversations</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Drop as many files as you want — ERA Core learns from all of them</p>
        </div>
      </div>

      {/* Drop zones */}
      <div className="space-y-4 mb-8">
        <DropZone
          label="Claude"
          color={PURPLE}
          hint="Drop one or more .json or .zip exports from Claude.ai"
          inputRef={claudeRef}
          onFiles={files => addFiles(files, 'claude')}
        />
        <DropZone
          label="ChatGPT"
          color="#4DBFB3"
          hint="Drop one or more .zip or conversations.json exports from ChatGPT"
          inputRef={chatgptRef}
          onFiles={files => addFiles(files, 'chatgpt')}
        />
      </div>

      {/* Active / completed jobs */}
      {jobs.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>Files</p>
            <button onClick={clearDone} className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>Clear done</button>
          </div>
          <div className="space-y-2">
            {jobs.map((job, i) => {
              const color = job.platform === 'claude' ? PURPLE : '#4DBFB3'
              const progress = job.total > 0 ? Math.round((job.done / job.total) * 100) : 0
              return (
                <div key={i} className="rounded-xl px-4 py-3 flex items-start gap-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                    {job.status === 'done'    && <CheckCircle className="w-3.5 h-3.5" style={{ color: '#22c55e' }} />}
                    {job.status === 'error'   && <XCircle className="w-3.5 h-3.5" style={{ color: '#f87171' }} />}
                    {(job.status === 'parsing' || job.status === 'uploading') && <Loader className="w-3.5 h-3.5 animate-spin" style={{ color }} />}
                    {job.status === 'queued'  && <FileText className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.3)' }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: 'rgba(255,255,255,0.75)' }}>{job.file.name}</p>
                    {job.status === 'queued'   && <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Queued</p>}
                    {job.status === 'parsing'  && <p className="text-[11px] mt-0.5" style={{ color }}>Reading file…</p>}
                    {job.status === 'uploading' && (
                      <div className="mt-1.5">
                        <div className="flex justify-between mb-1">
                          <p className="text-[11px]" style={{ color }}>Uploading {job.done} / {job.total}</p>
                          <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{progress}%</p>
                        </div>
                        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                          <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: color }} />
                        </div>
                      </div>
                    )}
                    {job.status === 'done' && (
                      <p className="text-[11px] mt-0.5" style={{ color: '#22c55e' }}>
                        {job.ingested} ingested{job.errors > 0 ? ` · ${job.errors} failed` : ''}
                      </p>
                    )}
                    {job.status === 'error' && <p className="text-[11px] mt-0.5" style={{ color: '#f87171' }}>{job.errorMsg}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* DB History */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>All imported conversations</p>
            {dbHistory.length > 0 && (
              <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.2)' }}>
                {dbHistory.length} total · {dbHistory.filter(r => r.processed).length} processed
              </p>
            )}
          </div>
          <button onClick={refreshHistory} className="flex items-center gap-1 text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
            <RefreshCw className={`w-3 h-3 ${historyLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {historyLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader className="w-4 h-4 animate-spin" style={{ color: 'rgba(255,255,255,0.2)' }} />
          </div>
        )}

        {!historyLoading && dbHistory.length === 0 && (
          <p className="text-xs py-4 text-center" style={{ color: 'rgba(255,255,255,0.2)' }}>No conversations imported yet</p>
        )}

        {!historyLoading && dbHistory.length > 0 && (
          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
            {dbHistory.map(r => {
              const color = r.platform === 'claude' ? PURPLE : '#4DBFB3'
              const date = new Date(r.ingested_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })
              return (
                <div key={r.id} className="rounded-lg px-3 py-2.5 flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0 font-medium" style={{ background: `${color}18`, color }}>
                    {r.platform}
                  </span>
                  <p className="text-xs flex-1 truncate" style={{ color: 'rgba(255,255,255,0.55)' }}>{r.title ?? 'Untitled'}</p>
                  <span className="text-[10px] shrink-0" style={{ color: 'rgba(255,255,255,0.22)' }}>{r.message_count} msgs</span>
                  <span className={`text-[10px] shrink-0 ${r.processed ? 'text-green-500' : 'text-yellow-500'}`}>
                    {r.processed ? 'learned' : 'pending'}
                  </span>
                  <span className="text-[10px] shrink-0" style={{ color: 'rgba(255,255,255,0.18)' }}>{date}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* How to export */}
      <div className="rounded-xl px-5 py-4 space-y-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.45)' }}>How to export</p>
        <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.30)' }}>
          <span style={{ color: PURPLE }}>Claude:</span> claude.ai → Settings → Privacy → Export data → download JSON
        </p>
        <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.30)' }}>
          <span style={{ color: '#4DBFB3' }}>ChatGPT:</span> chatgpt.com → Settings → Data controls → Export data → download ZIP
        </p>
      </div>
    </div>
  )
}

interface DropZoneProps {
  label: string
  color: string
  hint: string
  inputRef: React.RefObject<HTMLInputElement>
  onFiles: (files: FileList | null) => void
}

function DropZone({ label, color, hint, inputRef, onFiles }: DropZoneProps) {
  const [dragging, setDragging] = useState(false)

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDrop={e => { e.preventDefault(); setDragging(false); onFiles(e.dataTransfer.files) }}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      className="rounded-2xl cursor-pointer transition-all"
      style={{
        border: `1.5px dashed ${dragging ? color : 'rgba(255,255,255,0.10)'}`,
        background: dragging ? `${color}08` : 'rgba(255,255,255,0.025)',
        padding: '22px 24px',
      }}
    >
      <input ref={inputRef} type="file" accept=".json,.zip" multiple className="hidden" onChange={e => onFiles(e.target.files)} />
      <div className="flex items-center gap-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
          <Upload className="w-4 h-4" style={{ color }} />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>{label}</p>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.30)' }}>{hint}</p>
        </div>
      </div>
    </div>
  )
}

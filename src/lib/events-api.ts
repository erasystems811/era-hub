import { COMMS_API, COMMS_SECRET } from './config'

async function req<T>(path: string, opts: RequestInit = {}): Promise<T> {
  if (!COMMS_API) throw new Error('ERA Comms API is not configured.')
  const res = await fetch(`${COMMS_API}/v1/admin${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      'X-Operator-Secret': COMMS_SECRET,
      ...opts.headers,
    },
  })
  const contentType = res.headers.get('content-type') ?? ''
  if (!res.ok) {
    const err = contentType.includes('application/json')
      ? await res.json().catch(() => ({ error: res.statusText }))
      : { error: `${res.status} ${res.statusText}` }
    throw new Error((err as { message?: string; error?: string }).message ?? (err as { error?: string }).error ?? res.statusText)
  }
  if (res.status === 204) return undefined as T
  return res.json() as T
}

const get = <T>(p: string) => req<T>(p, { cache: 'no-store' })

// ── Event types ───────────────────────────────────────────────────────────────

export type EventType =
  // Session
  | 'session_connected' | 'session_disconnected' | 'session_reconnected'
  | 'session_otp_sent'  | 'session_otp_verified' | 'session_created' | 'session_deleted'
  // Message
  | 'message_received'  | 'message_sent'  | 'message_failed' | 'message_queued'
  // AI
  | 'scenario_triggered' | 'kb_queried' | 'ai_response_generated' | 'ai_error'
  // Handoff
  | 'handoff_triggered' | 'human_took_over' | 'handoff_resolved' | 'returned_to_ai'
  // Voice
  | 'voice_note_received' | 'transcription_done' | 'transcription_failed'
  // Business
  | 'business_created' | 'business_updated' | 'business_suspended' | 'business_deleted' | 'plan_changed'
  // Keys
  | 'api_key_generated' | 'api_key_viewed' | 'api_key_expired' | 'api_key_revoked'
  // Billing
  | 'usage_recorded' | 'limit_reached' | 'limit_warning' | 'invoice_generated' | 'payment_received' | 'payment_failed'
  // Requests
  | 'request_submitted' | 'request_approved' | 'request_rejected'
  // Errors
  | 'error'

export type EventSeverity = 'info' | 'warning' | 'critical'

export interface PlatformEvent {
  id: string
  businessId:   string | null
  businessName: string | null
  sessionId:    string | null
  eventType:    EventType
  severity:     EventSeverity
  detail:       string
  metadata:     Record<string, unknown>
  createdAt:    string
}

export interface AuditEntry {
  id:         string
  actor:      'operator' | 'business' | 'system' | 'ai'
  actorId:    string | null
  actorLabel: string
  action:     string
  target:     string
  targetId:   string | null
  detail:     string
  createdAt:  string
}

export interface PlatformAlert {
  id:           string
  businessId:   string | null
  businessName: string | null
  sessionId:    string | null
  type:         string
  severity:     EventSeverity
  message:      string
  resolved:     boolean
  resolvedAt:   string | null
  createdAt:    string
}

export interface LiveSnapshot {
  sessions: {
    total:        number
    connected:    number
    disconnected: number
    warning:      number
  }
  messages: {
    lastHour:    number
    today:       number
    processing:  number
  }
  ai: {
    activeConversations: number
    handoffsInProgress:  number
    errorsLastHour:      number
  }
  alerts: {
    critical: number
    warning:  number
  }
  updatedAt: string
}

export interface EventsQuery {
  businessId?: string
  eventType?:  EventType
  severity?:   EventSeverity
  from?:       string
  to?:         string
  limit?:      number
  offset?:     number
}

export interface UsageRecord {
  businessId:          string
  businessName:        string
  planName:            string
  messagesIn:          number
  messagesOut:         number
  voiceNotesCount:     number
  scenariosTriggered:  number
  aiTokensUsed:        number
  handoffsCount:       number
  periodStart:         string
  periodEnd:           string
  estimatedCost:       number | null
  planLimit:           number | null
  usagePercent:        number | null
}

// ── API client ────────────────────────────────────────────────────────────────

export const eventsApi = {
  // Live platform snapshot
  liveSnapshot: () => get<LiveSnapshot>('/monitoring/snapshot'),

  // Event log — full history
  listEvents: (q: EventsQuery = {}) => {
    const p = new URLSearchParams()
    if (q.businessId) p.set('businessId', q.businessId)
    if (q.eventType)  p.set('eventType',  q.eventType)
    if (q.severity)   p.set('severity',   q.severity)
    if (q.from)       p.set('from',       q.from)
    if (q.to)         p.set('to',         q.to)
    if (q.limit)      p.set('limit',      String(q.limit))
    if (q.offset)     p.set('offset',     String(q.offset))
    return get<PlatformEvent[]>(`/events?${p}`)
  },

  // Audit trail
  listAudit: (q: { businessId?: string; from?: string; to?: string; limit?: number } = {}) => {
    const p = new URLSearchParams()
    if (q.businessId) p.set('businessId', q.businessId)
    if (q.from)       p.set('from',       q.from)
    if (q.to)         p.set('to',         q.to)
    if (q.limit)      p.set('limit',      String(q.limit))
    return get<AuditEntry[]>(`/audit?${p}`)
  },

  // Alerts
  listAlerts:   (resolved?: boolean) => {
    const p = resolved !== undefined ? `?resolved=${resolved}` : ''
    return get<PlatformAlert[]>(`/platform-alerts${p}`)
  },
  resolveAlert: (id: string) => req<void>(`/platform-alerts/${id}/resolve`, { method: 'POST' }),

  // Usage per business
  listUsage: (period?: string) => {
    const p = period ? `?period=${period}` : ''
    return get<UsageRecord[]>(`/usage${p}`)
  },
  getBusinessUsage: (businessId: string, period?: string) => {
    const p = period ? `?period=${period}` : ''
    return get<UsageRecord>(`/usage/${businessId}${p}`)
  },

  // Investigation — everything about one business or phone
  investigate: (query: string) =>
    get<{ events: PlatformEvent[]; audit: AuditEntry[]; alerts: PlatformAlert[] }>(`/investigate?q=${encodeURIComponent(query)}`),
}

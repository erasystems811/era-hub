import { COMMS_API, COMMS_SECRET } from './config'

async function req<T>(path: string, opts: RequestInit = {}): Promise<T> {
  if (!COMMS_API) throw new Error('ERA Comms API is not configured. Contact your administrator.')
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
    if (!contentType.includes('application/json')) {
      throw new Error(`Could not reach ERA Comms (${res.status}). Check your connection and try again.`)
    }
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((err as { message?: string; error?: string }).message ?? (err as { error?: string }).error ?? res.statusText)
  }
  if (res.status === 204) return undefined as T
  if (!contentType.includes('application/json')) {
    throw new Error('ERA Comms returned an unexpected response. Check the API URL in your settings.')
  }
  return res.json() as T
}

const get  = <T>(p: string) => req<T>(p, { cache: 'no-store' })
const post = <T>(p: string, b: unknown) => req<T>(p, { method: 'POST', body: JSON.stringify(b) })
const patch = <T>(p: string, b: unknown) => req<T>(p, { method: 'PATCH', body: JSON.stringify(b) })
const del  = <T>(p: string) => req<T>(p, { method: 'DELETE' })

// ── Types ────────────────────────────────────────────────────────────────────

export type SessionStatus =
  'pending_qr' | 'warming_up' | 'connected' | 'disconnected' | 'flagged' | 'banned'

export interface Session {
  id: string; phoneNumber: string; status: SessionStatus
  riskScore: number; role: 'primary' | 'backup'
  createdAt: string; lastHeartbeatAt: string | null
  messagesSentTotal: number; connectedAt: string | null; cooldownUntil: string | null
  client: { id: string; name: string }
  warmup: { currentDay: number | null; isComplete: boolean | null; skipWarmup: boolean | null }
}

export interface Client {
  id: string; name: string; slug: string
  planId: string; planName: string; active: boolean
  sessionCount: number; monthlyMessageCount: number
  createdAt: string; contactEmail: string | null; contactPhone: string | null
}

export interface ClientDetail extends Client {
  sessions: Session[]
  apiKeys: ApiKey[]
  plan: Plan
  usage: { monthlyMessages: number; sessionsActive: number }
}

export interface Plan {
  id: string
  name: string           // slug e.g. "starter"
  displayName: string
  aiEnabled: boolean
  voiceEnabled: boolean
  analyticsEnabled: boolean
  billingModel: 'none' | 'usage_based' | 'plan_based'
  monthlyFee: number | null
  limits: {
    monthlyMessages: number | null
    dailyMessages: number | null
    hourlyMessages: number | null
    maxSessions: number | null
  }
  clientCount: number
}

export interface CreatePlanData {
  name: string; displayName: string
  aiEnabled: boolean; voiceEnabled: boolean; analyticsEnabled: boolean
  billingModel: 'none' | 'usage_based' | 'plan_based'
  monthlyFee: number | null
  monthlyMessageCap: number | null; dailyMessageCap: number | null
  hourlyMessageCap: number | null; maxSessions: number | null
}

export interface ApiKey {
  id: string; clientId: string; label: string
  keyPreview: string; scopes: string[]; active: boolean
  lastUsedAt: string | null; createdAt: string
}

export interface Alert {
  id: string; type: string; severity: 'info' | 'warning' | 'critical'
  message: string; clientId: string | null; sessionId: string | null
  resolved: boolean; resolvedAt: string | null; createdAt: string
}

export interface MonitoringSnapshot {
  sessions: { total: number; connected: number; disconnected: number; flagged: number; banned: number }
  recentAlerts: Pick<Alert, 'id' | 'type' | 'severity' | 'message' | 'createdAt' | 'resolved'>[]
}

// ── API ──────────────────────────────────────────────────────────────────────

export const commsApi = {
  listPlans:    () => get<Plan[]>('/plans'),
  createPlan:   (data: CreatePlanData) => post<Plan>('/plans', data),
  updatePlan:   (id: string, data: Omit<CreatePlanData, 'name'>) => patch<void>(`/plans/${id}`, data),
  deletePlan:   (id: string) => del<void>(`/plans/${id}`),
  listClients:  () => get<Client[]>('/clients'),
  getClient:    (id: string) => get<ClientDetail>(`/clients/${id}`),
  createClient: (data: { name: string; slug: string; planId: string; contactEmail?: string; contactPhone?: string }) =>
    post<Client>('/clients', data),
  updateClient: (id: string, data: Partial<Pick<Client, 'name' | 'planId' | 'active' | 'contactEmail' | 'contactPhone'>>) =>
    patch<Client>(`/clients/${id}`, data),
  deleteClient: (id: string) => del<void>(`/clients/${id}`),

  createApiKey: (clientId: string, label: string, scopes: string[]) =>
    post<{ id: string; key: string; label: string; scopes: string[] }>(`/clients/${clientId}/api-keys`, { label, scopes }),
  listApiKeys:  (clientId: string) => get<ApiKey[]>(`/clients/${clientId}/api-keys`),
  revokeApiKey: (keyId: string) => del<void>(`/api-keys/${keyId}`),

  listSessions: () => get<Session[]>('/sessions'),
  createSession: (data: { clientId: string; phoneNumber: string; role?: 'primary' | 'backup' }) =>
    post<{ id: string; phoneNumber: string; role: string; status: string }>('/sessions', data),
  stopSession:   (id: string) => del<void>(`/sessions/${id}`),

  monitoring: () => get<MonitoringSnapshot>('/monitoring'),
  listAlerts:  () => get<Alert[]>('/alerts'),
}

export function commsQrSocket(sessionId: string): WebSocket {
  const base = COMMS_API.replace(/^http/, 'ws')
  return new WebSocket(`${base}/v1/admin/sessions/${sessionId}/qr?secret=${encodeURIComponent(COMMS_SECRET)}`)
}

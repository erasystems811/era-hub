import { COMMS_API, COMMS_SECRET } from './config'

async function req<T>(path: string, opts: RequestInit = {}): Promise<T> {
  if (!COMMS_API) throw new Error('ERA Comms API is not configured.')
  const res = await fetch(`${COMMS_API}/v1/admin/connect${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      'X-Operator-Secret': COMMS_SECRET,
      'ngrok-skip-browser-warning': 'true',
      ...opts.headers,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((err as { message?: string; error?: string }).message ?? res.statusText)
  }
  if (res.status === 204) return undefined as T
  return res.json() as T
}

const get   = <T>(p: string)               => req<T>(p, { cache: 'no-store' })
const post  = <T>(p: string, b: unknown)   => req<T>(p, { method: 'POST',   body: JSON.stringify(b) })
const patch = <T>(p: string, b: unknown)   => req<T>(p, { method: 'PATCH',  body: JSON.stringify(b) })
const del   = <T>(p: string)               => req<T>(p, { method: 'DELETE' })

// ── Types ─────────────────────────────────────────────────────

export type InstanceStatus = 'online' | 'offline' | 'error'

export interface ConnectInstance {
  id: string
  hospitalName: string
  hospitalId: string | null
  apiKey: string
  status: InstanceStatus
  mode: 'database' | 'browser'
  emrEngine: string | null
  version: string | null
  patientsSynced: number
  carePlansSynced: number
  errorsTotal: number
  lastHeartbeatAt: string | null
  lastErrorAt: string | null
  createdAt: string
  updatedAt: string
  config?: ConnectConfig | null
}

export interface ConnectConfig {
  id: string
  instanceId: string
  syncIntervalSeconds: number
  paused: boolean
  notifyEmail: string | null
  updatedAt: string
}

export type EventType =
  | 'heartbeat' | 'startup' | 'shutdown'
  | 'patient_synced' | 'care_plan_synced'
  | 'sync_error' | 'auth_ok' | 'auth_failed'
  | 'db_connected' | 'db_error'
  | 'config_fetched' | 'config_updated'

export interface ConnectEvent {
  id: string
  instanceId: string
  hospitalName: string | null
  eventType: EventType
  status: 'ok' | 'error' | 'warning'
  message: string
  patientMrn: string | null
  metadata: Record<string, unknown>
  createdAt: string
}

export interface ConnectStats {
  instances: { total: number; online: number; offline: number; error: number }
  totals: { patientsSynced: number; carePlansSynced: number; errorsTotal: number }
}

export interface ConnectRelease {
  version: string
  downloadUrl: string
  updatedAt: string | null
}

// ── API calls ─────────────────────────────────────────────────

export const connectApi = {
  getStats: () => get<ConnectStats>('/stats'),

  listInstances: () => get<ConnectInstance[]>('/instances'),

  getInstance: (id: string) => get<ConnectInstance>(`/instances/${id}`),

  createInstance: (body: {
    hospitalName: string
    hospitalId?: string
    mode?: string
    emrEngine?: string
  }) => post<ConnectInstance>('/instances', body),

  deleteInstance: (id: string) => del<void>(`/instances/${id}`),

  updateConfig: (id: string, body: {
    syncIntervalSeconds?: number
    paused?: boolean
    notifyEmail?: string | null
  }) => patch<ConnectConfig>(`/instances/${id}/config`, body),

  triggerRestart: (id: string) => post<void>(`/instances/${id}/restart`, {}),

  getRelease: () => get<ConnectRelease>('/release'),

  updateRelease: (body: { version: string; downloadUrl: string }) =>
    patch<ConnectRelease>('/release', body),

  listEvents: (params?: {
    instanceId?: string
    eventType?: string
    status?: string
    from?: string
    to?: string
    limit?: number
    offset?: number
  }) => {
    const qs = params
      ? '?' + new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v !== undefined && v !== '')
            .map(([k, v]) => [k, String(v)])
        ).toString()
      : ''
    return get<{ events: ConnectEvent[]; total: number; limit: number; offset: number }>(`/events${qs}`)
  },
}

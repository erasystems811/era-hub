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
const put  = <T>(p: string, b: unknown) => req<T>(p, { method: 'PUT', body: JSON.stringify(b) })

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

export interface OnboardingRequest {
  id:           string
  tier:         'ai_agent' | 'developer'
  businessName: string
  contactEmail: string
  contactPhone: string | null
  description:  string | null
  planId:       string | null
  planName:     string | null
  status:       'pending' | 'approved' | 'rejected'
  rejectedReason: string | null
  createdAt:    string
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

export interface AITemplateField {
  key: string; label: string; placeholder: string; required: boolean
}

export type AITemplateCategory = 'order_taking' | 'booking' | 'support' | 'lead_gen' | 'custom'

export interface AITemplate {
  id: string
  name: string
  category: AITemplateCategory
  description: string
  instruction: string
  triggerKeywords: string[]
  fields: AITemplateField[]
  archived: boolean
  createdAt: string
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
  listApiKeys:      (clientId: string) => get<ApiKey[]>(`/clients/${clientId}/api-keys`),
  revokeApiKey:     (keyId: string) => del<void>(`/api-keys/${keyId}`),
  sendSecureKeyLink:(clientId: string, keyId: string) => post<void>(`/clients/${clientId}/api-keys/${keyId}/send-secure-link`, {}),

  listSessions:   () => get<Session[]>('/sessions'),
  createSession:  (data: { clientId: string; phoneNumber: string; role?: 'primary' | 'backup' }) =>
    post<{ id: string; phoneNumber: string; role: string; status: string }>('/sessions', data),
  stopSession:    (id: string) => del<void>(`/sessions/${id}`),

  // Master session — ERA Systems own number used for OTP and platform messages
  getMasterSession:    () => get<Session | null>('/sessions/master'),
  sendOtp:             (phoneNumber: string) => post<{ otpId: string }>('/sessions/otp/send', { phoneNumber }),
  verifyOtp:           (otpId: string, code: string) => post<{ sessionId: string }>('/sessions/otp/verify', { otpId, code }),

  // Business onboarding requests
  listRequests:   () => get<OnboardingRequest[]>('/requests'),
  approveRequest: (id: string) => post<{ clientId: string; tempPassword: string }>(`/requests/${id}/approve`, {}),
  rejectRequest:  (id: string, reason?: string) => post<void>(`/requests/${id}/reject`, { reason }),

  monitoring: () => get<MonitoringSnapshot>('/monitoring'),
  listAlerts:  () => get<Alert[]>('/alerts'),

  // AI template library
  listTemplates:   () => get<AITemplate[]>('/ai-templates'),
  createTemplate:  (data: Omit<AITemplate, 'id' | 'archived' | 'createdAt'>) => post<AITemplate>('/ai-templates', data),
  updateTemplate:  (id: string, data: Partial<Omit<AITemplate, 'id' | 'createdAt'>>) => patch<AITemplate>(`/ai-templates/${id}`, data),
  archiveTemplate: (id: string) => del<void>(`/ai-templates/${id}`),
}

export function commsQrSocket(sessionId: string): WebSocket {
  const base = COMMS_API.replace(/^http/, 'ws')
  return new WebSocket(`${base}/v1/admin/sessions/${sessionId}/qr?secret=${encodeURIComponent(COMMS_SECRET)}`)
}

// ── Email API types ───────────────────────────────────────────────────────────

export interface EmailOverviewStats {
  postalConnected: boolean
  sentToday:    number
  sent30d:      number
  deliveryRate: number
  clickRate:    number
  bounceRate:   number
}

export interface EmailDomain {
  id:            string
  clientId:      string
  clientName:    string
  domain:        string
  spfVerified:   boolean
  dkimVerified:  boolean
  dmarcVerified: boolean
  mxVerified:    boolean
  dkimPublicKey: string | null
  verified:      boolean
  verifiedAt:    string | null
  createdAt:     string
}

export interface PostalDnsRecord {
  spfRecord:   string
  dkimRecord:  { name: string; value: string }
  dmarcRecord: string
  mxRecord:    string
}

export interface EmailTemplate {
  id:         string
  clientId:   string
  clientName: string
  name:       string
  subject:    string
  htmlBody:   string
  createdAt:  string
  updatedAt:  string
}

export interface EmailCampaign {
  id:              string
  clientId:        string
  clientName:      string
  name:            string
  templateId:      string
  templateName:    string
  listId:          string
  listName:        string
  status:          'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled'
  scheduledAt:     string | null
  startedAt:       string | null
  completedAt:     string | null
  totalRecipients: number
  totalSent:       number
  totalDelivered:  number
  totalClicked:    number
  totalBounced:    number
  deliveryRate:    number
  clickRate:       number
  bounceRate:      number
  createdAt:       string
}

export interface EmailContactList {
  id:           string
  clientId:     string
  clientName:   string
  name:         string
  contactCount: number
  createdAt:    string
}

export interface EmailSuppressed {
  id:         string
  email:      string
  reason:     string
  clientId:   string | null
  clientName: string | null
  global:     boolean
  createdAt:  string
}

// ── Email API ─────────────────────────────────────────────────────────────────

export const emailApi = {
  overview:         () => get<EmailOverviewStats>('/email/overview'),

  listDomains:      () => get<EmailDomain[]>('/email/domains'),
  addDomain:        (clientId: string, domain: string) =>
                      post<EmailDomain>('/email/domains', { clientId, domain }),
  deleteDomain:     (id: string) => del<void>(`/email/domains/${id}`),
  domainDns:        (id: string) => get<PostalDnsRecord>(`/email/domains/${id}/dns`),
  verifyDomain:     (id: string) =>
                      post<{ queued: boolean; message: string }>(`/email/domains/${id}/verify`, {}),

  listTemplates:    (clientId?: string) =>
                      get<EmailTemplate[]>(`/email/templates${clientId ? `?clientId=${clientId}` : ''}`),
  createTemplate:   (data: { clientId: string; name: string; subject: string; htmlBody: string }) =>
                      post<EmailTemplate>('/email/templates', data),
  updateTemplate:   (id: string, data: { name?: string; subject?: string; htmlBody?: string }) =>
                      put<EmailTemplate>(`/email/templates/${id}`, data),
  deleteTemplate:   (id: string) => del<void>(`/email/templates/${id}`),

  listCampaigns:    (params?: { clientId?: string; status?: string }) => {
                      const qs = new URLSearchParams()
                      if (params?.clientId) qs.set('clientId', params.clientId)
                      if (params?.status)   qs.set('status',   params.status)
                      const q = qs.toString()
                      return get<EmailCampaign[]>(`/email/campaigns${q ? `?${q}` : ''}`)
                    },
  sendCampaign:     (id: string) =>
                      post<{ launched: boolean; queued: boolean }>(`/email/campaigns/${id}/send`, {}),
  cancelCampaign:   (id: string) =>
                      post<{ cancelled: boolean }>(`/email/campaigns/${id}/cancel`, {}),

  listContactLists: (clientId?: string) =>
                      get<EmailContactList[]>(`/email/contacts/lists${clientId ? `?clientId=${clientId}` : ''}`),
  createContactList:(clientId: string, name: string) =>
                      post<{ id: string; name: string; created_at: string }>('/email/contacts/lists', { clientId, name }),
  deleteContactList:(id: string) => del<void>(`/email/contacts/lists/${id}`),

  listSuppressed:   (clientId?: string) =>
                      get<EmailSuppressed[]>(`/email/contacts/suppression${clientId ? `?clientId=${clientId}` : ''}`),
  removeSuppressed: (id: string) => del<void>(`/email/contacts/suppression/${id}`),
}

export interface AIEngineConfig {
  temperature:          number
  systemPrompt:         string
  maxRequestsPerHour:   number
  maxTokensPerResponse: number
  dailySpendCutoff:     number
}

export const aiEngineApi = {
  getConfig:  ()                       => get<AIEngineConfig>('/ai-config'),
  saveConfig: (data: AIEngineConfig)   => put<void>('/ai-config', data),
}

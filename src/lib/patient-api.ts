import { PATIENT_API } from './config'

const TOKEN_KEY = 'era_hub_super_admin_token'
export const getToken  = () => localStorage.getItem(TOKEN_KEY)
export const setToken  = (t: string) => localStorage.setItem(TOKEN_KEY, t)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

async function req<T>(path: string, opts: RequestInit = {}): Promise<T> {
  if (!PATIENT_API) throw new Error('ERA Patient API is not configured. Contact your administrator.')
  const token = getToken()
  const res = await fetch(`${PATIENT_API}/api${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'x-super-admin-token': token } : {}),
      ...opts.headers,
    },
  })
  const contentType = res.headers.get('content-type') ?? ''
  if (!res.ok) {
    if (!contentType.includes('application/json')) {
      throw new Error(`Could not reach ERA Patient (${res.status}). Check your connection and try again.`)
    }
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((err as { message?: string; error?: string }).message ?? (err as { error?: string }).error ?? res.statusText)
  }
  if (res.status === 204) return undefined as T
  if (!contentType.includes('application/json')) {
    throw new Error('ERA Patient returned an unexpected response. Check the API URL in your settings.')
  }
  return res.json() as T
}

const get  = <T>(p: string) => req<T>(p, { cache: 'no-store' })
const post = <T>(p: string, b: unknown) => req<T>(p, { method: 'POST', body: JSON.stringify(b) })
const patch = <T>(p: string, b: unknown) => req<T>(p, { method: 'PATCH', body: JSON.stringify(b) })
const put  = <T>(p: string, b: unknown) => req<T>(p, { method: 'PUT', body: JSON.stringify(b) })
const del  = <T>(p: string) => req<T>(p, { method: 'DELETE' })

// ── Types ────────────────────────────────────────────────────────────────────

export interface Hospital {
  id: number; name: string; slug: string; username: string
  active: boolean; subscriptionStatus: string; subscriptionExpiresAt: string | null
  logoUrl: string | null; hospitalCode: string | null; createdAt: string
  contactEmail: string | null; contactPhone: string | null
  feedbackSlug: string | null; patientCount: number
  walletBalanceKobo: number | null; currentPassword: string | null
  settings: HospitalSettings | null; modules: HospitalModules | null
  staffCredentials: { nurseUsername: string; nursePlainPassword: string; receptionistUsername: string; receptionistPlainPassword: string } | null
}

export interface HospitalSettings {
  id: number; hospitalId: number; departments: string[]
  senderName: string | null; notificationChannel: 'whatsapp' | 'sms' | null
  language: string | null; tone: string[] | null; phoneNumber: string | null
  termiiSenderId: string | null; senderIdApproved: boolean
  pipelinePostTreatmentDays: number | null; pipelineDormantDays: number | null
  whatsappFromNumber: string | null; callTaskAiDailyLimit: number | null
  callTaskAiUsedToday: number
}

export interface HospitalModules {
  id: number; hospitalId: number
  appointmentsEnabled: boolean; feedbackEnabled: boolean
  wellnessNewsletterEnabled: boolean; whatsappEnabled: boolean
  messagesEnabled: boolean; callTaskSmsEnabled: boolean
  followupSmsEnabled: boolean; appointmentReminderSmsEnabled: boolean
}

export interface AutomationLog {
  id: number; hospitalId: number | null; hospitalName: string | null
  patientId: number | null; patientName: string | null
  automationType: string; channel: string; status: string
  messagePreview: string | null; errorMessage: string | null
  retryCount: number; createdAt: string; lastAttemptedAt: string | null; sentAt: string | null
}

export interface SupportTicket {
  id: number; hospital_id: number; hospital_name: string
  subject: string; status: string; created_at: string
  last_message: { sender: string; preview: string; created_at: string } | null
}

export interface CrmLead {
  id: string; name: string; contact_person: string; stage: string
  last_contacted: string | null; notes: string; created_at: string
  crm_requests: CrmRequest[]
}

export interface CrmRequest {
  id: string; lead_id: string; text: string; date_added: string
  date_done: string | null; done: boolean; created_at: string
}

export interface HealthCheck {
  ok: boolean; anyWarning?: boolean
  checks: { name: string; ok: boolean; warning?: boolean; detail: string; balance?: string }[]
}

export interface WalletInfo {
  balanceKobo: number; balanceNaira: number
  transactions: { id: number; type: string; amount_kobo: number; description: string; created_at: string }[]
}

export interface HospitalUsageStat {
  id: number; name: string; active: boolean; createdAt: string | null; daysSince: number
  totalPatients: number
  currentMonth: { label: string; daysElapsed: number; patients: number; emails: number; sms: number; avgPatientsDay: number; avgEmailsDay: number; avgSmsDay: number }
  history: { label: string; patients: number; emails: number; sms: number; avgPatientsDay: number; avgEmailsDay: number; avgSmsDay: number }[]
}

export interface Announcement {
  id: number; hospitalId: number | null; hospitalName: string | null
  title: string; message: string; type: 'info' | 'warning' | 'update'
  published: boolean; createdAt: string; publishedAt: string | null
  expiresAt: string | null; targetModule: string | null
}

export interface SystemFeedbackEntry {
  id: number; hospital_id: number; hospital_name: string
  user_role: string; rating: number; comment: string | null; created_at: string
}

export interface PatientAnalyticsData {
  totalPatients: number; newToday: number; newThisWeek: number
  activeToday: number; activeThisWeek: number
  pageViewsToday: number; pageViewsWeek: number
  topPages: { route: string; views: number }[]
  dailySignups: { date: string; count: number }[]
  recentFeedback: PatientFeedbackItem[]
}

export interface PatientFeedbackItem {
  id: number; username: string | null; rating: number | null
  category: string; message: string; created_at: string
}

export interface RagDocument {
  id: number; title: string; category: string; source: string | null
  chunk_index: number; content: string; created_at: string
}

export interface DemoSession {
  id: number; session_id: string; first_name: string; last_name: string
  email: string | null; phone: string; stage_reached: string | null
  completed: boolean; started_at: string; completed_at: string | null
}

// ── API ──────────────────────────────────────────────────────────────────────

export const patientApi = {
  login:          (username: string, password: string) =>
    post<{ token: string }>('/super-admin/auth/login', { username, password }),
  logout:         () => post<void>('/super-admin/auth/logout', {}),

  listHospitals:  () => get<Hospital[]>('/super-admin/hospitals'),
  getHospital:    (id: number) => get<Hospital>(`/super-admin/hospitals/${id}`),
  createHospital: (data: { name: string; username: string; subscriptionStatus?: string }) =>
    post<Hospital>('/super-admin/hospitals', data),
  updateHospital: (id: number, data: Partial<Hospital>) =>
    patch<Hospital>(`/super-admin/hospitals/${id}`, data),
  regeneratePassword: (id: number) =>
    post<{ newPassword: string; hospital: Hospital }>(`/super-admin/hospitals/${id}/regenerate-password`, {}),

  getSettings:    (id: number) => get<HospitalSettings>(`/super-admin/hospitals/${id}/settings`),
  updateSettings: (id: number, data: Partial<HospitalSettings>) =>
    put<HospitalSettings>(`/super-admin/hospitals/${id}/settings`, data),
  getModules:     (id: number) => get<HospitalModules>(`/super-admin/hospitals/${id}/modules`),
  updateModules:  (id: number, data: Partial<HospitalModules>) =>
    put<HospitalModules>(`/super-admin/hospitals/${id}/modules`, data),

  getAutomationLog: (params?: { status?: string; hospitalId?: number }) => {
    const qs = new URLSearchParams()
    if (params?.status) qs.set('status', params.status)
    if (params?.hospitalId) qs.set('hospitalId', String(params.hospitalId))
    return get<AutomationLog[]>(`/super-admin/automation-log${qs.size ? '?' + qs.toString() : ''}`)
  },
  retryAutomation: (id: number) =>
    post<{ ok: boolean }>(`/super-admin/automation-log/${id}/retry`, {}),

  getHealth: () => get<HealthCheck>('/super-admin/health'),

  listSupportTickets: () => get<SupportTicket[]>('/super-admin/support/tickets'),
  getSupportThread:   (id: number) =>
    get<{ ticket: object; messages: { id: number; sender: string; message: string; created_at: string }[] }>(
      `/super-admin/support/tickets/${id}/messages`),
  replyToTicket: (id: number, message: string) =>
    patch<{ ok: boolean }>(`/super-admin/support/tickets/${id}/reply`, { message }),

  listCrmLeads: () => get<CrmLead[]>('/super-admin/crm/leads'),
  createCrmLead: (data: { name: string; contact_person?: string; stage?: string; notes?: string }) =>
    post<CrmLead>('/super-admin/crm/leads', data),
  updateCrmLead: (id: string, data: Partial<CrmLead>) =>
    patch<CrmLead>(`/super-admin/crm/leads/${id}`, data),
  deleteCrmLead: (id: string) => del<void>(`/super-admin/crm/leads/${id}`),

  getHospitalWallet: (id: number) => get<WalletInfo>(`/super-admin/hospitals/${id}/wallet`),
  creditHospitalWallet: (id: number, amountNaira: number, description: string) =>
    post<{ ok: boolean; balanceNaira: number }>(`/super-admin/hospitals/${id}/wallet/credit`, { amountNaira, description }),

  changePassword: (currentPassword: string, newPassword: string) =>
    post<{ ok: boolean }>('/super-admin/change-password', { currentPassword, newPassword }),

  // Usage
  usageStats: () => get<{ stats: HospitalUsageStat[] }>('/super-admin/usage-stats'),

  // Announcements
  listAnnouncements: () => get<Announcement[]>('/super-admin/announcements'),
  createAnnouncement: (data: { title: string; message: string; type: string; hospitalId?: number | null; expiresAt?: string | null; publish?: boolean; targetModule?: string | null }) =>
    post<Announcement>('/super-admin/announcements', data),
  updateAnnouncement: (id: number, data: { title?: string; message?: string; type?: string; expiresAt?: string | null; hospitalId?: number | null; targetModule?: string | null }) =>
    patch<Announcement>(`/super-admin/announcements/${id}`, data),
  publishAnnouncement: (id: number) => patch<void>(`/super-admin/announcements/${id}/publish`, {}),
  deleteAnnouncement: (id: number) => del<void>(`/super-admin/announcements/${id}`),
  autoDraftAnnouncements: () => {
    const token = getToken()
    return fetch(`${PATIENT_API}/api/super-admin/announcements/auto-draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { 'x-super-admin-token': token } : {}) },
    }).then(async r => {
      if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error((e as { error?: string }).error ?? 'Failed') }
    })
  },

  // System feedback
  listSystemFeedback: () => get<SystemFeedbackEntry[]>('/system-feedback'),
  broadcastFeedback: () => post<void>('/system-feedback/broadcast', {}),

  // Patient analytics
  getPatientAnalytics: () => get<PatientAnalyticsData>('/super-admin/patient-analytics'),
  listPatientFeedback: (params?: { page?: number; category?: string }) => {
    const qs = new URLSearchParams()
    if (params?.page) qs.set('page', String(params.page))
    if (params?.category) qs.set('category', params.category)
    return get<{ items: PatientFeedbackItem[]; total: number; page: number; limit: number }>(`/super-admin/patient-feedback${qs.size ? '?' + qs.toString() : ''}`)
  },

  // Knowledge base
  listKnowledgeDocs: (params?: { category?: string; search?: string }) => {
    const qs = new URLSearchParams()
    if (params?.category && params.category !== 'all') qs.set('category', params.category)
    if (params?.search) qs.set('search', params.search)
    return get<{ documents: RagDocument[]; total: number }>(`/super-admin/knowledge-base${qs.size ? '?' + qs.toString() : ''}`)
  },
  uploadKnowledgeDoc: (data: { title: string; category: string; source?: string; content: string }) =>
    post<{ ok: boolean; chunks: number; title: string }>('/super-admin/knowledge-base', data),
  deleteKnowledgeDoc: (id: number) => del<void>(`/super-admin/knowledge-base/${id}`),
  testKnowledgeQuery: (query: string, category: string) =>
    post<{ query: string; category: string; results: string[] }>('/super-admin/knowledge-base/test', { query, category }),

  // Demo sessions
  listDemoSessions: () => get<DemoSession[]>('/demo/sessions'),

  // Config
  getConfig: () => get<{ eraPatientUrl: string }>('/super-admin/config'),

  // Test comms
  testSms: (to: string, senderId?: string) =>
    post<{ ok: boolean; detail: string }>('/super-admin/test-sms', { to, senderId }),
  testEmail: (to: string) =>
    post<{ ok: boolean; from?: string; error?: string }>('/super-admin/test-email', { to }),
}

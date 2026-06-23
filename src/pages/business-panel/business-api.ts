import { COMMS_API } from '../../lib/config'

export const getBizToken  = () => localStorage.getItem('era_biz_token')
export const setBizToken  = (t: string) => localStorage.setItem('era_biz_token', t)
export const clearBizToken = () => localStorage.removeItem('era_biz_token')

async function req<T>(path: string, opts: RequestInit = {}): Promise<T> {
  if (!COMMS_API) throw new Error('ERA Comms API is not configured.')
  const token = getBizToken()
  const res = await fetch(`${COMMS_API}/v1/business${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers,
    },
  })
  const ct = res.headers.get('content-type') ?? ''
  if (!res.ok) {
    if (res.status === 401) { clearBizToken(); throw new Error('Session expired. Please sign in again.') }
    const err = ct.includes('application/json')
      ? await res.json().catch(() => ({ error: res.statusText }))
      : { error: `${res.status} ${res.statusText}` }
    throw new Error((err as { message?: string; error?: string }).message ?? (err as { error?: string }).error ?? res.statusText)
  }
  if (res.status === 204) return undefined as T
  return res.json() as T
}

const get   = <T>(p: string)              => req<T>(p, { cache: 'no-store' })
const post  = <T>(p: string, b: unknown)  => req<T>(p, { method: 'POST',  body: JSON.stringify(b) })
const patch = <T>(p: string, b: unknown)  => req<T>(p, { method: 'PATCH', body: JSON.stringify(b) })
const del   = <T>(p: string)              => req<T>(p, { method: 'DELETE' })

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ModuleConfig {
  knowledgeBase:     boolean
  autoGreet:         boolean
  businessHours:     boolean
  scenarios:         boolean
  humanHandoff:      boolean
  voiceNotes:        boolean
  conversationInbox: boolean
  analytics:         boolean
  emailCampaigns:    boolean
}

export interface BizProfile {
  id: string; name: string; slug: string
  contactEmail: string; contactPhone: string | null
  planName: string; active: boolean
  usage: { monthlyMessages: number; sessionsActive: number; monthlyLimit: number | null }
  moduleConfig: ModuleConfig
}

export interface KnowledgeBaseEntry {
  id: string; section: string; title: string; content: string; updatedAt: string
}

export interface DayHours {
  open: boolean; from: string; to: string
}

export interface BusinessHours {
  monday: DayHours; tuesday: DayHours; wednesday: DayHours
  thursday: DayHours; friday: DayHours; saturday: DayHours; sunday: DayHours
}

export interface Scenario {
  id: string; name: string; templateKey: string
  trigger: string; active: boolean; priority: number
  config: Record<string, string>; createdAt: string
}

export interface UsageRecord {
  messagesIn: number; messagesOut: number; voiceNotesCount: number
  scenariosTriggered: number; handoffsCount: number
  periodStart: string; periodEnd: string
  monthlyLimit: number | null
}

export interface HandoffConfig {
  triggerOnRequest:   boolean
  triggerOnConfusion: boolean
  triggerOnComplaint: boolean
  customKeywords:     string
  urgentTopics:       string
  alertWhatsApp:      string
  alertEmail:         string
  waitMessage:        string
  maxWaitMinutes:     number | null
  onNoResponse:       'ai_retakes' | 'keep_waiting' | 'follow_up'
}

export interface Conversation {
  id: string; customerPhone: string
  status: 'ai_active' | 'human' | 'resolved'
  lastMessage: string; lastMessageAt: string; unreadCount: number
}

export interface ConversationMessage {
  id: string; role: 'customer' | 'ai' | 'human'
  content: string; createdAt: string; voiceNote?: boolean
}

export interface BizAnalytics {
  totalMessages: number; aiHandled: number; humanHandoffs: number
  avgResponseSeconds: number; voiceNotesCount: number; topScenario: string | null
  messagesByHour: number[]
  topQuestions: { question: string; count: number }[]
  handoffReasons: { reason: string; count: number }[]
  usage: { used: number; limit: number | null }
}

export interface VoiceStatus {
  available: boolean; transcriptionsToday: number
}

export interface VoiceConfig {
  responseMode:       'voice' | 'text'
  responseVoice:      'natural' | 'formal' | 'friendly'
  showTranscription:  boolean
  languageHint:       string
}

export interface NotificationPrefs {
  whatsappHandoffAlerts: boolean
  emailDailyDigest:      boolean
}

export interface EmailDomain {
  id: string; domain: string; verified: boolean
}

export interface EmailTemplate {
  id: string; name: string; subject: string; htmlBody: string; updatedAt: string
}

export interface ContactList {
  id: string; name: string; contactCount: number; createdAt: string
}

export interface Contact {
  id: string; email: string; firstName: string | null; lastName: string | null; createdAt: string
}

export interface Campaign {
  id: string; name: string; status: string
  templateName: string; listName: string
  totalRecipients: number; totalSent: number; totalDelivered: number
  totalClicked: number; totalBounced: number; deliveryRate: number
  scheduledAt: string | null; startedAt: string | null; completedAt: string | null
  createdAt: string
}

// ── API ───────────────────────────────────────────────────────────────────────

export const bizApi = {
  login: (email: string, password: string) =>
    post<{ token: string; profile: BizProfile }>('/auth/login', { email, password }),

  getProfile:         () => get<BizProfile>('/me'),
  updateProfile:      (data: Partial<Pick<BizProfile, 'contactEmail' | 'contactPhone'>>) => patch<BizProfile>('/me', data),
  updateModuleConfig: (config: Partial<ModuleConfig>) => patch<BizProfile>('/modules', config),

  getKnowledgeBase: () => get<KnowledgeBaseEntry[]>('/knowledge-base'),
  upsertKBEntry:    (data: { section: string; title: string; content: string; id?: string }) =>
    post<KnowledgeBaseEntry>('/knowledge-base', data),
  deleteKBEntry:    (id: string) => del<void>(`/knowledge-base/${id}`),

  getBusinessHours:    () => get<BusinessHours>('/hours'),
  updateBusinessHours: (hours: BusinessHours) => patch<BusinessHours>('/hours', hours),

  getAutoGreet:    () => get<{ message: string }>('/auto-greet'),
  updateAutoGreet: (message: string) => patch<{ message: string }>('/auto-greet', { message }),

  listScenarios:   () => get<Scenario[]>('/scenarios'),
  createScenario:  (data: Omit<Scenario, 'id' | 'createdAt'>) => post<Scenario>('/scenarios', data),
  updateScenario:  (id: string, data: Partial<Omit<Scenario, 'id' | 'createdAt'>>) =>
    patch<Scenario>(`/scenarios/${id}`, data),
  deleteScenario:  (id: string) => del<void>(`/scenarios/${id}`),

  getHandoff:    () => get<HandoffConfig>('/handoff'),
  updateHandoff: (data: HandoffConfig) => patch<HandoffConfig>('/handoff', data),

  listConversations: () => get<Conversation[]>('/conversations'),
  listMessages:      (id: string) => get<ConversationMessage[]>(`/conversations/${id}/messages`),
  takeOver:          (id: string) => post<void>(`/conversations/${id}/take-over`, {}),
  handBack:          (id: string) => post<void>(`/conversations/${id}/hand-back`, {}),
  sendMessage:       (id: string, content: string) => post<ConversationMessage>(`/conversations/${id}/messages`, { content }),

  getVoiceStatus: () => get<VoiceStatus>('/voice-status'),
  getVoiceConfig: () => get<VoiceConfig>('/voice-config'),
  updateVoiceConfig: (data: VoiceConfig) => patch<VoiceConfig>('/voice-config', data),

  getAnalytics: (period: string) => get<BizAnalytics>(`/analytics?period=${encodeURIComponent(period)}`),

  getNotifications:    () => get<NotificationPrefs>('/notifications'),
  updateNotifications: (data: NotificationPrefs) => patch<NotificationPrefs>('/notifications', data),
  changePassword: (current: string, next: string) =>
    post<void>('/auth/change-password', { currentPassword: current, newPassword: next }),

  getUsage: () => get<UsageRecord>('/usage'),

  // Email
  getEmailDomains:   () => get<EmailDomain[]>('/email/domains'),
  listTemplates:     () => get<EmailTemplate[]>('/email/templates'),
  createTemplate:    (d: { name: string; subject: string; htmlBody: string }) => post<EmailTemplate>('/email/templates', d),
  updateTemplate:    (id: string, d: Partial<{ name: string; subject: string; htmlBody: string }>) => req<void>(`/email/templates/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deleteTemplate:    (id: string) => del<void>(`/email/templates/${id}`),

  listContactLists:  () => get<ContactList[]>('/email/contacts/lists'),
  createContactList: (name: string) => post<ContactList>('/email/contacts/lists', { name }),
  deleteContactList: (id: string) => del<void>(`/email/contacts/lists/${id}`),
  getContacts:       (listId: string) => get<Contact[]>(`/email/contacts/lists/${listId}`),
  importContacts:    (listId: string, contacts: { email: string; firstName?: string; lastName?: string }[]) =>
    post<{ imported: number }>(`/email/contacts/lists/${listId}/import`, contacts),
  deleteContact:     (contactId: string) => del<void>(`/email/contacts/${contactId}`),

  listCampaigns: () => get<Campaign[]>('/email/campaigns'),
  createCampaign: (d: { name: string; templateId: string; listId: string; domainId: string; fromName: string; fromEmail: string; scheduledAt?: string }) =>
    post<Campaign>('/email/campaigns', d),
  getCampaign:    (id: string) => get<Campaign>(`/email/campaigns/${id}`),
  sendCampaign:   (id: string) => post<{ launched: boolean; queued: number }>(`/email/campaigns/${id}/send`, {}),
  cancelCampaign: (id: string) => post<{ cancelled: boolean }>(`/email/campaigns/${id}/cancel`, {}),
  deleteCampaign: (id: string) => del<void>(`/email/campaigns/${id}`),
}

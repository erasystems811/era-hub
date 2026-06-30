import { getStructureApi, getStructureSecret } from './config'

async function req<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const BASE = getStructureApi()
  if (!BASE) throw new Error('ERA Structure API is not configured. Add the URL in Settings.')
  const res = await fetch(`${BASE}/api/admin${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      'X-Operator-Secret': getStructureSecret(),
      ...opts.headers,
    },
  })
  const contentType = res.headers.get('content-type') ?? ''
  if (!res.ok) {
    if (!contentType.includes('application/json')) {
      throw new Error(`Could not reach ERA Structure (${res.status}). Check the API URL in Settings.`)
    }
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((err as { message?: string; error?: string }).message ?? (err as { error?: string }).error ?? res.statusText)
  }
  if (res.status === 204) return undefined as T
  if (!contentType.includes('application/json')) {
    throw new Error(`ERA Structure returned non-JSON (status ${res.status}, type: ${contentType || 'none'})`)
  }
  return res.json() as T
}

const get    = <T>(p: string) => req<T>(p, { cache: 'no-store' })
const post   = <T>(p: string, b: unknown) => req<T>(p, { method: 'POST', body: JSON.stringify(b) })
const patch  = <T>(p: string, b: unknown) => req<T>(p, { method: 'PATCH', body: JSON.stringify(b) })
const del    = <T>(p: string, b?: unknown) => req<T>(p, { method: 'DELETE', ...(b ? { body: JSON.stringify(b) } : {}) })

// ── Types ────────────────────────────────────────────────────────────────────

export interface BusinessType {
  id: string
  name: string
}

export interface Business {
  id: string
  name: string
  owner_name: string
  owner_phone: string | null
  owner_email: string | null
  business_number: string | null
  business_type_id: string
  stage: 'assessment' | 'guide' | 'maintenance'
  is_locked: boolean
  locked_at: string | null
  last_active_at: string | null
  created_at: string
  business_types: { name: string } | null
}

export interface MonitoredBusiness extends Business {
  docHealth: number
  checklistRate: number
  overdueDocs: number
}

export interface Question {
  id: string
  business_type_id: string
  layer: 1 | 2
  block: string
  question_text: string
  input_type: 'short-text' | 'number' | 'dropdown' | 'yes-no' | 'multi-select' | 'voice-note'
  options: string[] | null
  order_index: number
  is_active: boolean
}

export interface Report {
  id: string
  business_id: string
  status: 'pending' | 'released'
  generated_at: string
  released_at: string | null
  admin_notes: string | null
  generated_content: unknown
  businesses: { name: string; owner_name: string; business_types: { name: string } | null } | null
}

export interface Document {
  id: string
  business_id: string
  title: string
  category: string
  next_review_due: string | null
  last_reviewed_at: string | null
  google_doc_url: string | null
  assigned_role: string | null
  created_at: string
  businesses: { name: string } | null
}

export interface Payment {
  id: string
  business_id: string
  amount: number
  currency: string
  status: 'pending' | 'successful' | 'failed'
  flutterwave_ref: string | null
  created_at: string
  businesses: { name: string; owner_name: string } | null
}

export interface AdminNote {
  id: string
  business_id: string
  note: string
  created_by: string
  created_at: string
}

// ── API ──────────────────────────────────────────────────────────────────────

export const structureApi = {
  // Business Types
  listBusinessTypes: () => get<BusinessType[]>('/business-types'),
  createBusinessType: (name: string) => post<BusinessType>('/business-types', { name }),

  // Accounts / Businesses
  listBusinesses: () => get<Business[]>('/accounts'),
  createBusiness: (data: {
    name: string; owner_name: string; owner_phone?: string
    owner_email: string; business_type_id: string; password: string
  }) => post<{ success: boolean; business: Business }>('/accounts', data),
  updateBusiness: (data: {
    id: string; name?: string; owner_name?: string; owner_phone?: string; owner_email?: string
    business_type_id?: string; stage?: string; is_locked?: boolean; new_password?: string
  }) => patch<{ success: boolean; business: Business }>('/accounts', data),
  deleteBusiness: (id: string) => del<{ success: boolean }>('/accounts', { id }),

  // Monitoring
  monitoring: () => get<MonitoredBusiness[]>('/monitoring'),

  // Questions
  listQuestions: (businessTypeId: string, layer?: 1 | 2) =>
    get<Question[]>(`/questions?businessTypeId=${businessTypeId}${layer ? `&layer=${layer}` : ''}`),
  createQuestion: (data: Omit<Question, 'id' | 'is_active'>) => post<Question>('/questions', data),
  updateQuestion: (id: string, data: Partial<Question>) => patch<Question>('/questions', { id, ...data }),
  deleteQuestion: (id: string) => del<{ success: boolean }>('/questions', { id }),
  seedQuestions: (business_type_id: string, layer?: 1 | 2) => post<{ success: boolean; inserted: number }>('/questions/seed', { business_type_id, layer }),
  copyQuestionsToAll: (source_business_type_id: string) => post<{ success: boolean; copied: number }>('/questions/copy', { source_business_type_id }),

  // Reports
  listReports: (status: 'pending' | 'released' = 'pending') => get<Report[]>(`/reports?status=${status}`),
  releaseReport: (report_id: string, admin_notes: string) => post<{ success: boolean }>('/reports', { report_id, admin_notes }),
  getReportResponses: (business_id: string) => get<{ layer1: Record<string, unknown>; layer2: Record<string, unknown>; questions: { id: string; block: string; question_text: string; layer: number }[]; staff: { name: string; role: string }[] }>(`/reports/responses?business_id=${business_id}`),
  generateReportAnalysis: (business_id: string) => post<{ report: Report }>('/reports/generate', { business_id }),
  updateReportContent: (business_id: string, generated_content: unknown) => patch<{ success: boolean }>('/reports', { business_id, generated_content }),
  regenerateSection: (business_id: string, section: string, instruction: string) =>
    post<{ section: string; content: unknown }>('/reports/regenerate-section', { business_id, section, instruction }),

  // Output (documents)
  listOutput: (businessId?: string) =>
    get<Document[]>(`/output${businessId ? `?businessId=${businessId}` : ''}`),

  // Payments
  listPayments: () => get<Payment[]>('/payments'),

  // Admin Notes
  listNotes: (businessId: string) => get<AdminNote[]>(`/notes?businessId=${businessId}`),
  addNote: (business_id: string, note: string) => post<{ success: boolean }>('/notes', { business_id, note }),
}

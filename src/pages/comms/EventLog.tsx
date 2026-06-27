import { useEffect, useState, useCallback } from 'react'
import {
  Search, Download, RefreshCw, X, ChevronLeft, ChevronRight,
  ChevronDown, ChevronUp, Wifi, WifiOff, MessageCircle, MessageSquare,
  Send, Bot, UserCheck, Building2, Key, ShieldAlert,
  Zap, PhoneCall, FileText, AlertTriangle, CheckCircle2, Info, Radio,
  Trash2, Plus, Settings, MailPlus, LogIn,
} from 'lucide-react'
import { eventsApi, PlatformEvent, AuditEntry, EventSeverity } from '../../lib/events-api'
import { MonitoringTabs } from '../../components/MonitoringTabs'

const PAGE_SIZE = 50

// ── Unified activity item ─────────────────────────────────────────────────────

type ActivityKind = 'platform' | 'audit'

interface ActivityItem {
  id:           string
  kind:         ActivityKind
  ts:           string   // ISO timestamp
  businessName: string | null
  icon:         React.ReactNode
  iconBg:       string
  label:        string
  detail:       string
  severity:     EventSeverity
  raw:          PlatformEvent | AuditEntry
}

// ── Human-readable event labels + icons ──────────────────────────────────────

const ICON_CLS = 'w-4 h-4'

function platformLabel(e: PlatformEvent): { label: string; icon: React.ReactNode; iconBg: string } {
  const t = e.eventType as string
  const meta = e.metadata ?? {}

  if (t === 'session_created')      return { label: 'New session added',              icon: <Plus className={ICON_CLS} />,         iconBg: 'bg-teal-500/15 text-teal-400' }
  if (t === 'session_deleted')      return { label: 'Session removed',                icon: <Trash2 className={ICON_CLS} />,       iconBg: 'bg-red-500/15 text-red-400' }
  if (t === 'session_connected')    return { label: 'WhatsApp connected',             icon: <Wifi className={ICON_CLS} />,         iconBg: 'bg-green-500/15 text-green-400' }
  if (t === 'session_disconnected') return { label: 'WhatsApp disconnected',          icon: <WifiOff className={ICON_CLS} />,      iconBg: 'bg-amber-500/15 text-amber-400' }
  if (t === 'session_reconnected')  return { label: 'WhatsApp reconnected',           icon: <Wifi className={ICON_CLS} />,         iconBg: 'bg-green-500/15 text-green-400' }
  if (t === 'session_otp_sent')     return { label: 'Pairing code sent',              icon: <LogIn className={ICON_CLS} />,        iconBg: 'bg-blue-500/15 text-blue-400' }
  if (t === 'session_otp_verified') return { label: 'Session paired successfully',   icon: <CheckCircle2 className={ICON_CLS} />, iconBg: 'bg-green-500/15 text-green-400' }

  if (t === 'message_sent')     {
    const isAI = meta['aiGenerated'] === true
    return isAI
      ? { label: 'Agent sent message',   icon: <Bot className={ICON_CLS} />,             iconBg: 'bg-violet-500/15 text-violet-400' }
      : { label: 'Message sent',         icon: <Send className={ICON_CLS} />,            iconBg: 'bg-blue-500/15 text-blue-400' }
  }
  if (t === 'message_received') return { label: 'Message received',               icon: <MessageCircle className={ICON_CLS} />,  iconBg: 'bg-white/08 text-muted-foreground' }
  if (t === 'message_failed')   return { label: 'Message failed to send',         icon: <AlertTriangle className={ICON_CLS} />,  iconBg: 'bg-red-500/15 text-red-400' }
  if (t === 'message_queued')   return { label: 'Message queued',                 icon: <MessageSquare className={ICON_CLS} />,  iconBg: 'bg-white/08 text-muted-foreground' }

  if (t === 'broadcast_completed')       return { label: 'Broadcast finished',          icon: <Radio className={ICON_CLS} />,          iconBg: 'bg-primary/15 text-primary' }
  if (t === 'broadcast_message_failed')  return { label: 'Broadcast message failed',    icon: <AlertTriangle className={ICON_CLS} />,  iconBg: 'bg-red-500/15 text-red-400' }

  if (t === 'automation_triggered')      return { label: 'Automation triggered',         icon: <Zap className={ICON_CLS} />,            iconBg: 'bg-amber-500/15 text-amber-400' }
  if (t === 'automation_message_sent')   return { label: 'Automation sent message',      icon: <Zap className={ICON_CLS} />,            iconBg: 'bg-amber-500/15 text-amber-400' }
  if (t === 'automation_message_failed') return { label: 'Automation message failed',    icon: <AlertTriangle className={ICON_CLS} />,  iconBg: 'bg-red-500/15 text-red-400' }

  if (t === 'scenario_triggered')    return { label: 'Agent scenario triggered',     icon: <Bot className={ICON_CLS} />,            iconBg: 'bg-violet-500/15 text-violet-400' }
  if (t === 'ai_response_generated') return { label: 'Agent generated response',    icon: <Bot className={ICON_CLS} />,            iconBg: 'bg-violet-500/15 text-violet-400' }
  if (t === 'ai_error')              return { label: 'Agent error',                  icon: <AlertTriangle className={ICON_CLS} />,  iconBg: 'bg-red-500/15 text-red-400' }
  if (t === 'kb_queried')            return { label: 'Knowledge base searched',      icon: <Search className={ICON_CLS} />,         iconBg: 'bg-violet-500/15 text-violet-400' }

  if (t === 'handoff_triggered')  return { label: 'Handed off to human agent',  icon: <UserCheck className={ICON_CLS} />,   iconBg: 'bg-orange-500/15 text-orange-400' }
  if (t === 'human_took_over')    return { label: 'Human agent took over',       icon: <UserCheck className={ICON_CLS} />,   iconBg: 'bg-orange-500/15 text-orange-400' }
  if (t === 'handoff_resolved')   return { label: 'Handoff resolved',            icon: <CheckCircle2 className={ICON_CLS} />, iconBg: 'bg-green-500/15 text-green-400' }
  if (t === 'returned_to_ai')     return { label: 'Returned to agent',           icon: <Bot className={ICON_CLS} />,         iconBg: 'bg-violet-500/15 text-violet-400' }

  if (t === 'business_created')    return { label: 'Business registered',          icon: <Building2 className={ICON_CLS} />,     iconBg: 'bg-teal-500/15 text-teal-400' }
  if (t === 'business_updated')    return { label: 'Business updated',             icon: <Settings className={ICON_CLS} />,      iconBg: 'bg-white/08 text-muted-foreground' }
  if (t === 'business_suspended')  return { label: 'Business suspended',           icon: <ShieldAlert className={ICON_CLS} />,   iconBg: 'bg-red-500/15 text-red-400' }
  if (t === 'business_unsuspended')return { label: 'Business unsuspended',         icon: <CheckCircle2 className={ICON_CLS} />, iconBg: 'bg-green-500/15 text-green-400' }
  if (t === 'business_deleted')    return { label: 'Business deleted',             icon: <Trash2 className={ICON_CLS} />,        iconBg: 'bg-red-500/15 text-red-400' }
  if (t === 'plan_changed')        return { label: 'Business plan changed',        icon: <Settings className={ICON_CLS} />,      iconBg: 'bg-white/08 text-muted-foreground' }
  if (t === 'plan_created')        return { label: 'Plan created',                 icon: <Plus className={ICON_CLS} />,          iconBg: 'bg-teal-500/15 text-teal-400' }
  if (t === 'plan_updated')        return { label: 'Plan updated',                 icon: <Settings className={ICON_CLS} />,      iconBg: 'bg-white/08 text-muted-foreground' }
  if (t === 'plan_deleted')        return { label: 'Plan deleted',                 icon: <Trash2 className={ICON_CLS} />,        iconBg: 'bg-red-500/15 text-red-400' }

  if (t === 'api_key_generated')  return { label: 'API key generated',            icon: <Key className={ICON_CLS} />,   iconBg: 'bg-blue-500/15 text-blue-400' }
  if (t === 'api_key_revoked')    return { label: 'API key revoked',              icon: <Key className={ICON_CLS} />,   iconBg: 'bg-red-500/15 text-red-400' }
  if (t === 'api_key_expired')    return { label: 'API key expired',              icon: <Key className={ICON_CLS} />,   iconBg: 'bg-amber-500/15 text-amber-400' }

  if (t === 'request_submitted')  return { label: 'Upgrade request submitted',   icon: <MailPlus className={ICON_CLS} />,   iconBg: 'bg-blue-500/15 text-blue-400' }
  if (t === 'request_approved')   return { label: 'Upgrade request approved',    icon: <CheckCircle2 className={ICON_CLS} />, iconBg: 'bg-green-500/15 text-green-400' }
  if (t === 'request_rejected')   return { label: 'Upgrade request rejected',    icon: <X className={ICON_CLS} />,         iconBg: 'bg-red-500/15 text-red-400' }

  if (t === 'voice_note_received')   return { label: 'Voice note received',       icon: <PhoneCall className={ICON_CLS} />, iconBg: 'bg-blue-500/15 text-blue-400' }
  if (t === 'transcription_done')    return { label: 'Voice note transcribed',    icon: <FileText className={ICON_CLS} />,  iconBg: 'bg-blue-500/15 text-blue-400' }
  if (t === 'transcription_failed')  return { label: 'Transcription failed',      icon: <AlertTriangle className={ICON_CLS} />, iconBg: 'bg-red-500/15 text-red-400' }

  if (t === 'moderation_triggered')  return { label: 'Moderation rule triggered', icon: <ShieldAlert className={ICON_CLS} />, iconBg: 'bg-amber-500/15 text-amber-400' }
  if (t === 'limit_reached')         return { label: 'Plan limit reached',         icon: <AlertTriangle className={ICON_CLS} />, iconBg: 'bg-amber-500/15 text-amber-400' }
  if (t === 'payment_received')      return { label: 'Payment received',           icon: <CheckCircle2 className={ICON_CLS} />, iconBg: 'bg-green-500/15 text-green-400' }
  if (t === 'payment_failed')        return { label: 'Payment failed',             icon: <AlertTriangle className={ICON_CLS} />, iconBg: 'bg-red-500/15 text-red-400' }

  // Fallback: humanise the raw type
  const readable = t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  return { label: readable, icon: <Info className={ICON_CLS} />, iconBg: 'bg-white/08 text-muted-foreground' }
}

function auditLabel(e: AuditEntry): { label: string; icon: React.ReactNode; iconBg: string } {
  const a = e.action

  if (a === 'session.created')         return { label: 'Session added',                   icon: <Plus className={ICON_CLS} />,           iconBg: 'bg-teal-500/15 text-teal-400' }
  if (a === 'session.deleted')         return { label: 'Session removed',                 icon: <Trash2 className={ICON_CLS} />,         iconBg: 'bg-red-500/15 text-red-400' }
  if (a === 'session.unban')           return { label: 'Session reset / unlocked',        icon: <CheckCircle2 className={ICON_CLS} />,   iconBg: 'bg-green-500/15 text-green-400' }

  if (a === 'broadcast.created')       return { label: 'Broadcast created',               icon: <Radio className={ICON_CLS} />,          iconBg: 'bg-primary/15 text-primary' }
  if (a === 'broadcast.sent')          return { label: 'Broadcast queued for delivery',   icon: <Radio className={ICON_CLS} />,          iconBg: 'bg-primary/15 text-primary' }
  if (a === 'broadcast.cancelled')     return { label: 'Broadcast cancelled',             icon: <X className={ICON_CLS} />,              iconBg: 'bg-red-500/15 text-red-400' }
  if (a === 'broadcast.deleted')       return { label: 'Broadcast deleted',               icon: <Trash2 className={ICON_CLS} />,         iconBg: 'bg-red-500/15 text-red-400' }
  if (a === 'broadcast.duplicated')    return { label: 'Broadcast duplicated',            icon: <Radio className={ICON_CLS} />,          iconBg: 'bg-primary/15 text-primary' }
  if (a === 'broadcast.edited')        return { label: 'Broadcast edited',                icon: <Radio className={ICON_CLS} />,          iconBg: 'bg-primary/15 text-primary' }

  if (a === 'message.test_sent')       return { label: 'Test message sent by operator',   icon: <Send className={ICON_CLS} />,           iconBg: 'bg-blue-500/15 text-blue-400' }

  if (a === 'client.created')          return { label: 'Business registered',             icon: <Building2 className={ICON_CLS} />,      iconBg: 'bg-teal-500/15 text-teal-400' }
  if (a === 'client.deleted')          return { label: 'Business deleted',                icon: <Trash2 className={ICON_CLS} />,         iconBg: 'bg-red-500/15 text-red-400' }
  if (a === 'client.suspended')        return { label: 'Business suspended',              icon: <ShieldAlert className={ICON_CLS} />,    iconBg: 'bg-red-500/15 text-red-400' }
  if (a === 'client.unsuspended')      return { label: 'Business unsuspended',            icon: <CheckCircle2 className={ICON_CLS} />,   iconBg: 'bg-green-500/15 text-green-400' }
  if (a === 'client.plan_changed')     return { label: 'Business plan changed',           icon: <Settings className={ICON_CLS} />,       iconBg: 'bg-white/08 text-muted-foreground' }
  if (a === 'client.status_changed')   return { label: 'Business status changed',         icon: <Settings className={ICON_CLS} />,       iconBg: 'bg-white/08 text-muted-foreground' }
  if (a === 'client.updated')          return { label: 'Business details updated',        icon: <Settings className={ICON_CLS} />,       iconBg: 'bg-white/08 text-muted-foreground' }

  if (a === 'plan.created')            return { label: 'New plan created',                icon: <Plus className={ICON_CLS} />,           iconBg: 'bg-teal-500/15 text-teal-400' }
  if (a === 'plan.updated')            return { label: 'Plan updated',                    icon: <Settings className={ICON_CLS} />,       iconBg: 'bg-white/08 text-muted-foreground' }
  if (a === 'plan.deleted')            return { label: 'Plan deleted',                    icon: <Trash2 className={ICON_CLS} />,         iconBg: 'bg-red-500/15 text-red-400' }

  if (a === 'api_key.created')         return { label: 'API key generated',               icon: <Key className={ICON_CLS} />,            iconBg: 'bg-blue-500/15 text-blue-400' }
  if (a === 'api_key.revoked')         return { label: 'API key revoked',                 icon: <Key className={ICON_CLS} />,            iconBg: 'bg-red-500/15 text-red-400' }
  if (a === 'api_key.viewed')          return { label: 'API key viewed',                  icon: <Key className={ICON_CLS} />,            iconBg: 'bg-white/08 text-muted-foreground' }

  if (a === 'automation.created')      return { label: 'Automation flow created',         icon: <Zap className={ICON_CLS} />,            iconBg: 'bg-amber-500/15 text-amber-400' }
  if (a === 'automation.updated')      return { label: 'Automation flow updated',         icon: <Zap className={ICON_CLS} />,            iconBg: 'bg-amber-500/15 text-amber-400' }
  if (a === 'automation.paused')       return { label: 'Automation flow paused',          icon: <Zap className={ICON_CLS} />,            iconBg: 'bg-white/08 text-muted-foreground' }
  if (a === 'automation.archived')     return { label: 'Automation flow archived',        icon: <Trash2 className={ICON_CLS} />,         iconBg: 'bg-white/08 text-muted-foreground' }
  if (a === 'automation.contact_enrolled') return { label: 'Contacts enrolled in automation', icon: <Zap className={ICON_CLS} />, iconBg: 'bg-amber-500/15 text-amber-400' }

  if (a === 'request.approved')        return { label: 'Upgrade request approved',        icon: <CheckCircle2 className={ICON_CLS} />,   iconBg: 'bg-green-500/15 text-green-400' }
  if (a === 'request.rejected')        return { label: 'Upgrade request rejected',        icon: <X className={ICON_CLS} />,              iconBg: 'bg-red-500/15 text-red-400' }

  if (a === 'moderation_rule.created') return { label: 'Moderation rule added',           icon: <ShieldAlert className={ICON_CLS} />,    iconBg: 'bg-amber-500/15 text-amber-400' }
  if (a === 'moderation_rule.deleted') return { label: 'Moderation rule removed',         icon: <ShieldAlert className={ICON_CLS} />,    iconBg: 'bg-white/08 text-muted-foreground' }

  const readable = a.replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  return { label: readable, icon: <Info className={ICON_CLS} />, iconBg: 'bg-white/08 text-muted-foreground' }
}

// ── Filter categories ─────────────────────────────────────────────────────────

type Category = 'all' | 'sessions' | 'messages' | 'broadcasts' | 'agent' | 'businesses' | 'keys' | 'errors'

const CATEGORY_LABELS: Record<Category, string> = {
  all:        'All activity',
  sessions:   'Sessions',
  messages:   'Messages',
  broadcasts: 'Broadcasts',
  agent:      'Agent',
  businesses: 'Businesses',
  keys:       'API Keys',
  errors:     'Errors & Failures',
}

function matchesCategory(item: ActivityItem, cat: Category): boolean {
  if (cat === 'all') return true
  const l = item.label.toLowerCase()
  const e = item.kind === 'platform' ? (item.raw as PlatformEvent).eventType as string
    : (item.raw as AuditEntry).action
  if (cat === 'sessions')   return e.includes('session')
  if (cat === 'messages')   return (e.includes('message') && !e.includes('broadcast')) || e === 'message.test_sent'
  if (cat === 'broadcasts') return e.includes('broadcast')
  if (cat === 'agent')      return e.includes('ai') || e.includes('scenario') || e.includes('kb_') || e.includes('handoff') || e.includes('human_took') || e.includes('returned_to') || e.includes('automation')
  if (cat === 'businesses') return e.includes('business') || e.includes('client') || e.includes('plan') || e.includes('request') || e.includes('moderation')
  if (cat === 'keys')       return e.includes('api_key')
  if (cat === 'errors')     return item.severity === 'critical' || item.severity === 'warning' || e.includes('failed') || e.includes('error')
  return true
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtTime(iso: string) {
  const d = new Date(iso)
  const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  return { date, time, full: `${date} ${time}` }
}

function exportCsv(items: ActivityItem[]) {
  const headers = ['Time', 'Business', 'Activity', 'Detail']
  const rows = items.map(i => [fmtTime(i.ts).full, i.businessName ?? 'System', i.label, i.detail])
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url
  a.download = `era-activity-${new Date().toISOString().slice(0, 10)}.csv`
  a.click(); URL.revokeObjectURL(url)
}

const INPUT = "px-3 py-2 rounded-xl bg-[hsl(262_20%_11%)] border border-white/[0.09] text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"

// ── Main component ────────────────────────────────────────────────────────────

export function EventLog() {
  const [items,    setItems]    = useState<ActivityItem[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)
  const [page,     setPage]     = useState(0)
  const [expanded, setExpanded] = useState<string | null>(null)

  const [search,   setSearch]   = useState('')
  const [category, setCategory] = useState<Category>('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate,   setToDate]   = useState('')

  const hasFilters = search || category !== 'all' || fromDate || toDate

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [events, audit] = await Promise.all([
        eventsApi.listEvents({ from: fromDate || undefined, to: toDate || undefined, limit: 500 }),
        eventsApi.listAudit({ from: fromDate || undefined, to: toDate || undefined, limit: 500 }),
      ])

      const platformItems: ActivityItem[] = (events ?? []).map(e => {
        const { label, icon, iconBg } = platformLabel(e)
        return {
          id:           `p-${e.id}`,
          kind:         'platform',
          ts:           e.createdAt,
          businessName: e.businessName ?? null,
          icon, iconBg, label,
          detail:       e.detail,
          severity:     e.severity,
          raw:          e,
        }
      })

      const auditItems: ActivityItem[] = (audit ?? []).map(e => {
        const { label, icon, iconBg } = auditLabel(e)
        const sev: EventSeverity =
          e.action.includes('deleted') || e.action.includes('suspended') || e.action.includes('revoked') ? 'warning'
          : 'info'
        return {
          id:           `a-${e.id}`,
          kind:         'audit',
          ts:           e.createdAt,
          businessName: null,
          icon, iconBg, label,
          detail:       e.detail,
          severity:     sev,
          raw:          e,
        }
      })

      const merged = [...platformItems, ...auditItems]
        .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())

      setItems(merged)
      setPage(0)
    } catch (e) {
      const msg = e instanceof Error ? e.message : ''
      if (msg.includes('404') || msg.toLowerCase().includes('not found')) setItems([])
      else setError(msg || 'Failed to load activity')
    } finally { setLoading(false) }
  }, [fromDate, toDate])

  useEffect(() => { void load() }, [load])

  const clearFilters = () => { setSearch(''); setCategory('all'); setFromDate(''); setToDate('') }

  const filtered = items.filter(item => {
    if (!matchesCategory(item, category)) return false
    if (search) {
      const q = search.toLowerCase()
      if (
        !item.label.toLowerCase().includes(q) &&
        !item.detail.toLowerCase().includes(q) &&
        !(item.businessName ?? '').toLowerCase().includes(q)
      ) return false
    }
    return true
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated  = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  // Group items by date for visual separation
  let lastDate = ''

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Activity Log</h1>
          <p className="caption mt-0.5">
            {loading ? 'Loading…' : `${filtered.length.toLocaleString()} event${filtered.length !== 1 ? 's' : ''}${hasFilters ? ' matching filters' : ''}`}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => void load()} disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-white/07 bg-card text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-white/05 transition disabled:opacity-40">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button onClick={() => exportCsv(filtered)} disabled={loading || filtered.length === 0}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-white/07 bg-card text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-white/05 transition disabled:opacity-40">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      <MonitoringTabs />

      {/* Filters */}
      <div className="rounded-xl border border-white/07 bg-card p-4 space-y-3">
        {/* Category chips */}
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(CATEGORY_LABELS) as Category[]).map(cat => (
            <button key={cat}
              onClick={() => { setCategory(cat); setPage(0) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                category === cat
                  ? 'bg-primary text-white'
                  : 'bg-white/05 text-muted-foreground hover:bg-white/08 hover:text-foreground'
              }`}>
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
            <input className={`${INPUT} pl-9 w-full`} placeholder="Search activity, business, detail…"
              value={search} onChange={e => { setSearch(e.target.value); setPage(0) }} />
          </div>
          <input type="date" className={`${INPUT} text-xs`} value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(0) }} />
          <span className="text-muted-foreground/40 text-xs">to</span>
          <input type="date" className={`${INPUT} text-xs`} value={toDate} onChange={e => { setToDate(e.target.value); setPage(0) }} />
          {hasFilters && (
            <button onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/05 border border-white/07 transition">
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/05 px-4 py-3 text-sm text-red-400 flex items-center justify-between">
          {error}
          <button onClick={() => void load()} className="text-xs underline">Retry</button>
        </div>
      )}

      {/* Activity feed */}
      <div className="rounded-2xl border border-white/07 bg-card overflow-hidden">
        {loading ? (
          <div className="divide-y divide-white/05">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                <div className="w-8 h-8 rounded-xl bg-white/05 animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-white/05 animate-pulse rounded w-1/3" />
                  <div className="h-2.5 bg-white/04 animate-pulse rounded w-2/3" />
                </div>
                <div className="h-2.5 bg-white/04 animate-pulse rounded w-24 shrink-0" />
              </div>
            ))}
          </div>
        ) : paginated.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <FileText className="w-8 h-8 text-muted-foreground/20" />
            <p className="text-sm font-medium text-foreground">No activity found</p>
            <p className="text-xs text-muted-foreground">{hasFilters ? 'Try adjusting your filters' : 'Activity will appear here as things happen'}</p>
          </div>
        ) : (
          <div className="divide-y divide-white/04">
            {paginated.map(item => {
              const { date, time } = fmtTime(item.ts)
              const showDateSep = date !== lastDate
              if (showDateSep) lastDate = date

              return (
                <div key={item.id}>
                  {showDateSep && (
                    <div className="px-5 py-2 bg-white/[0.015] border-b border-white/05">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50">{date}</p>
                    </div>
                  )}
                  <button
                    className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.018] transition-colors text-left"
                    onClick={() => setExpanded(e => e === item.id ? null : item.id)}>

                    {/* Icon */}
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${item.iconBg}`}>
                      {item.icon}
                    </div>

                    {/* Label + detail */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-foreground">{item.label}</p>
                        {item.businessName && (
                          <span className="text-xs text-muted-foreground/60 font-normal">— {item.businessName}</span>
                        )}
                        {item.kind === 'audit' && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/06 text-muted-foreground/50">operator</span>
                        )}
                        {item.severity === 'critical' && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-500/15 text-red-400">failed</span>
                        )}
                        {item.severity === 'warning' && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400">warning</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground/70 mt-0.5 truncate">{item.detail}</p>
                    </div>

                    {/* Time + expand */}
                    <div className="flex items-center gap-3 shrink-0">
                      <p className="text-[11px] font-mono text-muted-foreground/50 tabular-nums">{time}</p>
                      <div className="text-muted-foreground/30">
                        {expanded === item.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  </button>

                  {expanded === item.id && (
                    <div className="px-5 pb-4 bg-black/20 border-t border-white/05">
                      <p className="text-xs text-white/70 py-3 leading-relaxed">{item.detail}</p>
                      {(() => {
                        const meta = item.kind === 'platform'
                          ? (item.raw as PlatformEvent).metadata
                          : null
                        return meta && Object.keys(meta).length > 0 ? (
                          <pre className="text-[10px] text-muted-foreground/60 bg-black/30 rounded-lg p-3 overflow-x-auto">
                            {JSON.stringify(meta, null, 2)}
                          </pre>
                        ) : null
                      })()}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {!loading && totalPages > 1 && (
          <div className="px-5 py-3 border-t border-white/06 flex items-center justify-between">
            <p className="text-xs text-muted-foreground tabular-nums">
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length.toLocaleString()}
            </p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => p - 1)} disabled={page === 0}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/07 transition disabled:opacity-30">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="flex items-center px-3 text-xs text-muted-foreground tabular-nums">{page + 1} / {totalPages}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/07 transition disabled:opacity-30">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

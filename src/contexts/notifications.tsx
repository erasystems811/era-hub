import { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react'
import { commsApi, Alert } from '../lib/comms-api'
import { useAuth } from './auth'

export interface Notification {
  id: string
  message: string
  severity: Alert['severity']
  createdAt: string
  read: boolean
  action?: { label: string; path: string }
}

interface NotifCtx {
  notifications: Notification[]
  unreadCount: number
  markAllRead: () => void
  markRead: (id: string) => void
}

const Ctx = createContext<NotifCtx>(null!)
export const useNotifications = () => useContext(Ctx)

const ALERT_MESSAGES: Record<string, (a: Alert) => string> = {
  SESSION_DROPPED:    () => 'A WhatsApp number disconnected — check Sessions',
  NUMBER_FLAGGED:     (a) => `A WhatsApp number was flagged by the platform`,
  DELIVERY_RATE_DROP: () => 'Message delivery rate dropped below normal',
  CLIENT_OVER_LIMIT:  () => 'A business is approaching its monthly limit',
  QUEUE_BACKED_UP:    () => 'Message queue is backed up — delivery may be slower',
}

const ACTION_PATHS: Record<string, string> = {
  SESSION_DROPPED:    '/comms/sessions',
  NUMBER_FLAGGED:     '/comms/sessions',
  DELIVERY_RATE_DROP: '/comms/monitoring',
  CLIENT_OVER_LIMIT:  '/comms/businesses',
  QUEUE_BACKED_UP:    '/comms/monitoring',
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const seenIds = useRef(new Set<string>())
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchAlerts = useCallback(async () => {
    try {
      const alerts = await commsApi.listAlerts()
      const fresh: Notification[] = []
      for (const a of alerts) {
        if (seenIds.current.has(a.id) || a.resolved) continue
        seenIds.current.add(a.id)
        const labelFn = ALERT_MESSAGES[a.type]
        fresh.push({
          id:        a.id,
          message:   labelFn ? labelFn(a) : a.message,
          severity:  a.severity,
          createdAt: a.createdAt,
          read:      false,
          action: ACTION_PATHS[a.type]
            ? { label: 'View', path: ACTION_PATHS[a.type] }
            : undefined,
        })
      }
      if (fresh.length) {
        setNotifications(prev => [...fresh, ...prev].slice(0, 50))
      }
    } catch {
      // silently ignore — notifications are best-effort
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return
    void fetchAlerts()
    pollRef.current = setInterval(fetchAlerts, 30_000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [isAuthenticated, fetchAlerts])

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [])

  const markRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <Ctx.Provider value={{ notifications, unreadCount, markAllRead, markRead }}>
      {children}
    </Ctx.Provider>
  )
}

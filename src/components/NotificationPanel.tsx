import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, AlertTriangle, Info, X } from 'lucide-react'
import { useNotifications, Notification } from '../contexts/notifications'
import { fmtDateTime } from '../lib/utils'
import { cn } from '../lib/utils'

interface Props { onClose: () => void }

const ICON: Record<string, JSX.Element> = {
  critical: <AlertTriangle className="w-4 h-4 text-rose" />,
  warning:  <AlertTriangle className="w-4 h-4 text-amber-500" />,
  info:     <Info className="w-4 h-4 text-teal" />,
}

function Item({ n, onClose }: { n: Notification; onClose: () => void }) {
  const nav = useNavigate()
  const { markRead } = useNotifications()

  return (
    <div
      className={cn(
        'flex gap-3 px-4 py-3.5 border-b border-pink-border last:border-0',
        !n.read && 'bg-pink-light',
      )}
      onClick={() => {
        markRead(n.id)
        if (n.action) { nav(n.action.path); onClose() }
      }}
    >
      <div className="mt-0.5 shrink-0">{ICON[n.severity] ?? ICON.info}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-charcoal leading-snug">{n.message}</p>
        <p className="text-xs text-charcoal-soft mt-0.5">{fmtDateTime(n.createdAt)}</p>
        {n.action && (
          <span className="text-xs font-medium text-teal mt-1 inline-block">{n.action.label} →</span>
        )}
      </div>
      {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-pink shrink-0 mt-1.5" />}
    </div>
  )
}

export function NotificationPanel({ onClose }: Props) {
  const { notifications, unreadCount, markAllRead } = useNotifications()

  return (
    <div className="glass shadow-glass-lg w-80 overflow-hidden" style={{ padding: 0 }}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-pink-border">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-pink" />
          <span className="font-semibold text-sm text-charcoal">Notifications</span>
          {unreadCount > 0 && (
            <span className="bg-pink text-white text-xs font-semibold rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button className="btn-ghost text-xs py-1 px-2" onClick={markAllRead}>
              <CheckCheck className="w-3.5 h-3.5" />
            </button>
          )}
          <button className="btn-ghost py-1 px-2" onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Bell className="w-8 h-8 text-pink mx-auto mb-2 opacity-40" />
            <p className="text-sm text-charcoal-soft">You're all caught up</p>
          </div>
        ) : (
          notifications.map(n => <Item key={n.id} n={n} onClose={onClose} />)
        )}
      </div>
    </div>
  )
}

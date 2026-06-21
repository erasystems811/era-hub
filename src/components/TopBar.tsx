import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Bell, LogOut } from 'lucide-react'
import { useAuth } from '../contexts/auth'
import { useNotifications } from '../contexts/notifications'
import { NotificationPanel } from './NotificationPanel'

const TITLES: Record<string, string> = {
  '/': 'Home',
  '/patient/hospitals': 'Hospitals',
  '/patient/analytics': 'Analytics',
  '/patient/support': 'Support',
  '/patient/automation': 'Automation Log',
  '/patient/crm': 'Sales CRM',
  '/comms/sessions': 'Sessions',
  '/comms/businesses': 'Businesses',
  '/comms/plans': 'Plans',
  '/comms/billing': 'Billing & Usage',
  '/comms/settings': 'Settings',
}

export function TopBar() {
  const { logout } = useAuth()
  const { unreadCount } = useNotifications()
  const { pathname } = useLocation()
  const [showNotif, setShowNotif] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const title = Object.entries(TITLES)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([k]) => pathname === k || pathname.startsWith(k + '/'))?.[1] ?? 'ERA Systems'

  useEffect(() => {
    if (!showNotif) return
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowNotif(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showNotif])

  return (
    <header
      className="fixed top-0 left-56 right-0 h-14 z-10 flex items-center justify-between px-6"
      style={{
        background: 'rgba(181,34,106,0.75)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.12)',
      }}
    >
      <h1 className="font-semibold text-white text-base">{title}</h1>

      <div className="flex items-center gap-1" ref={panelRef}>
        <div className="relative">
          <button
            className="btn-ghost relative p-2 rounded-xl"
            onClick={() => setShowNotif(v => !v)}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-white text-charcoal text-[9px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {showNotif && (
            <div className="absolute right-0 top-10">
              <NotificationPanel onClose={() => setShowNotif(false)} />
            </div>
          )}
        </div>

        <button className="btn-ghost p-2 rounded-xl" onClick={logout} title="Sign out">
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  )
}

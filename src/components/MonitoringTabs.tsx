import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/comms/alerts',      label: 'Alerts'      },
  { to: '/comms/event-log',   label: 'Event Log'   },
  { to: '/comms/audit',       label: 'Audit Trail' },
  { to: '/comms/investigate', label: 'Investigate' },
]

export function MonitoringTabs() {
  return (
    <div className="flex gap-1 border-b border-white/07 mb-6">
      {TABS.map(t => (
        <NavLink
          key={t.to}
          to={t.to}
          className={({ isActive }) =>
            `px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
              isActive
                ? 'text-primary border-primary'
                : 'text-muted-foreground border-transparent hover:text-foreground hover:border-white/20'
            }`
          }
        >
          {t.label}
        </NavLink>
      ))}
    </div>
  )
}

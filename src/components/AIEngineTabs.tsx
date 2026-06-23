import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/comms/ai-engine',    label: 'Config'    },
  { to: '/comms/ai-logs',      label: 'Logs'      },
  { to: '/comms/ai-templates', label: 'Templates' },
]

export function AIEngineTabs() {
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

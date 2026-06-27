import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description: string
  action?: { label: string; onClick: () => void }
  secondaryAction?: { label: string; onClick: () => void }
  // accent colour for the glow — pass a CSS hex / hsl string
  accent?: string
  compact?: boolean
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  accent = '#C4286F',
  compact = false,
}: EmptyStateProps) {
  return (
    <div className={`relative flex flex-col items-center justify-center text-center overflow-hidden rounded-2xl border border-white/07 bg-card ${compact ? 'py-10 px-6' : 'py-20 px-8'}`}>
      {/* Soft radial glow */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[420px] h-[180px] opacity-30"
        style={{ background: `radial-gradient(ellipse 70% 90% at 50% 0%, ${accent}55, transparent 70%)` }}
      />

      {/* Icon container */}
      <div
        className="relative mb-5 flex items-center justify-center w-16 h-16 rounded-2xl"
        style={{
          background: `${accent}18`,
          border: `1px solid ${accent}35`,
          boxShadow: `0 0 24px 0 ${accent}25`,
        }}
      >
        <div className="w-7 h-7" style={{ color: accent }}>
          {icon}
        </div>
      </div>

      <h3 className="text-base font-bold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-6 leading-relaxed">{description}</p>

      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {action && (
            <button
              onClick={action.onClick}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: accent }}
            >
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

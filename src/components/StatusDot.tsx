import { cn } from '../lib/utils'

const DOTS: Record<string, string> = {
  connected:    'bg-teal',
  active:       'bg-teal',
  healthy:      'bg-teal',
  true:         'bg-teal',
  warming_up:   'bg-amber-400',
  pending_qr:   'bg-amber-400',
  warning:      'bg-amber-400',
  disconnected: 'bg-rose',
  flagged:      'bg-rose',
  banned:       'bg-rose',
  critical:     'bg-rose',
  false:        'bg-gray-300',
  inactive:     'bg-gray-300',
  expired:      'bg-gray-300',
}

const PULSE = new Set(['pending_qr', 'warming_up', 'active', 'connected'])

interface Props {
  status: string
  label?: string
  size?: 'sm' | 'md'
}

export function StatusDot({ status, label, size = 'md' }: Props) {
  const dot = DOTS[status.toLowerCase()] ?? 'bg-gray-300'
  const pulse = PULSE.has(status.toLowerCase())

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('rounded-full shrink-0', size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5', dot, pulse && 'animate-pulse')} />
      {label && <span className="text-sm text-charcoal-soft">{label}</span>}
    </span>
  )
}

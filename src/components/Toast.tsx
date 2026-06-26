import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────

type ToastKind = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  kind: ToastKind
  message: string
}

interface ToastContextValue {
  toast: (message: string, kind?: ToastKind) => void
}

// ── Context ────────────────────────────────────────────────────

const ToastCtx = createContext<ToastContextValue | null>(null)

// ── Provider ───────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const counter = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = ++counter.current
    setToasts(prev => [...prev, { id, kind, message }])
    setTimeout(() => dismiss(id), 4500)
  }, [dismiss])

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}

      {/* Portal — fixed bottom-right stack */}
      <div className="fixed bottom-5 right-5 z-[999] flex flex-col gap-2 items-end pointer-events-none">
        {toasts.map(t => (
          <ToastCard key={t.id} item={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

// ── Card ───────────────────────────────────────────────────────

const STYLES: Record<ToastKind, { bar: string; icon: string; bg: string; border: string }> = {
  success: {
    bar:    'bg-teal',
    icon:   'text-teal',
    bg:     'bg-[#141222]',
    border: 'border-teal/20',
  },
  error: {
    bar:    'bg-red-500',
    icon:   'text-red-400',
    bg:     'bg-[#1a1016]',
    border: 'border-red-500/20',
  },
  info: {
    bar:    'bg-primary',
    icon:   'text-primary',
    bg:     'bg-[#141222]',
    border: 'border-primary/20',
  },
}

const ICONS: Record<ToastKind, React.ReactNode> = {
  success: <CheckCircle2 className="w-4 h-4" />,
  error:   <XCircle className="w-4 h-4" />,
  info:    <Info className="w-4 h-4" />,
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const s = STYLES[item.kind]
  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 rounded-xl border ${s.border} ${s.bg} shadow-2xl px-4 py-3 w-[320px] max-w-[calc(100vw-2.5rem)] animate-slide-up`}
      style={{ backdropFilter: 'blur(12px)' }}
    >
      {/* Colour accent bar */}
      <div className={`w-0.5 self-stretch rounded-full ${s.bar} shrink-0`} />

      <span className={`shrink-0 mt-0.5 ${s.icon}`}>{ICONS[item.kind]}</span>

      <p className="flex-1 text-sm text-white/85 leading-snug">{item.message}</p>

      <button
        onClick={onDismiss}
        className="shrink-0 text-white/25 hover:text-white/60 transition mt-0.5"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

// ── Hook ───────────────────────────────────────────────────────

export function useToast() {
  const ctx = useContext(ToastCtx)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx.toast
}

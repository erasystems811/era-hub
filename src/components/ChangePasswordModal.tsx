import { useState } from 'react'
import { KeyRound, X, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { PATIENT_API } from '../lib/config'

interface Props {
  onClose: () => void
}

async function changePassword(currentPassword: string, newPassword: string) {
  const token = localStorage.getItem('era_hub_token') ?? ''
  const res = await fetch(`${PATIENT_API}/super-admin/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-super-admin-token': token },
    body: JSON.stringify({ currentPassword, newPassword }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message ?? err.error ?? 'Failed to change password')
  }
}

export function ChangePasswordModal({ onClose }: Props) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNext, setShowNext] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (next.length < 8) { setError('New password must be at least 8 characters.'); return }
    if (next !== confirm) { setError('New passwords do not match.'); return }
    setSaving(true)
    try {
      await changePassword(current, next)
      setDone(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to change password.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <KeyRound className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Change Operator Password</p>
              <p className="text-xs text-muted-foreground">Protects all platform access</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {done ? (
          <div className="p-8 flex flex-col items-center gap-4 text-center">
            <div className="w-12 h-12 rounded-full bg-[#CC7896]/10 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-[#CC7896]" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Password updated</p>
              <p className="text-sm text-muted-foreground mt-1">Your new password is now active.</p>
            </div>
            <button onClick={onClose}
              className="mt-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {[
              { label: 'Current Password', val: current, set: setCurrent, show: showCurrent, toggle: () => setShowCurrent(v => !v) },
              { label: 'New Password',     val: next,    set: setNext,    show: showNext,    toggle: () => setShowNext(v => !v) },
            ].map(({ label, val, set, show, toggle }) => (
              <div key={label} className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">{label}</label>
                <div className="relative">
                  <input
                    type={show ? 'text' : 'password'}
                    value={val}
                    onChange={e => set(e.target.value)}
                    required
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder={label === 'New Password' ? 'Min. 8 characters' : 'Your current password'}
                  />
                  <button type="button" onClick={toggle}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Confirm New Password</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="Repeat new password"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">
                {error}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition">
                {saving ? 'Updating…' : 'Update Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

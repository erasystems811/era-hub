import { useState, FormEvent } from 'react'
import { useAuth } from '../contexts/auth'
import { Lock, User, AlertCircle, Eye, EyeOff } from 'lucide-react'

const inputCls = "w-full pl-10 pr-10 py-2.5 bg-[hsl(262_16%_11%)] border border-[hsl(262_14%_18%)] text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all duration-150 font-medium tracking-wide"

export function Login() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try { await login(username, password) }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Login failed') }
    finally { setLoading(false) }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'hsl(262 22% 6%)' }}
    >
      {/* Primary spotlight — dusty rose burst from top */}
      <div className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 90% 55% at 50% -5%, hsl(340 35% 61% / 0.16) 0%, hsl(340 35% 35% / 0.07) 45%, transparent 70%)' }} />

      {/* Secondary teal accent — bottom */}
      <div className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 60% 35% at 50% 110%, hsl(175 40% 48% / 0.09) 0%, transparent 65%)' }} />

      {/* Top border beam */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent 0%, hsl(340 35% 61% / 0.45) 30%, hsl(175 40% 48% / 0.35) 50%, hsl(340 35% 61% / 0.45) 70%, transparent 100%)' }} />

      {/* Bottom border beam */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent 10%, hsl(340 35% 61% / 0.18) 50%, transparent 90%)' }} />

      {/* Left edge glow */}
      <div className="pointer-events-none absolute top-0 left-0 bottom-0 w-px"
        style={{ background: 'linear-gradient(180deg, transparent, hsl(340 35% 61% / 0.20) 40%, hsl(175 40% 48% / 0.12) 60%, transparent)' }} />

      {/* Right edge glow */}
      <div className="pointer-events-none absolute top-0 right-0 bottom-0 w-px"
        style={{ background: 'linear-gradient(180deg, transparent, hsl(340 35% 61% / 0.20) 40%, hsl(175 40% 48% / 0.12) 60%, transparent)' }} />

      {/* Background crosshair */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.020]">
        <div className="absolute w-[600px] h-px" style={{ background: 'hsl(340 35% 75%)' }} />
        <div className="absolute w-px h-[600px]" style={{ background: 'hsl(340 35% 75%)' }} />
        <div className="absolute w-[400px] h-[400px] rounded-full border" style={{ borderColor: 'hsl(340 35% 75%)' }} />
        <div className="absolute w-[200px] h-[200px] rounded-full border" style={{ borderColor: 'hsl(175 40% 60%)' }} />
      </div>

      <div className="w-full max-w-xs relative z-10">

        {/* Brand mark */}
        <div className="flex flex-col items-center mb-8">
          <div className="mb-2">
            <img src="/erahub4.png" alt="ERA Systems" className="w-24 h-24 object-contain" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-xs font-bold text-foreground tracking-[0.25em] uppercase">Era Systems</p>
            <p className="text-[9px] font-medium uppercase tracking-[0.3em] text-muted-foreground/60">Operator Hub</p>
          </div>
        </div>

        {/* Login card */}
        <form onSubmit={submit} className="space-y-4">
          <div
            className="border border-[hsl(262_14%_18%)] bg-card space-y-3 p-4"
            style={{ boxShadow: '0 16px 40px rgba(0,0,0,0.55), 0 0 0 1px hsl(262 14% 22% / 0.5)' }}
          >
            <div className="border-b border-[hsl(262_14%_18%)] pb-3 mb-1">
              <p className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-[0.25em]">Operator Login</p>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em]">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                  className={inputCls}
                  placeholder=""
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em]">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className={inputCls}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-[11px] text-destructive bg-destructive/8 border border-destructive/15 px-3 py-2">
                <AlertCircle className="w-3 h-3 shrink-0" />
                {error}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="w-full py-2.5 bg-primary text-primary-foreground text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
            style={{ boxShadow: '0 4px 20px hsl(340 35% 61% / 0.22)' }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-10 text-center space-y-1">
          <p className="text-[9px] text-muted-foreground/30 uppercase tracking-[0.3em]">
            Evaluate · Rebuild · Automate
          </p>
          <p className="text-[9px] text-muted-foreground/20 uppercase tracking-[0.2em]">
            Era Systems · Operator Access Only
          </p>
        </div>
      </div>
    </div>
  )
}

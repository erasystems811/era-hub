import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { bizApi, setBizToken } from './business-api'

export function BizLogin() {
  const navigate = useNavigate()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const INPUT = 'w-full px-3.5 py-2.5 rounded-xl bg-[hsl(262_20%_11%)] border border-white/[0.10] text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-[#BF7C93]/50 focus:ring-2 focus:ring-[#BF7C93]/15 transition-all'
  const LABEL = 'text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-1.5 block'

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { token } = await bizApi.login(email.trim(), password)
      setBizToken(token)
      navigate('/biz/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'hsl(262 22% 6%)' }}
    >
      {/* Background radial gradients */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute -top-[30vh] -right-[20vw] w-[70vw] h-[70vh] rounded-full opacity-[0.06]"
          style={{ background: 'radial-gradient(circle, #BF7C93 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-[20vh] -left-[15vw] w-[50vw] h-[50vh] rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #BF7C93 0%, transparent 70%)' }}
        />
      </div>

      <div className="relative w-full max-w-sm px-6">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/erahub4.png" alt="ERA" className="w-16 h-16 mx-auto mb-4 opacity-90" />
          <h1 className="text-2xl font-bold text-foreground">ERA Comms</h1>
          <p className="text-sm text-muted-foreground mt-1">Business Portal</p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl border p-7"
          style={{ background: 'hsl(262 20% 9%)', borderColor: 'rgba(191,124,147,0.12)' }}
        >
          <h2 className="text-base font-semibold text-foreground mb-5">Sign in to your account</h2>

          {error && (
            <div className="mb-4 px-3.5 py-3 rounded-xl border border-red-500/20 bg-red-500/8 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={LABEL}>Email address</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@business.com"
                className={INPUT}
              />
            </div>
            <div>
              <label className={LABEL}>Password</label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className={INPUT}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full px-4 py-2.5 rounded-xl bg-[#BF7C93] text-white text-sm font-bold hover:bg-[#BF7C93]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center mt-5 text-xs text-muted-foreground/40">
          ERA Comms · Business Portal · ERA Systems
        </p>
      </div>
    </div>
  )
}

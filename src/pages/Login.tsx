import { FormEvent, useState } from 'react'
import { useAuth } from '../contexts/auth'

export function Login() {
  const { login, isLoggingIn, loginError } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (username && password) void login(username, password)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #C4286F 0%, #A82060 60%, #8A1850 100%)' }}
    >
      {/* Decorative blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-40"
          style={{ background: 'radial-gradient(circle, #B5226A 0%, transparent 70%)' }} />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full opacity-25"
          style={{ background: 'radial-gradient(circle, #7A1248 0%, transparent 70%)' }} />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="/erahub.png"
            alt="ERA Systems"
            className="w-20 h-20 mx-auto mb-4 rounded-2xl shadow-glass"
          />
          <h1 className="text-2xl font-semibold text-charcoal">ERA Systems</h1>
          <p className="text-sm text-charcoal-soft mt-1">Operator Hub</p>
        </div>

        {/* Card */}
        <div className="glass p-8">
          <h2 className="text-lg font-semibold text-charcoal mb-1">Sign in</h2>
          <p className="caption mb-6">Enter your operator credentials to continue</p>

          {loginError && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm text-rose"
              style={{ background: 'rgba(208,80,128,0.08)', border: '1px solid rgba(208,80,128,0.2)' }}>
              {loginError}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Username</label>
              <input
                type="text"
                className="input"
                placeholder="Enter your username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            <button
              type="submit"
              className="btn-primary w-full mt-2 justify-center flex items-center gap-2"
              disabled={isLoggingIn || !username || !password}
            >
              {isLoggingIn ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in…
                </>
              ) : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-charcoal-soft mt-6 opacity-60">
          ERA Systems · Operator access only
        </p>
      </div>
    </div>
  )
}

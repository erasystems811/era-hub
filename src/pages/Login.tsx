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
      style={{ background: '#0F172A' }}
    >
      {/* Ambient glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(196,40,111,0.18) 0%, transparent 65%)' }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(13,148,136,0.14) 0%, transparent 65%)' }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(196,40,111,0.05) 0%, transparent 60%)' }}
        />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center"
            style={{
              background: 'rgba(196,40,111,0.15)',
              border: '1px solid rgba(196,40,111,0.30)',
              boxShadow: '0 0 40px rgba(196,40,111,0.20)',
            }}
          >
            <img src="/erahub4.png" alt="ERA Systems" className="w-10 h-10 object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">ERA Systems</h1>
          <p className="text-sm mt-1 font-medium" style={{ color: 'rgba(255,255,255,0.40)' }}>
            Operator Hub
          </p>
        </div>

        {/* Card */}
        <div
          className="p-8 rounded-2xl"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.10)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <h2 className="text-base font-semibold text-white mb-0.5">Sign in</h2>
          <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.40)' }}>
            Enter your operator credentials to continue
          </p>

          {loginError && (
            <div
              className="mb-5 px-4 py-3 rounded-xl text-sm"
              style={{
                background: 'rgba(190,18,60,0.12)',
                border: '1px solid rgba(190,18,60,0.25)',
                color: '#FDA4AF',
              }}
            >
              {loginError}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'rgba(255,255,255,0.40)' }}>
                Username
              </label>
              <input
                type="text"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1.5px solid rgba(255,255,255,0.10)',
                  color: 'white',
                }}
                placeholder="Enter your username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
                required
                onFocus={e => {
                  e.target.style.borderColor = 'rgba(196,40,111,0.60)'
                  e.target.style.boxShadow = '0 0 0 3px rgba(196,40,111,0.12)'
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.10)'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'rgba(255,255,255,0.40)' }}>
                Password
              </label>
              <input
                type="password"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1.5px solid rgba(255,255,255,0.10)',
                  color: 'white',
                }}
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                onFocus={e => {
                  e.target.style.borderColor = 'rgba(196,40,111,0.60)'
                  e.target.style.boxShadow = '0 0 0 3px rgba(196,40,111,0.12)'
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.10)'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>
            <button
              type="submit"
              className="w-full mt-2 justify-center font-semibold text-sm py-2.5 rounded-xl transition-all duration-150 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: '#C4286F',
                color: 'white',
                boxShadow: '0 2px 16px rgba(196,40,111,0.40)',
              }}
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

        <p className="text-center text-[11px] mt-6 font-medium" style={{ color: 'rgba(255,255,255,0.20)' }}>
          ERA Systems · Operator access only
        </p>
      </div>
    </div>
  )
}

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { patientApi, getToken, setToken, clearToken } from '../lib/patient-api'

interface AuthCtx {
  isAuthenticated: boolean
  isLoggingIn: boolean
  loginError: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const Ctx = createContext<AuthCtx>(null!)
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!getToken())
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  const login = useCallback(async (username: string, password: string) => {
    setIsLoggingIn(true)
    setLoginError(null)
    try {
      const { token } = await patientApi.login(username, password)
      setToken(token)
      setIsAuthenticated(true)
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : 'Could not sign in. Please check your details and try again.')
    } finally {
      setIsLoggingIn(false)
    }
  }, [])

  const logout = useCallback(() => {
    clearToken()
    setIsAuthenticated(false)
  }, [])

  return (
    <Ctx.Provider value={{ isAuthenticated, isLoggingIn, loginError, login, logout }}>
      {children}
    </Ctx.Provider>
  )
}

import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { AuthResponse, AuthUser, LoginRequest, RegisterRequest } from '../types'
import { authService } from '../services/authService'
import { AUTH_LOGOUT_EVENT } from '../services/api'
import { tokenStorage } from '../utils/tokenStorage'

export interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  isAdmin: boolean
  login: (data: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => tokenStorage.getUser())

  const saveSession = useCallback((response: AuthResponse) => {
    const { token, ...authUser } = response
    tokenStorage.save(token, authUser)
    setUser(authUser)
  }, [])

  const login = useCallback(
    async (data: LoginRequest) => saveSession(await authService.login(data)),
    [saveSession],
  )

  const register = useCallback(
    async (data: RegisterRequest) => saveSession(await authService.register(data)),
    [saveSession],
  )

  const logout = useCallback(() => {
    tokenStorage.clear()
    setUser(null)
  }, [])

  useEffect(() => {
    window.addEventListener(AUTH_LOGOUT_EVENT, logout)
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, logout)
  }, [logout])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isAdmin: user?.role === 'ADMIN',
      login,
      register,
      logout,
    }),
    [user, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
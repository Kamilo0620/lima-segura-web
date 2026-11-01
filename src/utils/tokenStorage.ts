import type { AuthUser } from '../types'

const TOKEN_KEY = 'lima_segura_token'
const USER_KEY = 'lima_segura_user'

export const tokenStorage = {
  getToken: (): string | null => localStorage.getItem(TOKEN_KEY),

  getUser: (): AuthUser | null => {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  },

  save: (token: string, user: AuthUser): void => {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  },

  clear: (): void => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  },
}
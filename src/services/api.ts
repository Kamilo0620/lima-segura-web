import axios, { AxiosError } from 'axios'
import type { ApiError } from '../types'
import { tokenStorage } from '../utils/tokenStorage'

export const AUTH_LOGOUT_EVENT = 'auth:logout'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
})

api.interceptors.request.use((config) => {
  const token = tokenStorage.getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    const isAuthRequest = error.config?.url?.startsWith('/auth')
    if (error.response?.status === 401 && !isAuthRequest) {
      tokenStorage.clear()
      window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT))
    }
    return Promise.reject(error)
  },
)

export function getErrorMessage(error: unknown): string {
  if (axios.isCancel(error)) return 'La petición fue cancelada'
  if (!axios.isAxiosError<ApiError>(error)) return 'Ocurrió un error inesperado'
  if (error.code === 'ECONNABORTED') return 'El servidor tardó demasiado en responder'
  if (!error.response) return 'No hay conexión con el servidor'

  const { status, data } = error.response
  switch (status) {
    case 400:
      return data?.message ?? 'Los datos enviados no son válidos'
    case 401:
      return 'Correo o contraseña incorrectos'
    case 403:
      return 'No tienes permiso para hacer esto'
    case 404:
      return data?.message ?? 'No se encontró lo que buscabas'
    case 409:
      return data?.message ?? 'Ese registro ya existe'
    default:
      return 'Error en el servidor, intenta más tarde'
  }
}

export default api
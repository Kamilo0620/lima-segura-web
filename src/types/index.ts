export type Role = 'USER' | 'ADMIN'

export interface AuthUser {
  id: number
  name: string
  email: string
  role: Role
}

export interface AuthResponse extends AuthUser {
  token: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

export interface ApiError {
  timestamp: string
  status: number
  error: string
  message: string
  path: string
}
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

export type ReportStatus = 'PENDING' | 'VALIDATED' | 'UNVERIFIED'

export interface Report {
  id: number
  description: string
  latitude: number
  longitude: number
  status: ReportStatus
  userId: number
  zoneId: number
  categoryId: number
}

export interface Zone {
  id: number
  name: string
  district: string
  latitude: number
  longitude: number
}

export interface Category {
  id: number
  name: string
}

export interface ReportFilters {
  page: number
  size: number
  search?: string
  zoneId?: number
}


export interface ReportDetail extends Report {
  createdAt: string
  confirmationsCount: number
}


export interface ReportCreateRequest {
  zoneId: number
  categoryId: number
  description: string
  latitude: number
  longitude: number
}
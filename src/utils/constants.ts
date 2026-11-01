import type { ReportStatus } from '../types'

export const LIMA_CENTER: [number, number] = [-12.0464, -77.0428]

export const STATUS_COLORS: Record<ReportStatus, string> = {
  PENDING: '#f59e0b',
  VALIDATED: '#dc2626',
  UNVERIFIED: '#64748b',
}
import api from './api'
import type { PageResponse, Report, ReportCreateRequest, ReportDetail, ReportFilters } from '../types'
export const reportService = {
  getAll: async (filters: ReportFilters, signal?: AbortSignal): Promise<PageResponse<Report>> => {
    const response = await api.get<PageResponse<Report>>('/reports', {
      params: {
        page: filters.page,
        size: filters.size,
        search: filters.search || undefined,
        zoneId: filters.zoneId,
      },
      signal,
    })
    return response.data
  },

  getById: async (id: number, signal?: AbortSignal): Promise<ReportDetail> => {
    const [detail, count] = await Promise.all([
      api.get<ReportDetail>(`/reports/${id}`, { signal }),
      api.get<{ reportId: number; count: number }>('/confirmations/count', {
        params: { reportId: id },
        signal,
      }),
    ])
    return { ...detail.data, confirmationsCount: count.data.count }
  },

  create: async (data: ReportCreateRequest): Promise<Report> => {
    const response = await api.post<Report>('/reports', data)
    return response.data
  },

  confirm: async (id: number): Promise<void> => {
    await api.post(`/reports/${id}/confirm`)
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`/reports/${id}`)
  },
}
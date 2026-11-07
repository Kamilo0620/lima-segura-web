import api from './api'
import type {
  HeatmapPoint,
  IncidentDetail,
  IncidentFilters,
  IncidentSummary,
  PageResponse,
} from '../types'

export const incidentService = {
  async getHeatmap(filters?: {
    from?: string
    to?: string
    types?: string[]
    minConfidence?: number
  }): Promise<HeatmapPoint[]> {
    const params: Record<string, any> = {}
    if (filters?.from) params.from = filters.from
    if (filters?.to) params.to = filters.to
    if (filters?.types && filters.types.length > 0) {
      params.types = filters.types.join(',')
    }
    if (filters?.minConfidence !== undefined) {
      params.minConfidence = filters.minConfidence
    }

    const response = await api.get<HeatmapPoint[]>('/incidents/heatmap', { params })
    return response.data
  },

  async getIncidents(filters: IncidentFilters = {}): Promise<PageResponse<IncidentSummary>> {
    const params: Record<string, any> = {
      page: filters.page ?? 0,
      size: filters.size ?? 20,
    }
    if (filters.type) params.type = filters.type
    if (filters.from) params.from = filters.from
    if (filters.to) params.to = filters.to
    if (filters.district) params.district = filters.district
    if (filters.origin) params.origin = filters.origin

    const response = await api.get<PageResponse<IncidentSummary>>('/incidents', { params })
    return response.data
  },

  async getIncidentDetail(id: number): Promise<IncidentDetail> {
    const response = await api.get<IncidentDetail>(`/incidents/${id}`)
    return response.data
  },

  async getDashboardStats(): Promise<any> {
    const response = await api.get('/incidents/stats/dashboard')
    return response.data
  },

  async reportIncident(data: any): Promise<any> {
    const response = await api.post('/incidents/report', data)
    return response.data
  },

  createEventSource(): EventSource {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'
    return new EventSource(`${baseUrl}/incidents/stream`)
  },
}

import axios from 'axios'
import api from './api'
import type {
  CitizenReportRequest,
  ConfirmationResult,
  DashboardStats,
  HeatmapPoint,
  IncidentDetail,
  IncidentFilters,
  IncidentSummary,
  PageResponse,
} from '../types'

/**
 * Spring puede serializar la página de dos formas:
 *  - clásica: { content, totalPages, totalElements, number, size, ... }
 *  - nueva:   { content, page: { number, size, totalElements, totalPages } }
 * Esta función devuelve siempre la forma clásica para que las páginas no dependan de eso.
 */
function normalizePage<T>(raw: any): PageResponse<T> {
  const meta = raw?.page ?? raw ?? {}
  const content: T[] = raw?.content ?? []
  const number = meta.number ?? raw?.number ?? 0
  const size = meta.size ?? raw?.size ?? content.length
  const totalElements = meta.totalElements ?? raw?.totalElements ?? content.length
  const totalPages = meta.totalPages ?? raw?.totalPages ?? 1
  return {
    content,
    pageable: { pageNumber: number, pageSize: size },
    totalElements,
    totalPages,
    number,
    size,
    numberOfElements: content.length,
    first: number === 0,
    last: number >= totalPages - 1,
    empty: content.length === 0,
  }
}

// Cliente aparte para la API externa de OpenStreetMap (geocodificación inversa)
const nominatim = axios.create({
  baseURL: 'https://nominatim.openstreetmap.org',
  timeout: 8000,
  headers: { 'Accept-Language': 'es' },
})

export const incidentService = {
  async getHeatmap(
    filters?: { from?: string; to?: string; types?: string[]; minConfidence?: number },
    signal?: AbortSignal,
  ): Promise<HeatmapPoint[]> {
    const params: Record<string, unknown> = {}
    if (filters?.from) params.from = filters.from
    if (filters?.to) params.to = filters.to
    if (filters?.types && filters.types.length > 0) params.types = filters.types.join(',')
    if (filters?.minConfidence !== undefined) params.minConfidence = filters.minConfidence

    const response = await api.get<HeatmapPoint[]>('/incidents/heatmap', { params, signal })
    return response.data
  },

  async getIncidents(filters: IncidentFilters = {}, signal?: AbortSignal): Promise<PageResponse<IncidentSummary>> {
    const params: Record<string, unknown> = {
      page: filters.page ?? 0,
      size: filters.size ?? 20,
      // Spring Pageable: los más recientes primero
      sort: 'occurredAt,desc',
    }
    const type = filters.type || filters.incidentType
    if (type) params.type = type
    if (filters.status) params.status = filters.status
    if (filters.from) params.from = filters.from
    if (filters.to) params.to = filters.to
    if (filters.district) params.district = filters.district
    if (filters.origin) params.origin = filters.origin
    if (filters.search?.trim()) params.search = filters.search.trim()

    const response = await api.get('/incidents', { params, signal })
    return normalizePage<IncidentSummary>(response.data)
  },

  async getIncidentDetail(id: number, signal?: AbortSignal): Promise<IncidentDetail> {
    const response = await api.get<IncidentDetail>(`/incidents/${id}`, { signal })
    return response.data
  },

  async getDashboardStats(signal?: AbortSignal): Promise<DashboardStats> {
    const response = await api.get<DashboardStats>('/incidents/stats/dashboard', { signal })
    return response.data
  },

  /** Requiere sesión: el backend toma al autor del token JWT. */
  async reportIncident(data: CitizenReportRequest): Promise<IncidentSummary> {
    const response = await api.post<IncidentSummary>('/incidents/report', data)
    return response.data
  },

  /** "Yo también lo vi": con 3 confirmaciones el reporte se publica. */
  async confirmIncident(id: number): Promise<ConfirmationResult> {
    const response = await api.post<ConfirmationResult>(`/incidents/${id}/confirm`)
    return response.data
  },

  /** API externa: convierte coordenadas en una dirección legible. */
  async reverseGeocode(lat: number, lng: number, signal?: AbortSignal) {
    const response = await nominatim.get('/reverse', {
      params: { format: 'json', lat, lon: lng, zoom: 18, addressdetails: 1 },
      signal,
    })
    return response.data as { display_name?: string; address?: Record<string, string> }
  },

  createEventSource(): EventSource {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'
    return new EventSource(`${baseUrl}/incidents/stream`)
  },
}

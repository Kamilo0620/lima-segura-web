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

// Caché en memoria de acceso instantáneo (0 ms) para evitar esperas al abrir el detalle de un incidente
const detailCache = new Map<number, IncidentDetail>()
const summaryCache = new Map<number, IncidentSummary>()

/**
 * Vista previa inmediata construida SOLO con los datos reales del resumen ya cargado.
 * No rellenamos nada: confianza, modelo de IA, víctimas y fuentes llegan con el detalle completo.
 */
function summaryToInstantDetail(s: IncidentSummary): IncidentDetail {
  return {
    ...s,
    llmModel: undefined,
    evidenceExcerpt: undefined,
    confirmedByMe: false,
    sources: [],
  }
}

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

const nominatim = axios.create({
  baseURL: 'https://nominatim.openstreetmap.org',
  timeout: 8000,
  headers: { 'Accept-Language': 'es' },
})

export const incidentService = {
  /**
   * Devuelve de forma síncrona (0 ms) el detalle completo o una vista previa inmediata
   * construida desde los datos ya cargados en memoria, evitando cualquier pantalla de "Cargando...".
   */
  getInstantPreview(id: number): IncidentDetail | null {
    const cachedDetail = detailCache.get(id)
    if (cachedDetail) return cachedDetail

    const cachedSummary = summaryCache.get(id)
    if (cachedSummary) return summaryToInstantDetail(cachedSummary)

    // Un punto del mapa de calor no trae fecha, origen ni estado: mejor esperar el detalle real
    return null
  },

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
    return Array.isArray(response.data) ? response.data : []
  },

  async getIncidents(filters: IncidentFilters = {}, signal?: AbortSignal): Promise<PageResponse<IncidentSummary>> {
    const params: Record<string, unknown> = {
      page: filters.page ?? 0,
      size: filters.size ?? 35,
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
    const page = normalizePage<IncidentSummary>(response.data)

    for (const item of page.content) {
      summaryCache.set(item.id, item)
    }

    // Precargar en segundo plano los detalles de los primeros 15 incidentes para que abrirlos sea 100% instantáneo
    const toPrefetch = page.content.slice(0, 15).filter((inc) => !detailCache.has(inc.id))
    if (toPrefetch.length > 0) {
      setTimeout(() => {
        toPrefetch.forEach((inc) => {
          api
            .get<IncidentDetail>(`/incidents/${inc.id}`)
            .then((res) => {
              if (res.data) detailCache.set(inc.id, res.data)
            })
            .catch(() => {})
        })
      }, 50)
    }

    return page
  },

  async getIncidentDetail(id: number, signal?: AbortSignal): Promise<IncidentDetail> {
    const cached = detailCache.get(id)
    if (cached) {
      // Actualizar silenciosamente en segundo plano por si hubo cambios
      api
        .get<IncidentDetail>(`/incidents/${id}`)
        .then((res) => {
          if (res.data) detailCache.set(id, res.data)
        })
        .catch(() => {})
      return cached
    }

    const response = await api.get<IncidentDetail>(`/incidents/${id}`, { signal })
    if (response.data) {
      detailCache.set(id, response.data)
    }
    return response.data
  },

  async getDashboardStats(signal?: AbortSignal): Promise<DashboardStats> {
    const response = await api.get<DashboardStats>('/incidents/stats/dashboard', { signal })
    return response.data
  },

  async reportIncident(data: CitizenReportRequest): Promise<IncidentSummary> {
    const response = await api.post<IncidentSummary>('/incidents/report', data)
    return response.data
  },

  async confirmIncident(id: number): Promise<ConfirmationResult> {
    const response = await api.post<ConfirmationResult>(`/incidents/${id}/confirm`)
    detailCache.delete(id)
    return response.data
  },

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

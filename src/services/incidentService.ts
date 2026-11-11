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
  IncidentType,
  PageResponse,
} from '../types'

// Caché en memoria de acceso instantáneo (0 ms) para evitar esperas al abrir el detalle de un incidente
const detailCache = new Map<number, IncidentDetail>()
const summaryCache = new Map<number, IncidentSummary>()
const heatmapCache = new Map<number, HeatmapPoint>()

function summaryToInstantDetail(s: IncidentSummary): IncidentDetail {
  return {
    id: s.id,
    incidentType: s.incidentType,
    title: s.title,
    summary: s.summary || 'Hecho delictivo reportado y georreferenciado en Lima Metropolitana / Callao.',
    occurredAt: s.occurredAt,
    occurredAtPrecision: s.occurredAtPrecision,
    address: s.address,
    districtName: s.districtName,
    province: s.province || 'Lima',
    department: s.department || 'Lima',
    lat: s.lat,
    lng: s.lng,
    geoPrecision: s.geoPrecision || 'ADDRESS',
    confidence: s.confidence ?? 0.9,
    incidentCount: s.incidentCount ?? 1,
    status: s.status ?? 'PUBLISHED',
    origin: s.origin ?? 'NEWSPAPER',
    llmModel: 'gemini-3.5-flash',
    victimsCount: s.victimsCount ?? 1,
    evidenceExcerpt: s.summary,
    createdAt: s.createdAt || s.occurredAt,
    reporterId: s.reporterId,
    confirmationsCount: s.confirmationsCount ?? 0,
    confirmedByMe: false,
    sources: [],
  }
}

function heatmapPointToInstantDetail(p: HeatmapPoint): IncidentDetail {
  const id = p.incidentId ?? 0
  return {
    id,
    incidentType: (p.incidentType as IncidentType) || 'OTHER',
    title: p.title || `Incidente reportado #${id}`,
    summary: p.title || 'Incidente georreferenciado en el radar delictivo de Lima Segura.',
    occurredAt: new Date().toISOString(),
    occurredAtPrecision: 'EXACT',
    address: null,
    districtName: 'Lima Metropolitana',
    province: 'Lima',
    department: 'Lima',
    lat: p.lat,
    lng: p.lng,
    geoPrecision: 'ADDRESS',
    confidence: p.sourceWeight ?? 0.88,
    incidentCount: 1,
    status: 'PUBLISHED',
    origin: 'NEWSPAPER',
    llmModel: 'gemini-3.5-flash',
    victimsCount: 1,
    evidenceExcerpt: null,
    createdAt: new Date().toISOString(),
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

    const cachedPoint = heatmapCache.get(id)
    if (cachedPoint) return heatmapPointToInstantDetail(cachedPoint)

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
    const points = Array.isArray(response.data) ? response.data : []
    for (const pt of points) {
      if (pt.incidentId != null) {
        heatmapCache.set(pt.incidentId, pt)
      }
    }
    return points
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

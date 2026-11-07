import api from './api'
import type {
  DatasetImportResult,
  IncidentReviewRequest,
  IncidentStatus,
  IncidentSummary,
  IngestionRun,
  NewsSource,
  PageResponse,
  SourceItem,
  SourceItemStatus,
} from '../types'

export const adminService = {
  // Ingestion runs
  async getIngestionRuns(sourceId?: number, page = 0, size = 20): Promise<PageResponse<IngestionRun>> {
    const params: Record<string, any> = { page, size }
    if (sourceId) params.sourceId = sourceId
    const res = await api.get<PageResponse<IngestionRun>>('/admin/ingestion-runs', { params })
    return res.data
  },

  // Source items
  async getSourceItems(status?: SourceItemStatus, page = 0, size = 20): Promise<PageResponse<SourceItem>> {
    const params: Record<string, any> = { page, size }
    if (status) params.status = status
    const res = await api.get<PageResponse<SourceItem>>('/admin/source-items', { params })
    return res.data
  },

  async reprocessSourceItem(id: number): Promise<void> {
    await api.post(`/admin/source-items/${id}/reprocess`)
  },

  // Incident moderation
  async getIncidentsForReview(status?: IncidentStatus, page = 0, size = 20): Promise<PageResponse<IncidentSummary>> {
    const params: Record<string, any> = { page, size }
    if (status) params.status = status
    const res = await api.get<PageResponse<IncidentSummary>>('/admin/incidents', { params })
    return res.data
  },

  async reviewIncident(id: number, request: IncidentReviewRequest): Promise<IncidentSummary> {
    const res = await api.patch<IncidentSummary>(`/admin/incidents/${id}`, request)
    return res.data
  },

  // Sources management
  async getSources(): Promise<NewsSource[]> {
    const res = await api.get<NewsSource[]>('/admin/sources')
    return res.data
  },

  async createSource(data: {
    name: string
    type: string
    url: string
    channelId?: string
    credibility?: number
    pollIntervalMinutes?: number
    config?: string
  }): Promise<NewsSource> {
    const res = await api.post<NewsSource>('/admin/sources', data)
    return res.data
  },

  async updateSource(
    id: number,
    data: {
      name?: string
      type?: string
      url?: string
      channelId?: string
      credibility?: number
      pollIntervalMinutes?: number
      active?: boolean
      config?: string
    },
  ): Promise<NewsSource> {
    const res = await api.put<NewsSource>(`/admin/sources/${id}`, data)
    return res.data
  },

  async deleteSource(id: number): Promise<void> {
    await api.delete(`/admin/sources/${id}`)
  },

  async triggerSourceIngestion(id: number): Promise<void> {
    await api.post(`/admin/sources/${id}/ingest`)
  },

  async triggerAllIngestion(): Promise<any> {
    const res = await api.post('/admin/ingestion/trigger-all')
    return res.data
  },

  // Dataset CSV import (PNP / INEI)
  async importDataset(file: File): Promise<DatasetImportResult> {
    const formData = new FormData()
    formData.append('file', file)
    const res = await api.post<DatasetImportResult>('/admin/datasets/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },
}

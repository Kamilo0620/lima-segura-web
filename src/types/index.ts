export interface ApiError {
  timestamp?: string
  status?: number
  error?: string
  message?: string
  path?: string
}

export type Role = 'USER' | 'ADMIN' | 'SERVICE'

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
  pageable: {
    pageNumber: number
    pageSize: number
  }
  totalElements: number
  totalPages: number
  last: boolean
  first: boolean
  size: number
  number: number
  numberOfElements: number
  empty: boolean
}

export type IncidentType =
  | 'HOMICIDE'
  | 'ARMED_ROBBERY'
  | 'THEFT'
  | 'EXTORTION'
  | 'KIDNAPPING'
  | 'ASSAULT'
  | 'CYBERCRIME'
  | 'DRUG_TRAFFICKING'
  | 'OTHER'

export type IncidentOrigin = 'NEWS' | 'OFFICIAL' | 'CITIZEN'

export type IncidentStatus = 'PENDING_REVIEW' | 'VALIDATED' | 'REJECTED' | 'VERIFIED'
export type GeoPrecision = 'EXACT_ADDRESS' | 'INTERSECTION' | 'NEIGHBORHOOD' | 'DISTRICT'
export type OccurredAtPrecision = 'EXACT' | 'APPROXIMATE' | 'DAY' | 'UNKNOWN'

export interface HeatmapPoint {
  lat: number
  lng: number
  weight: number
  colorHint: 'red' | 'orange' | 'yellow' | 'gray' | string
  severity: number
  sourceWeight: number
  timeFactor: number
  incidentId: number
  incidentType: IncidentType
  title: string
}

export interface IncidentSummary {
  id: number
  incidentType: IncidentType
  title: string
  summary?: string
  description?: string
  occurredAt: string
  occurredAtPrecision?: OccurredAtPrecision
  address?: string
  exactLocation?: string
  districtName?: string
  district?: { id?: number; name: string }
  province?: string
  department?: string
  lat: number
  lng: number
  geoPrecision?: GeoPrecision
  confidence?: number
  severity?: number
  incidentCount?: number
  status: IncidentStatus
  origin: IncidentOrigin
  victimsCount?: number
  createdAt: string
}

export interface SourceReference {
  sourceItemId: number
  url: string
  title: string
  sourceName: string
}

export interface IncidentDetail extends IncidentSummary {
  llmModel?: string
  evidenceExcerpt?: string
  sources: SourceReference[]
}

export interface IncidentFilters {
  type?: IncidentType | ''
  incidentType?: IncidentType | ''
  status?: IncidentStatus | string
  from?: string
  to?: string
  district?: string
  origin?: IncidentOrigin | ''
  minConfidence?: number
  page?: number
  size?: number
}

// Ingestion and Admin Models
export type SourceType =
  | 'YOUTUBE_CHANNEL'
  | 'NEWSPAPER_RSS'
  | 'NEWSPAPER_HTML'
  | 'INSTITUTIONAL_API'

export type SourceItemStatus =
  | 'DISCOVERED'
  | 'FETCHING'
  | 'CONTENT_READY'
  | 'EXTRACTING'
  | 'PROCESSED'
  | 'FAILED'
  | 'DISCARDED'

export interface NewsSource {
  id: number
  name: string
  type: SourceType
  url: string
  channelId?: string
  credibility: number
  pollIntervalMinutes: number
  active: boolean
  lastPolledAt?: string
  consecutiveFailures: number
  lastError?: string
}

export interface IngestionRun {
  id: number
  sourceId: number
  sourceName: string
  startedAt: string
  finishedAt?: string
  itemsFound: number
  itemsNew: number
  errors: number
  status: 'RUNNING' | 'SUCCESS' | 'FAILED'
}

export interface SourceItem {
  id: number
  sourceName: string
  externalId: string
  url: string
  title: string
  publishedAt: string
  status: SourceItemStatus
  attempts: number
  error?: string
  createdAt: string
}

export interface IncidentReviewRequest {
  status: 'VALIDATED' | 'REJECTED'
  title?: string
  summary?: string
  incidentType?: IncidentType
  lat?: number
  lng?: number
  reviewNotes?: string
}

export interface DatasetImportResult {
  totalRows: number
  importedCount: number
  skippedCount: number
  errors: string[]
}

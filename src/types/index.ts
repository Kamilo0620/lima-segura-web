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
  | 'FEMICIDE'
  | 'ARMED_ROBBERY'
  | 'ROBBERY'
  | 'VEHICLE_THEFT'
  | 'THEFT'
  | 'EXTORTION'
  | 'KIDNAPPING'
  | 'ASSAULT'
  | 'SEXUAL_ASSAULT'
  | 'SHOOTING'
  | 'FRAUD'
  | 'CYBERCRIME'
  | 'DRUG_TRAFFICKING'
  | 'VANDALISM'
  | 'HIT_AND_RUN'
  | 'OTHER'

// Debe coincidir con el enum IncidentOrigin del backend
export type IncidentOrigin =
  | 'NEWS'
  | 'NEWSPAPER'
  | 'YOUTUBE'
  | 'OFFICIAL'
  | 'OFFICIAL_PNP'
  | 'OFFICIAL_INEI'
  | 'CITIZEN'
  | 'SAMPLE'

// Debe coincidir con el enum IncidentStatus del backend
export type IncidentStatus = 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED' | 'VALIDATED' | 'VERIFIED'
export type GeoPrecision =
  | 'ADDRESS'
  | 'EXACT_ADDRESS'
  | 'INTERSECTION'
  | 'NEIGHBORHOOD'
  | 'DISTRICT'
  | 'PROVINCE'
  | 'DEPARTMENT'
export type OccurredAtPrecision = 'EXACT' | 'APPROXIMATE' | 'DAY' | 'UNKNOWN'

export interface HeatmapPoint {
  lat: number
  lng: number
  weight: number
  colorHint: 'red' | 'orange' | 'yellow' | 'gray' | string
  colorHex?: string
  severity: number
  sourceWeight: number
  timeFactor: number
  corroborationCount?: number
  incidentId: number
  incidentType: IncidentType
  title: string
  districtName?: string
  province?: string
  occurredAt?: string
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
  reporterId?: number | null
  confirmationsCount?: number
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
  confirmedByMe?: boolean
}

export interface ConfirmationResult {
  incidentId: number
  confirmations: number
  required: number
  status: IncidentStatus
}

export interface CitizenReportRequest {
  incidentType: IncidentType
  title: string
  summary?: string
  address?: string
  districtName?: string
  lat?: number
  lng?: number
}

export interface DashboardStats {
  totalIncidents: number
  riskLocation: { score: number; level: string; address: string } | null
  hourlyRisk: { hour: string; score: number }[]
  categoryDistribution: { category: string; type: string; percentage: number; count: number; color: string }[]
  topDangerZones: { rank: number; zone: string; level: string; score: number }[]
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
  search?: string
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
  | 'EXTRACTED'
  | 'IRRELEVANT'
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
  status: 'RUNNING' | 'SUCCESS' | 'COMPLETED' | 'FAILED'
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
  importedRows?: number
  filteredOutRows?: number
  errorRows?: number
  message?: string
  errors: string[]
}

export interface OfficialSourceAudit {
  id: string
  name: string
  agency: string
  endpointUrl: string
  reachable: boolean
  updateCadence: string
  latestDataDate: string
  estimatedLagDays?: number | null
  totalRecords?: number | null
  suitableForRealtimeAlerts: boolean
  recommendedRole: string
  noiseAndFilteringNotes: string
}

export interface OfficialSourcesStatusResponse {
  auditedAt: string
  executiveSummary: string
  sources: OfficialSourceAudit[]
}

export interface PipelineTelemetryLog {
  timestamp: string
  stage: string
  level: string
  source: string
  message: string
}

export interface PipelineTelemetryRecentItem {
  id: number
  title: string
  origin: IncidentOrigin | string
  districtName: string
  geoPrecision: string
  llmModel: string
  occurredAt: string
  createdAt: string
}

export interface PipelineTelemetryResponse {
  searchingInternetNow: boolean
  activeOperationsCount: number
  currentOperation: string
  lastActivityAt: string
  totalPublished: number
  realNewspaperCount: number
  realYoutubeCount: number
  citizenCount: number
  sampleBaselineCount: number
  pendingReviewCount: number
  sourceItemsQueued: number
  sourceItemsExtracted: number
  sourceItemsDiscarded: number
  sourceItemsFailed: number
  recentPublished: PipelineTelemetryRecentItem[]
  recentLogs: PipelineTelemetryLog[]
}

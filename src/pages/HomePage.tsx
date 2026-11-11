import { useCallback, useEffect, useMemo, useState } from 'react'
import TopBar from '../components/TopBar'
import Sidebar from '../components/Sidebar'
import IncidentsMap from '../components/IncidentsMap'
import RiskLocationCard from '../components/RiskLocationCard'
import NearbyIncidentsCard from '../components/NearbyIncidentsCard'
import HourlyRiskCard from '../components/HourlyRiskCard'
import CategoryDistributionCard from '../components/CategoryDistributionCard'
import TopDangerZonesCard from '../components/TopDangerZonesCard'
import SecurityAdviceBanner from '../components/SecurityAdviceBanner'
import ReportIncidentModal from '../components/ReportIncidentModal'
import IncidentDetailModal from '../components/IncidentDetailModal'
import { incidentService } from '../services/incidentService'
import { useUserLocation } from '../hooks/useUserLocation'
import type { DashboardStats, HeatmapPoint, IncidentSummary, IncidentType } from '../types'
import { useIncidentStream } from '../hooks/useIncidentStream'
import {
  DISTRICT_METADATA,
  INCIDENT_TYPE_CONFIG,
  getDistrictMeta,
  matchesIncidentSummaryFilters,
  normalizeText,
} from '../utils/constants'
import { Filter, RotateCcw } from 'lucide-react'

const STREET_CRIME_TYPES: IncidentType[] = [
  'ROBBERY',
  'ARMED_ROBBERY',
  'THEFT',
  'VEHICLE_THEFT',
  'EXTORTION',
  'HOMICIDE',
  'SHOOTING',
  'KIDNAPPING',
  'FEMICIDE',
  'ASSAULT',
]

export default function HomePage() {
  const [points, setPoints] = useState<HeatmapPoint[]>([])
  const [recentIncidents, setRecentIncidents] = useState<IncidentSummary[]>([])
  const [selectedIncidentId, setSelectedIncidentId] = useState<number | null>(null)
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [selectedRegion, setSelectedRegion] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [selectedTimeFilter, setSelectedTimeFilter] = useState('Ahora')
  const [selectedCrimeType, setSelectedCrimeType] = useState<IncidentType | ''>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [stats, setStats] = useState<DashboardStats | null>(null)

  // Real browser geolocation and dynamic risk computation
  const { locationState, risk, requestCurrentLocation } = useUserLocation(points)

  // Carga paralela y actualización silenciosa en segundo plano
  const loadData = useCallback(async () => {
    try {
      const [heatmapRes, incidentsRes, statsRes] = await Promise.allSettled([
        incidentService.getHeatmap(),
        incidentService.getIncidents({
          status: 'PUBLISHED',
          size: 160,
        }),
        incidentService.getDashboardStats(),
      ])

      if (heatmapRes.status === 'fulfilled' && Array.isArray(heatmapRes.value)) {
        setPoints(heatmapRes.value)
      }

      if (incidentsRes.status === 'fulfilled') {
        const list = incidentsRes.value.content || []
        const sorted = [...list].sort((a, b) => {
          const aReal = a.origin === 'NEWSPAPER' || a.origin === 'YOUTUBE' || a.origin === 'CITIZEN' ? 1 : 0
          const bReal = b.origin === 'NEWSPAPER' || b.origin === 'YOUTUBE' || b.origin === 'CITIZEN' ? 1 : 0
          if (aReal !== bReal) return bReal - aReal
          return new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
        })
        setRecentIncidents(sorted)
      }

      if (statsRes.status === 'fulfilled' && statsRes.value) {
        setStats(statsRes.value)
      }
    } catch (err) {
      console.error('Error cargando datos del radar delictivo:', err)
    }
  }, [])

  useEffect(() => {
    loadData()
    const bgTimer = setInterval(() => {
      loadData()
    }, 20000)

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadData()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      clearInterval(bgTimer)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [loadData])

  useIncidentStream(() => {
    loadData()
  })

  // Filtrar puntos por tipo de delito y búsqueda (Región, Distrito y Hora se filtran en IncidentsMap y también aquí)
  const prefilteredPoints = useMemo(() => {
    return points.filter((p) => {
      if (selectedCrimeType && p.incidentType !== selectedCrimeType) return false
      if (searchQuery.trim()) {
        const q = normalizeText(searchQuery)
        const haystack = normalizeText(`${p.title} ${p.districtName ?? ''}`)
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [points, selectedCrimeType, searchQuery])

  // Filtrar lista lateral derecha de incidentes según Región, Distrito, Hora, Tipo de Delito y Búsqueda
  const filteredRecentIncidents = useMemo(() => {
    return recentIncidents.filter((inc) =>
      matchesIncidentSummaryFilters(
        inc,
        selectedRegion,
        selectedDistrict,
        selectedTimeFilter,
        selectedCrimeType,
        searchQuery,
      ),
    )
  }, [recentIncidents, selectedRegion, selectedDistrict, selectedTimeFilter, selectedCrimeType, searchQuery])

  const availableDistricts = useMemo(() => {
    if (!selectedRegion) return DISTRICT_METADATA.map((d) => d.name)
    return DISTRICT_METADATA.filter((d) => d.province === selectedRegion).map((d) => d.name)
  }, [selectedRegion])

  const handleTopSearch = (query: string) => {
    const trimmed = query.trim()
    if (!trimmed) {
      setSearchQuery('')
      setSelectedDistrict('')
      return
    }
    const matchedDistrict = getDistrictMeta(trimmed)
    if (matchedDistrict) {
      setSelectedDistrict(matchedDistrict.name)
      setSearchQuery('')
    } else {
      setSearchQuery(trimmed)
    }
  }

  const handleResetFilters = () => {
    setSelectedRegion('')
    setSelectedDistrict('')
    setSelectedTimeFilter('Ahora')
    setSelectedCrimeType('')
    setSearchQuery('')
  }

  const hasActiveFilters =
    Boolean(selectedRegion) ||
    Boolean(selectedDistrict) ||
    selectedTimeFilter !== 'Ahora' ||
    Boolean(selectedCrimeType) ||
    Boolean(searchQuery)

  // Coordenadas exactas del incidente seleccionado para acercar el mapa sin difuminarlo
  const selectedCoords = useMemo<[number, number] | null>(() => {
    if (!selectedIncidentId) return null
    const fromRecent = recentIncidents.find((i) => i.id === selectedIncidentId)
    if (fromRecent && fromRecent.lat != null && fromRecent.lng != null) {
      return [fromRecent.lat, fromRecent.lng]
    }
    const fromPoints = points.find((p) => p.incidentId === selectedIncidentId)
    if (fromPoints && fromPoints.lat != null && fromPoints.lng != null) {
      return [fromPoints.lat, fromPoints.lng]
    }
    const preview = incidentService.getInstantPreview(selectedIncidentId)
    if (preview && preview.lat != null && preview.lng != null) {
      return [preview.lat, preview.lng]
    }
    return null
  }, [selectedIncidentId, recentIncidents, points])

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col font-sans">
      {/* 1. TOP HEADER BAR */}
      <TopBar
        onSearch={handleTopSearch}
        onToggleFilters={() => setFilterDrawerOpen((v) => !v)}
      />

      {/* 2. MAIN APPLICATION WORKSPACE */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Collapsible / Desplegable Sidebar */}
        <Sidebar />

        {/* Center & Right Dashboard Content */}
        <main className="flex-1 flex flex-col p-3 lg:p-4 gap-3 overflow-y-auto">
          {/* Panel Desplegable de Filtros (se abre al pulsar "Filtros" en la barra superior o cuando hay filtros activos) */}
          {(filterDrawerOpen || hasActiveFilters) && (
            <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-slate-800 bg-[#0d1424]/95 px-4 py-3 shadow-xl backdrop-blur-md">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1.5 text-xs font-bold text-red-400 mr-1">
                  <Filter className="h-3.5 w-3.5" />
                  Filtros Activos:
                </span>

                <select
                  value={selectedRegion}
                  onChange={(e) => {
                    const reg = e.target.value
                    setSelectedRegion(reg)
                    if (selectedDistrict && reg) {
                      const meta = getDistrictMeta(selectedDistrict)
                      if (meta && meta.province !== reg) setSelectedDistrict('')
                    }
                  }}
                  className="rounded-xl border border-slate-800 bg-[#070b14] px-3 py-1.5 text-xs font-semibold text-slate-200 focus:border-red-500 focus:outline-none"
                >
                  <option value="">Región: Lima y Callao</option>
                  <option value="Lima">Solo Lima Metropolitana</option>
                  <option value="Callao">Solo Callao</option>
                </select>

                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="rounded-xl border border-slate-800 bg-[#070b14] px-3 py-1.5 text-xs font-semibold text-slate-200 focus:border-red-500 focus:outline-none"
                >
                  <option value="">Distrito: Todos</option>
                  {availableDistricts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedTimeFilter}
                  onChange={(e) => setSelectedTimeFilter(e.target.value)}
                  className="rounded-xl border border-slate-800 bg-[#070b14] px-3 py-1.5 text-xs font-semibold text-slate-200 focus:border-red-500 focus:outline-none"
                >
                  <option value="Ahora">🕒 Ahora (Todos activos)</option>
                  <option value="1h">Última 1 hora</option>
                  <option value="6h">Últimas 6 horas</option>
                  <option value="24h">Últimas 24 horas</option>
                  <option value="48h">Últimas 48 horas</option>
                  <option value="7d">Últimos 7 días</option>
                  <option value="MADRUGADA">🌙 Madrugada (00:00 – 06:00)</option>
                  <option value="MANANA">🌅 Mañana (06:00 – 12:00)</option>
                  <option value="TARDE">☀️ Tarde (12:00 – 18:00)</option>
                  <option value="NOCHE">🌃 Noche (18:00 – 24:00)</option>
                </select>

                <select
                  value={selectedCrimeType}
                  onChange={(e) => setSelectedCrimeType(e.target.value as IncidentType | '')}
                  className="rounded-xl border border-slate-800 bg-[#070b14] px-3 py-1.5 text-xs font-semibold text-slate-200 focus:border-red-500 focus:outline-none"
                >
                  <option value="">Modalidad: Todos los delitos</option>
                  {STREET_CRIME_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {INCIDENT_TYPE_CONFIG[t].label}
                    </option>
                  ))}
                </select>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="flex items-center gap-1.5 rounded-xl border border-red-500/40 bg-red-950/50 px-3 py-1.5 text-xs font-bold text-red-300 hover:bg-red-900/60 transition"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Limpiar filtros</span>
                </button>
              )}
            </div>
          )}

          {/* Upper Section: Map (Left 65%) + Location Risk Cards (Right 35%) */}
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 lg:grid-rows-[500px]">
            {/* Interactive Heatmap Canvas */}
            <div className="lg:col-span-8 h-[380px] lg:h-full">
              <IncidentsMap
                points={prefilteredPoints}
                selectedPointId={selectedIncidentId}
                selectedCoords={selectedCoords}
                onSelectIncident={(id) => setSelectedIncidentId(id)}
                selectedRegion={selectedRegion}
                onSelectRegion={(reg) => setSelectedRegion(reg)}
                selectedDistrict={selectedDistrict}
                onSelectDistrict={(dist) => setSelectedDistrict(dist)}
                selectedTimeFilter={selectedTimeFilter}
                onSelectTimeFilter={(time) => setSelectedTimeFilter(time)}
                userCoords={
                  locationState.lat != null && locationState.lng != null
                    ? [locationState.lat, locationState.lng]
                    : undefined
                }
                userLabel={locationState.district ?? 'TÚ'}
              />
            </div>

            {/* Right Column: Location Risk Badge + Nearby Incidents Feed */}
            <div className="lg:col-span-4 flex min-h-0 flex-col gap-3 lg:h-full">
              <RiskLocationCard
                risk={risk}
                address={locationState.address}
                isGpsActive={locationState.isGpsActive}
                loading={locationState.loading}
                error={locationState.error}
                onRequestGps={requestCurrentLocation}
              />

              <NearbyIncidentsCard
                incidents={filteredRecentIncidents}
                userCoords={
                  locationState.lat != null && locationState.lng != null
                    ? { lat: locationState.lat, lng: locationState.lng }
                    : null
                }
                onSelectIncident={(id) => setSelectedIncidentId(id)}
              />
            </div>
          </div>

          {/* Middle Analytics Section: 3 KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <HourlyRiskCard data={stats?.hourlyRisk} />
            <CategoryDistributionCard
              totalCount={
                stats && stats.totalIncidents > 0
                  ? stats.totalIncidents.toLocaleString('es-PE')
                  : points.length > 0
                    ? points.length.toLocaleString('es-PE')
                    : '—'
              }
              stats={stats?.categoryDistribution}
            />
            <TopDangerZonesCard
              zones={stats?.topDangerZones}
              onSelectZone={(zone) => setSelectedDistrict(zone)}
            />
          </div>

          {/* Bottom Security Advice Banner with Report Incident Action */}
          <SecurityAdviceBanner onOpenReportModal={() => setReportModalOpen(true)} />
        </main>
      </div>

      {/* Citizen Report Modal */}
      <ReportIncidentModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        onIncidentReported={loadData}
      />

      {/* Incident Detail Dossier Modal */}
      {selectedIncidentId && (
        <IncidentDetailModal
          incidentId={selectedIncidentId}
          onClose={() => setSelectedIncidentId(null)}
        />
      )}
    </div>
  )
}

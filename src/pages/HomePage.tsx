import { useCallback, useEffect, useState } from 'react'
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
import type { DashboardStats, HeatmapPoint, IncidentSummary } from '../types'
import { useIncidentStream } from '../hooks/useIncidentStream'

export default function HomePage() {
  const [points, setPoints] = useState<HeatmapPoint[]>([])
  const [recentIncidents, setRecentIncidents] = useState<IncidentSummary[]>([])
  const [selectedIncidentId, setSelectedIncidentId] = useState<number | null>(null)
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [selectedTimeFilter, setSelectedTimeFilter] = useState('Ahora')
  const [stats, setStats] = useState<DashboardStats | null>(null)

  // Real browser geolocation and dynamic risk computation
  const { locationState, risk, requestCurrentLocation } = useUserLocation(points)

  // Fetch heatmap and incidents
  const loadData = useCallback(async () => {
    try {
      // 1. Fetch Heatmap Points
      const heatmapData = await incidentService.getHeatmap()
      setPoints(Array.isArray(heatmapData) ? heatmapData : [])

      // 2. Fetch Recent Incidents
      const incidentsData = await incidentService.getIncidents({
        district: selectedDistrict || undefined,
        size: 20,
      })
      const list = incidentsData.content || []
      setRecentIncidents(list)

      // 3. Fetch Dashboard Stats from Backend
      try {
        const statsData = await incidentService.getDashboardStats()
        if (statsData) {
          setStats(statsData)
        }
      } catch {
        // Fallback handled by individual cards
      }
    } catch (err) {
      console.error('Error cargando datos del radar delictivo:', err)
    }
  }, [selectedDistrict])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Tiempo real: cuando el backend publica un incidente, recargamos el mapa y las tarjetas
  useIncidentStream(() => {
    loadData()
  })

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col font-sans">
      {/* 1. TOP HEADER BAR */}
      <TopBar
        onSearch={(query) => setSelectedDistrict(query)}
        onToggleFilters={() => setSelectedDistrict('')}
      />

      {/* 2. MAIN APPLICATION WORKSPACE */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Center & Right Dashboard Content */}
        <main className="flex-1 flex flex-col p-3 lg:p-4 gap-3 overflow-y-auto">
          {/* Upper Section: Map (Left 65%) + Location Risk Cards (Right 35%) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-[460px] lg:h-[500px]">
            {/* Interactive Heatmap Canvas */}
            <div className="lg:col-span-8 h-[380px] lg:h-full">
              <IncidentsMap
                points={points}
                selectedPointId={selectedIncidentId}
                onSelectIncident={(id) => setSelectedIncidentId(id)}
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
            <div className="lg:col-span-4 flex flex-col gap-3 h-full">
              <RiskLocationCard
                risk={risk}
                address={locationState.address}
                isGpsActive={locationState.isGpsActive}
                loading={locationState.loading}
                error={locationState.error}
                onRequestGps={requestCurrentLocation}
              />

              <NearbyIncidentsCard
                incidents={recentIncidents}
                userCoords={
                  locationState.lat != null && locationState.lng != null
                    ? { lat: locationState.lat, lng: locationState.lng }
                    : null
                }
                onSelectIncident={(id) => setSelectedIncidentId(id)}
              />
            </div>
          </div>

          {/* Middle Analytics Section: 3 KPI Cards matching Mockup */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <HourlyRiskCard data={stats?.hourlyRisk} />
            <CategoryDistributionCard
              totalCount={stats ? stats.totalIncidents.toLocaleString('es-PE') : '—'}
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

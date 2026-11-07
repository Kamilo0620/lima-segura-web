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
import type { HeatmapPoint, IncidentSummary } from '../types'

export default function HomePage() {
  const [points, setPoints] = useState<HeatmapPoint[]>([])
  const [recentIncidents, setRecentIncidents] = useState<IncidentSummary[]>([])
  const [selectedIncidentId, setSelectedIncidentId] = useState<number | null>(null)
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [selectedTimeFilter, setSelectedTimeFilter] = useState('Ahora')
  const [stats, setStats] = useState<any>(null)

  // Real browser geolocation and dynamic risk computation
  const { locationState, requestCurrentLocation } = useUserLocation(points)

  // Fetch heatmap and incidents
  const loadData = useCallback(async () => {
    try {
      // 1. Fetch Heatmap Points
      const heatmapData = await incidentService.getHeatmap()
      if (Array.isArray(heatmapData) && heatmapData.length > 0) {
        setPoints(heatmapData)
      }

      // 2. Fetch Recent Incidents
      const incidentsData = await incidentService.getIncidents({
        district: selectedDistrict || undefined,
        size: 20,
      })
      const list = incidentsData.content || []
      setRecentIncidents(list)

      // Fallback if heatmap was empty
      if ((!heatmapData || heatmapData.length === 0) && list.length > 0) {
        const fallback = list
          .filter((i) => i.lat && i.lng)
          .map((i) => ({
            incidentId: i.id,
            title: i.title,
            lat: i.lat,
            lng: i.lng,
            incidentType: i.incidentType,
            weight: (i.confidence || 0.8) * 8.0,
            colorHint: 'red',
            severity: 8,
            sourceWeight: 0.9,
            timeFactor: 1.0,
          }))
        setPoints(fallback)
      }

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

  // Listen to SSE live incidents
  useEffect(() => {
    let es: EventSource | null = null
    try {
      es = incidentService.createEventSource()
      es.addEventListener('incident_published', () => {
        loadData()
      })
    } catch {
      // Ignore SSE error
    }
    return () => {
      if (es) es.close()
    }
  }, [loadData])

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
                userCoords={[locationState.lat, locationState.lng]}
                userLabel={locationState.district}
              />
            </div>

            {/* Right Column: Location Risk Badge + Nearby Incidents Feed */}
            <div className="lg:col-span-4 flex flex-col gap-3 h-full">
              <RiskLocationCard
                score={locationState.riskScore}
                level={locationState.riskLevel}
                address={locationState.address}
                radiusMeters={locationState.radiusMeters}
                trendPercent={locationState.trendPercent}
                isGpsActive={locationState.isGpsActive}
                loading={locationState.loading}
                onRequestGps={requestCurrentLocation}
              />

              <NearbyIncidentsCard
                incidents={recentIncidents}
                onSelectIncident={(id) => setSelectedIncidentId(id)}
              />
            </div>
          </div>

          {/* Middle Analytics Section: 3 KPI Cards matching Mockup */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <HourlyRiskCard data={stats?.hourlyRisk} />
            <CategoryDistributionCard
              totalCount={stats?.totalIncidents ? `${stats.totalIncidents}` : '1,248'}
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

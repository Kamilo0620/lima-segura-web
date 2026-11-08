import { useState, useEffect, useCallback } from 'react'
import Sidebar from '../components/Sidebar'
import IncidentsMap from '../components/IncidentsMap'
import IncidentDetailModal from '../components/IncidentDetailModal'
import { incidentService } from '../services/incidentService'
import { useUserLocation } from '../hooks/useUserLocation'
import type { HeatmapPoint, IncidentSummary } from '../types'
import { RefreshCw, ShieldAlert, Sparkles } from 'lucide-react'
import { INCIDENT_TYPE_CONFIG } from '../utils/constants'

export default function MapRiskPage() {
  const [points, setPoints] = useState<HeatmapPoint[]>([])
  const [recentIncidents, setRecentIncidents] = useState<IncidentSummary[]>([])
  const [selectedIncidentId, setSelectedIncidentId] = useState<number | null>(null)
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [selectedTimeFilter, setSelectedTimeFilter] = useState('Ahora')
  const [loading, setLoading] = useState(false)

  const { locationState, risk, requestCurrentLocation } = useUserLocation(points)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const heatmap = await incidentService.getHeatmap()
      if (Array.isArray(heatmap)) {
        setPoints(heatmap)
      }
      const incidentsData = await incidentService.getIncidents({
        district: selectedDistrict || undefined,
        size: 30,
      })
      setRecentIncidents(incidentsData.content || [])
    } catch (err) {
      console.error('Error cargando mapa de riesgo:', err)
    } finally {
      setLoading(false)
    }
  }, [selectedDistrict])

  useEffect(() => {
    loadData()
  }, [loadData])

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-[#050811] text-slate-100">
      <Sidebar />

      <main className="flex-1 flex flex-col p-3 lg:p-4 gap-3 overflow-hidden">
        {/* Top Header Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-[#0d1424]/90 px-4 py-3 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-950/80 border border-red-500/40 text-red-400">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white flex items-center gap-2">
                Mapa Delictivo Integral de Lima y Callao
                <span className="flex items-center gap-1 rounded-full bg-red-950/60 border border-red-500/40 px-2 py-0.5 text-[10px] font-bold text-red-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                  {points.length} Puntos Activos
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Monitoreo espacial de focos delictivos, densidad criminal y radio de riesgo localizado.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
              title="Actualizar datos"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Actualizar</span>
            </button>

            <button
              onClick={requestCurrentLocation}
              className="flex items-center gap-1.5 rounded-xl border border-blue-500/40 bg-blue-950/60 px-3 py-1.5 text-xs font-bold text-blue-300 hover:bg-blue-900/60 transition"
            >
              <Sparkles className="h-3.5 w-3.5 text-blue-400" />
              <span>Evaluar Mi Posición</span>
            </button>
          </div>
        </div>

        {/* Map & Live Feed Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-[500px]">
          {/* Main Map */}
          <div className="lg:col-span-9 h-full rounded-2xl overflow-hidden border border-slate-800">
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

          {/* Side Drawer: Critical Points & Risk Index */}
          <div className="lg:col-span-3 flex flex-col gap-3 h-full overflow-hidden">
            {/* Risk Index Summary Card */}
            <div className="rounded-2xl border border-slate-800 bg-[#0d1424]/90 p-4">
              <div className="text-xs font-bold text-slate-300 mb-2">Evaluación del Sector</div>
              {risk ? (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-black text-red-500">{risk.score}/100</div>
                    <div className="text-xs font-bold text-slate-300">{locationState.district ?? 'Tu ubicación'}</div>
                    <div className="text-[11px] text-slate-400 truncate max-w-[180px]">{locationState.address}</div>
                    <div className="text-[10px] text-slate-500">{risk.nearbyCount} incidentes a menos de 1 km</div>
                  </div>
                  <div className="rounded-xl border border-red-500/50 bg-red-950/60 px-2.5 py-1 text-center font-black text-xs text-red-400">
                    {risk.level}
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-[11px] text-slate-400">
                  <p>{locationState.loading ? 'Obteniendo tu ubicación...' : locationState.error ?? 'Activa tu ubicación para evaluar tu zona.'}</p>
                  <button onClick={requestCurrentLocation} className="rounded-lg bg-slate-800 px-2.5 py-1 font-bold text-slate-200 hover:bg-slate-700">
                    Usar mi ubicación
                  </button>
                </div>
              )}
            </div>

            {/* Incident Feed List */}
            <div className="flex-1 rounded-2xl border border-slate-800 bg-[#0d1424]/90 p-3 flex flex-col overflow-hidden">
              <div className="text-xs font-bold text-slate-200 mb-2 flex items-center justify-between">
                <span>Incidentes Notificados</span>
                <span className="text-[10px] text-slate-400">{recentIncidents.length} recientes</span>
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                {recentIncidents.map((inc) => (
                  <div
                    key={inc.id}
                    onClick={() => setSelectedIncidentId(inc.id)}
                    className="p-2.5 rounded-xl border border-slate-800/80 bg-[#070b14]/80 hover:border-slate-700 hover:bg-slate-900/60 cursor-pointer transition text-xs"
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-red-400">{INCIDENT_TYPE_CONFIG[inc.incidentType]?.label ?? inc.incidentType}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {inc.districtName || inc.district?.name || 'Lima'}
                      </span>
                    </div>
                    <div className="text-slate-200 font-semibold mt-1 line-clamp-2 leading-tight">
                      {inc.title}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 truncate">
                      {inc.address || inc.exactLocation || inc.summary || inc.description || 'Lima Metropolitana'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {selectedIncidentId && (
        <IncidentDetailModal
          incidentId={selectedIncidentId}
          onClose={() => setSelectedIncidentId(null)}
        />
      )}
    </div>
  )
}

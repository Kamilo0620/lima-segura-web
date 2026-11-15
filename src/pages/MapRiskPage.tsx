import { useCallback, useEffect, useMemo, useState } from 'react'
import { Layers, ListFilter, MapPin, RefreshCw, ShieldAlert, X } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import IncidentsMap from '../components/IncidentsMap'
import IncidentDetailModal from '../components/IncidentDetailModal'
import { incidentService } from '../services/incidentService'
import { useUserLocation } from '../hooks/useUserLocation'
import { useIncidentStream } from '../hooks/useIncidentStream'
import type { HeatmapPoint, IncidentSummary, IncidentType } from '../types'
import {
  INCIDENT_TYPE_CONFIG,
  formatTimeAgo,
  matchesIncidentSummaryFilters,
  matchesTimeFilter,
  normalizeText,
  resolvePointDistrictAndProvince,
} from '../utils/constants'

const TACTICAL_LAYERS: { key: '' | IncidentType; label: string }[] = [
  { key: '', label: 'Todos los delitos' },
  { key: 'HOMICIDE', label: 'Sicariato / Homicidio' },
  { key: 'SHOOTING', label: 'Balacera' },
  { key: 'EXTORTION', label: 'Extorsión' },
  { key: 'ARMED_ROBBERY', label: 'Robo Armado' },
  { key: 'ROBBERY', label: 'Robo / Asalto' },
  { key: 'FEMICIDE', label: 'Feminicidio' },
  { key: 'KIDNAPPING', label: 'Secuestro' },
]

export default function MapRiskPage() {
  const [points, setPoints] = useState<HeatmapPoint[]>([])
  const [recentIncidents, setRecentIncidents] = useState<IncidentSummary[]>([])
  const [selectedIncidentId, setSelectedIncidentId] = useState<number | null>(null)
  const [selectedCoords, setSelectedCoords] = useState<[number, number] | null>(null)
  const [selectedRegion, setSelectedRegion] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [selectedTimeFilter, setSelectedTimeFilter] = useState('Ahora')
  const [selectedType, setSelectedType] = useState<'' | IncidentType>('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const { locationState, risk, requestCurrentLocation } = useUserLocation(points)

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const [heatmapRes, listRes] = await Promise.all([
        incidentService.getHeatmap(),
        incidentService.getIncidents({ status: 'PUBLISHED', page: 0, size: 120 }),
      ])
      setPoints(heatmapRes || [])
      setRecentIncidents(listRes.content || [])
    } catch {
      // Mantiene los datos previos visibles en pantalla si ocurre un corte momentáneo
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData(false)
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadData(true)
      }
    }, 6000)
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadData(true)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [loadData])

  useIncidentStream(() => {
    loadData(true)
  }, 250)

  const filteredPoints = useMemo(() => {
    return points.filter((p) => {
      if (selectedType && p.incidentType !== selectedType) {
        return false
      }
      if (!matchesTimeFilter(selectedTimeFilter, p.occurredAt, p.timeFactor, p.incidentId)) {
        return false
      }
      if (selectedRegion || selectedDistrict) {
        const resolved = resolvePointDistrictAndProvince(p)
        if (selectedRegion && normalizeText(resolved.province) !== normalizeText(selectedRegion)) {
          return false
        }
        if (selectedDistrict && normalizeText(resolved.district) !== normalizeText(selectedDistrict)) {
          return false
        }
      }
      return true
    })
  }, [points, selectedType, selectedRegion, selectedDistrict, selectedTimeFilter])

  const filteredIncidents = useMemo(() => {
    return recentIncidents.filter((inc) =>
      matchesIncidentSummaryFilters(inc, selectedRegion, selectedDistrict, selectedTimeFilter, selectedType),
    )
  }, [recentIncidents, selectedRegion, selectedDistrict, selectedTimeFilter, selectedType])

  const userCoords: [number, number] | undefined =
    locationState.lat != null && locationState.lng != null ? [locationState.lat, locationState.lng] : undefined

  return (
    <div className="flex h-[calc(100vh-64px)] min-h-[580px] overflow-hidden bg-[#060913] text-slate-100">
      <Sidebar />

      <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Barra superior táctica compacta: distingue /mapa como explorador geoespacial puro sin recargar la vista */}
        <header className="z-20 shrink-0 border-b border-slate-800/80 bg-[#070b14]/95 px-4 py-2.5 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-500/30 bg-blue-950/60 text-blue-400">
                <Layers className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-extrabold tracking-tight text-white">
                    Explorador Geoespacial · Lima y Callao
                  </h1>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/50 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {filteredPoints.length} focos en radar
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Vista cartográfica limpia con proporción 1:1 y capas delictivas instantáneas
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={requestCurrentLocation}
                className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/90 px-2.5 py-1.5 text-[11px] font-semibold text-slate-300 hover:border-blue-500/40 hover:text-white transition"
                title="Ubicar y calcular riesgo en mi radio de 1 km"
              >
                <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                <span>
                  {locationState.isGpsActive && risk
                    ? `Mi zona: ${risk.level} (${risk.score}/100)`
                    : locationState.district || 'Ubicar mi zona'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setDrawerOpen((prev) => !prev)}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] font-bold transition ${
                  drawerOpen
                    ? 'border-blue-500/60 bg-blue-600/20 text-blue-200'
                    : 'border-slate-800 bg-slate-900/90 text-slate-300 hover:border-slate-700 hover:text-white'
                }`}
              >
                <ListFilter className="h-3.5 w-3.5" />
                <span>Inspección ({filteredIncidents.length})</span>
              </button>

              <button
                type="button"
                onClick={() => loadData(false)}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-[11px] font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Sincronizar</span>
              </button>
            </div>
          </div>

          {/* Capas rápidas por modalidad delictiva */}
          <div className="mt-2 flex items-center gap-1.5 overflow-x-auto pb-0.5">
            {TACTICAL_LAYERS.map((layer) => {
              const active = selectedType === layer.key
              return (
                <button
                  key={layer.label}
                  type="button"
                  onClick={() => setSelectedType(layer.key)}
                  className={`shrink-0 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
                    active
                      ? 'border-blue-500 bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                      : 'border-slate-800/90 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {layer.label}
                </button>
              )
            })}
          </div>
        </header>

        {/* Lienzo geoespacial 100% fijo: nunca crece con listas largas ni deforma el aspect ratio del canvas */}
        <div className="relative min-h-0 w-full flex-1 overflow-hidden">
          <IncidentsMap
            points={filteredPoints}
            selectedPointId={selectedIncidentId}
            selectedCoords={selectedCoords}
            onSelectIncident={(id) => {
              const match = points.find((pt) => pt.incidentId === id)
              if (match) setSelectedCoords([match.lat, match.lng])
              setSelectedIncidentId(id)
            }}
            selectedRegion={selectedRegion}
            onSelectRegion={setSelectedRegion}
            selectedDistrict={selectedDistrict}
            onSelectDistrict={setSelectedDistrict}
            selectedTimeFilter={selectedTimeFilter}
            onSelectTimeFilter={setSelectedTimeFilter}
            userCoords={userCoords}
            userLabel={locationState.district || 'Tu ubicación'}
          />

          {/* Cajón flotante colapsable sobre el mapa (cero redimensionamiento del canvas subyacente) */}
          {drawerOpen && (
            <aside className="absolute right-3 top-3 bottom-3 z-[460] flex w-80 sm:w-96 flex-col rounded-2xl border border-slate-700/80 bg-[#080e1d]/95 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
                <div>
                  <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-200">
                    Hechos en el Área Filtrada
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    {filteredIncidents.length} hechos recientes · clic para centrar mapa
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Cerrar panel de inspección"
                  className="rounded-lg border border-slate-800 bg-slate-900 p-1.5 text-slate-400 hover:text-white transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {filteredIncidents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-xs text-slate-400">
                    <ShieldAlert className="mb-2 h-7 w-7 text-slate-600" />
                    No hay incidentes que coincidan con el filtro seleccionado.
                  </div>
                ) : (
                  filteredIncidents.slice(0, 60).map((inc) => {
                    const typeCfg = INCIDENT_TYPE_CONFIG[inc.incidentType] || INCIDENT_TYPE_CONFIG.OTHER
                    const dist = inc.districtName || inc.district?.name || 'Lima'
                    return (
                      <button
                        key={inc.id}
                        type="button"
                        onClick={() => {
                          setSelectedCoords([inc.lat, inc.lng])
                          setSelectedIncidentId(inc.id)
                        }}
                        className={`w-full rounded-xl border p-3 text-left transition ${
                          selectedIncidentId === inc.id
                            ? 'border-blue-500/70 bg-blue-950/40'
                            : 'border-slate-800/90 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
                        }`}
                      >
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <span className={`text-[10px] font-bold uppercase ${typeCfg.color}`}>
                            {typeCfg.label}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {formatTimeAgo(inc.occurredAt || inc.createdAt)}
                          </span>
                        </div>
                        <p className="line-clamp-2 text-xs font-semibold leading-snug text-slate-100">
                          {inc.title}
                        </p>
                        <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
                          <span className="truncate">{dist}</span>
                          <span>Gravedad {inc.severity ?? typeCfg.severity}/10</span>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </aside>
          )}
        </div>
      </main>

      {selectedIncidentId !== null && (
        <IncidentDetailModal incidentId={selectedIncidentId} onClose={() => setSelectedIncidentId(null)} />
      )}
    </div>
  )
}

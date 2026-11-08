import { useEffect, useMemo, useState } from 'react'
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { HeatmapPoint } from '../types'
import { INCIDENT_TYPE_CONFIG, LIMA_DISTRICTS } from '../utils/constants'
import { Eye, Flame, Layers, LocateFixed, Minus, Navigation, Plus, Satellite, Map as MapIcon, ChevronDown } from 'lucide-react'

// Fix default Leaflet icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Custom SVG icon generator for cyber crime pins
function createCustomPin(color: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 44" width="36" height="44">
      <defs>
        <filter id="glow-${color.replace('#', '')}" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <path d="M18 0 C8.06 0 0 8.06 0 18 C0 29.5 18 44 18 44 C18 44 36 29.5 36 18 C36 8.06 27.94 0 18 0 Z" 
            fill="#090d16" stroke="${color}" stroke-width="2.5" filter="url(#glow-${color.replace('#', '')})" />
      <circle cx="18" cy="18" r="7" fill="${color}" opacity="0.9" />
      <circle cx="18" cy="18" r="3" fill="#ffffff" />
    </svg>
  `
  return L.divIcon({
    className: 'custom-crime-pin',
    html: svg,
    iconSize: [36, 44],
    iconAnchor: [18, 44],
    popupAnchor: [0, -42],
  })
}

// User location pulsating pin (matches mockup, dynamic label)
function createUserLocationPin(label: string = 'MI UBICACIÓN') {
  const html = `
    <div class="relative flex items-center justify-center">
      <div class="absolute h-10 w-10 rounded-full bg-blue-500/40 animate-ping"></div>
      <div class="relative flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-blue-600 shadow-[0_0_15px_#3b82f6]">
        <div class="h-2.5 w-2.5 rounded-full bg-white"></div>
      </div>
      <div class="absolute -bottom-6 rounded-md bg-blue-950/90 border border-blue-500/60 px-2 py-0.5 text-[10px] font-black text-white tracking-wider shadow-lg pointer-events-none whitespace-nowrap">
        ${label.toUpperCase()}
      </div>
    </div>
  `
  return L.divIcon({
    className: 'user-pin-marker',
    html,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  })
}

// Controller component to zoom/center programmatically
function MapController({
  selectedPoint,
  targetCenter,
  zoomAction,
}: {
  selectedPoint?: HeatmapPoint | null
  targetCenter?: [number, number] | null
  zoomAction?: number | null
}) {
  const map = useMap()

  useEffect(() => {
    if (selectedPoint && selectedPoint.lat && selectedPoint.lng) {
      map.flyTo([selectedPoint.lat, selectedPoint.lng], 16, { duration: 1.2 })
    }
  }, [selectedPoint, map])

  useEffect(() => {
    if (targetCenter) {
      map.flyTo(targetCenter, 15, { duration: 1.0 })
    }
  }, [targetCenter, map])

  useEffect(() => {
    if (zoomAction === 1) map.zoomIn()
    if (zoomAction === -1) map.zoomOut()
  }, [zoomAction, map])

  return null
}

interface IncidentsMapProps {
  points: HeatmapPoint[]
  selectedPointId?: number | null
  onSelectIncident: (incidentId: number) => void
  showHeatCircles?: boolean
  showMarkers?: boolean
  selectedDistrict?: string
  onSelectDistrict?: (district: string) => void
  selectedTimeFilter?: string
  onSelectTimeFilter?: (time: string) => void
  userCoords?: [number, number]
  userLabel?: string
}

const COLOR_MAP: Record<string, string> = {
  red: '#ef4444',
  orange: '#f97316',
  yellow: '#eab308',
  gray: '#64748b',
}

type MapTheme = 'dark' | 'osm' | 'satellite'

export default function IncidentsMap({
  points,
  selectedPointId,
  onSelectIncident,
  showHeatCircles = true,
  showMarkers = true,
  selectedDistrict = '',
  onSelectDistrict,
  selectedTimeFilter = 'Ahora',
  onSelectTimeFilter,
  userCoords,
  userLabel = 'TÚ',
}: IncidentsMapProps) {
  // Centro de Lima si todavía no tenemos la ubicación del usuario
  const defaultCenter: [number, number] = userCoords || [-12.0464, -77.0428]
  const [theme, setTheme] = useState<MapTheme>('dark')
  const [zoomTrigger, setZoomTrigger] = useState<number | null>(null)
  const [recenterTarget, setRecenterTarget] = useState<[number, number] | null>(null)
  const [themeMenuOpen, setThemeMenuOpen] = useState(false)

  const selectedPoint = useMemo(
    () => points.find((p) => p.incidentId === selectedPointId),
    [points, selectedPointId],
  )

  const handleRecenter = () => {
    setRecenterTarget([...defaultCenter])
    setTimeout(() => setRecenterTarget(null), 500)
  }

  const handleZoom = (delta: number) => {
    setZoomTrigger(delta)
    setTimeout(() => setZoomTrigger(null), 100)
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-slate-800 bg-[#070b14] shadow-2xl">
      {/* 1. TOP OVERLAY FILTER BAR (Matches Mockup) */}
      <div className="absolute left-4 top-4 z-[1000] flex flex-wrap items-center gap-2">
        {/* Dropdown 1: Región */}
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-[#0d1424]/90 px-3 py-1.5 text-xs font-semibold text-slate-200 shadow-xl backdrop-blur-md">
          <span>Lima Metropolitana</span>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        </div>

        {/* Dropdown 2: Distrito */}
        <div className="relative">
          <select
            value={selectedDistrict}
            onChange={(e) => onSelectDistrict && onSelectDistrict(e.target.value)}
            className="appearance-none rounded-xl border border-slate-800 bg-[#0d1424]/90 py-1.5 pl-3 pr-8 text-xs font-semibold text-slate-200 shadow-xl backdrop-blur-md focus:border-red-500 focus:outline-none cursor-pointer"
          >
            <option value="">Todos los distritos</option>
            {LIMA_DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        </div>

        {/* Dropdown 3: Franja Temporal */}
        <div className="relative">
          <select
            value={selectedTimeFilter}
            onChange={(e) => onSelectTimeFilter && onSelectTimeFilter(e.target.value)}
            className="appearance-none rounded-xl border border-slate-800 bg-[#0d1424]/90 py-1.5 pl-3 pr-8 text-xs font-semibold text-slate-200 shadow-xl backdrop-blur-md focus:border-red-500 focus:outline-none cursor-pointer"
          >
            <option value="Ahora">🕒 Ahora</option>
            <option value="6h">Últimas 6 horas</option>
            <option value="24h">Últimas 24 horas</option>
            <option value="7d">Últimos 7 días</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        </div>
      </div>

      {/* 2. LEFT MAP CONTROLS (Zoom, Recenter, Layers) */}
      <div className="absolute left-4 top-20 z-[1000] flex flex-col gap-1.5">
        <button
          onClick={() => handleZoom(1)}
          title="Acercar mapa"
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-800 bg-[#0d1424]/90 text-slate-300 shadow-xl backdrop-blur-md hover:bg-slate-800 hover:text-white transition"
        >
          <Plus className="h-4 w-4" />
        </button>

        <button
          onClick={() => handleZoom(-1)}
          title="Alejar mapa"
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-800 bg-[#0d1424]/90 text-slate-300 shadow-xl backdrop-blur-md hover:bg-slate-800 hover:text-white transition"
        >
          <Minus className="h-4 w-4" />
        </button>

        <button
          onClick={handleRecenter}
          title="Centrar en mi ubicación"
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-800 bg-[#0d1424]/90 text-blue-400 shadow-xl backdrop-blur-md hover:bg-blue-950/80 hover:text-blue-300 transition"
        >
          <LocateFixed className="h-4 w-4" />
        </button>

        {/* Layer Theme Switcher */}
        <div className="relative">
          <button
            onClick={() => setThemeMenuOpen(!themeMenuOpen)}
            title="Cambiar capa de mapa"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-800 bg-[#0d1424]/90 text-slate-300 shadow-xl backdrop-blur-md hover:bg-slate-800 hover:text-white transition"
          >
            <Layers className="h-4 w-4" />
          </button>

          {themeMenuOpen && (
            <div className="absolute left-10 top-0 w-36 rounded-xl border border-slate-800 bg-[#090d16] p-1.5 shadow-2xl z-50">
              <button
                onClick={() => {
                  setTheme('dark')
                  setThemeMenuOpen(false)
                }}
                className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                  theme === 'dark' ? 'bg-red-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Navigation className="h-3 w-3" />
                <span>Radar Oscuro</span>
              </button>
              <button
                onClick={() => {
                  setTheme('osm')
                  setThemeMenuOpen(false)
                }}
                className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                  theme === 'osm' ? 'bg-red-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <MapIcon className="h-3 w-3" />
                <span>Callejero</span>
              </button>
              <button
                onClick={() => {
                  setTheme('satellite')
                  setThemeMenuOpen(false)
                }}
                className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                  theme === 'satellite' ? 'bg-red-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Satellite className="h-3 w-3" />
                <span>Satélite</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. LEAFLET MAP CONTAINER */}
      <MapContainer
        center={defaultCenter}
        zoom={13}
        zoomControl={false}
        className="h-full w-full"
        style={{ background: '#070b14' }}
      >
        {/* Esri World Dark Gray Canvas (Free, Crisp, No API key) */}
        {theme === 'dark' && (
          <>
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />
            <TileLayer
              attribution=""
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />
          </>
        )}

        {theme === 'osm' && (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
        )}

        {theme === 'satellite' && (
          <TileLayer
            attribution='&copy; <a href="https://www.esri.com/">Esri World Imagery</a>'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={19}
          />
        )}

        <MapController
          selectedPoint={selectedPoint}
          targetCenter={recenterTarget}
          zoomAction={zoomTrigger}
        />

        {/* 4. Dynamic User Location Pulsing Pin (Matches Mockup) */}
        {userCoords && <Marker position={userCoords} icon={createUserLocationPin(userLabel)} />}

        {/* 5. Glowing Heat Circles along avenues and hotspots */}
        {showHeatCircles &&
          points.map((p) => {
            const hexColor = COLOR_MAP[p.colorHint] || '#ef4444'
            const radius = Math.min(850, Math.max(220, (p.weight || 1) * 140))

            return (
              <Circle
                key={`heat-${p.incidentId}`}
                center={[p.lat, p.lng]}
                radius={radius}
                pathOptions={{
                  color: hexColor,
                  fillColor: hexColor,
                  fillOpacity: Math.min(0.55, Math.max(0.18, (p.weight || 1) * 0.08)),
                  weight: 1.2,
                  opacity: 0.75,
                }}
              />
            )
          })}

        {/* 6. Tactical Crime Pins */}
        {showMarkers &&
          points.map((p) => {
            const config = INCIDENT_TYPE_CONFIG[p.incidentType] || INCIDENT_TYPE_CONFIG.OTHER
            const hexColor = COLOR_MAP[p.colorHint] || '#ef4444'
            const pinIcon = createCustomPin(hexColor)

            return (
              <Marker
                key={`marker-${p.incidentId}`}
                position={[p.lat, p.lng]}
                icon={pinIcon}
                eventHandlers={{
                  click: () => onSelectIncident(p.incidentId),
                }}
              >
                <Popup className="cyber-popup">
                  <div className="min-w-[210px] p-1 text-slate-100">
                    <div className="mb-1 flex items-center justify-between">
                      <span
                        className="rounded px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase"
                        style={{ backgroundColor: `${hexColor}25`, color: hexColor }}
                      >
                        {config.label}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Gravedad: {p.severity}/10
                      </span>
                    </div>

                    <h4 className="line-clamp-2 text-xs font-bold text-white">
                      {p.title || 'Incidente Delictivo'}
                    </h4>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Flame className="h-3 w-3 text-orange-400" />
                        Intensidad: {(p.weight || 0).toFixed(1)}
                      </span>
                      <span className="capitalize">{p.colorHint}</span>
                    </div>

                    <button
                      onClick={() => onSelectIncident(p.incidentId)}
                      className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-lg transition hover:bg-red-500"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Ver Detalles
                    </button>
                  </div>
                </Popup>
              </Marker>
            )
          })}
      </MapContainer>
    </div>
  )
}

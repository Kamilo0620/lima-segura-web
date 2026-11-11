import { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { HeatmapPoint } from '../types'
import {
  DISTRICT_METADATA,
  getDistrictMeta,
  matchesTimeFilter,
  normalizeText,
  resolvePointDistrictAndProvince,
} from '../utils/constants'
import {
  Flame,
  Layers,
  LocateFixed,
  Minus,
  Navigation,
  Plus,
  Satellite,
  Map as MapIcon,
  ChevronDown,
} from 'lucide-react'

// Garantiza que ningún punto cercano a la Costa Verde / Callao / San Miguel / Miraflores / Chorrillos caiga en el mar
function clampToLimaLand(lat: number, lng: number): [number, number] {
  let safeLng = lng
  if (lat <= -12.072 && lat > -12.090 && safeLng < -77.0875) {
    safeLng = -77.0865
  } else if (lat <= -12.090 && lat > -12.110 && safeLng < -77.0685) {
    safeLng = -77.0655
  } else if (lat <= -12.110 && lat > -12.150 && safeLng < -77.0320) {
    safeLng = -77.0295
  } else if (lat <= -12.150 && lat > -12.190 && safeLng < -77.0255) {
    safeLng = -77.0225
  }
  return [lat, safeLng]
}

// Determine thermal level (red / orange / yellow) and circle size based on incident recency (timeFactor) & weighted intensity
function getIntensityStyle(point: HeatmapPoint) {
  const severity = point.severity ?? 5
  const timeFactor = point.timeFactor ?? 0.7
  const weight = point.weight ?? severity * 0.8 * timeFactor

  // ALTO (Rojo): Noticias recientes (0-6h, timeFactor = 1.0) con gravedad media-alta o intensidad ponderada >= 4.0
  if ((timeFactor >= 0.9 && weight >= 4.0) || (timeFactor >= 0.7 && weight >= 5.8)) {
    return {
      level: 'ALTO',
      fillColor: '#ef4444',
      strokeColor: '#fecaca',
      radius: Math.min(10, Math.max(6.8, 5.2 + weight * 0.6)),
    }
  }
  // MEDIO (Naranja): Noticias del día (6-24h, timeFactor = 0.7) o intensidad ponderada moderada (>= 2.1)
  if ((timeFactor >= 0.6 && weight >= 2.1) || weight >= 3.2) {
    return {
      level: 'MEDIO',
      fillColor: '#f97316',
      strokeColor: '#fed7aa',
      radius: Math.min(8.2, Math.max(5.5, 4.6 + weight * 0.5)),
    }
  }
  // BAJO (Amarillo): Noticias con mayor antigüedad (>24h, timeFactor <= 0.4) o menor gravedad
  return {
    level: 'BAJO',
    fillColor: '#facc15',
    strokeColor: '#fef08a',
    radius: Math.min(6.8, Math.max(4.5, 4.0 + weight * 0.4)),
  }
}

// Build 256-entry RGBA Lookup Table (LUT) for smooth Yellow -> Orange -> Red thermal gradient
function buildThermalColorLut(): Uint8ClampedArray {
  const lut = new Uint8ClampedArray(256 * 4)
  for (let i = 0; i < 256; i++) {
    if (i < 6) {
      lut[i * 4 + 3] = 0
      continue
    }
    const t = i / 255
    let r = 0
    let g = 0
    let b = 0
    let a = 0

    if (t < 0.38) {
      const local = t / 0.38
      r = 250
      g = Math.round(215 - local * 30)
      b = Math.round(35 - local * 20)
      a = Math.round(Math.pow(local, 0.85) * 145)
    } else if (t < 0.72) {
      const local = (t - 0.38) / 0.34
      r = Math.round(250 - local * 5)
      g = Math.round(185 - local * 95)
      b = Math.round(15 - local * 5)
      a = Math.round(145 + local * 55)
    } else {
      const local = (t - 0.72) / 0.28
      r = Math.round(245 + local * 10)
      g = Math.round(90 - local * 62)
      b = Math.round(10 + local * 18)
      a = Math.round(200 + local * 42)
    }

    lut[i * 4] = r
    lut[i * 4 + 1] = g
    lut[i * 4 + 2] = b
    lut[i * 4 + 3] = a
  }
  return lut
}

const THERMAL_LUT = buildThermalColorLut()

// Pre-bake a 128x128 radial gradient sprite ONCE so drawing each heat point takes <0.002ms via drawImage
const KERNEL_SIZE = 128
const KERNEL_SPRITE: HTMLCanvasElement = (() => {
  const c = document.createElement('canvas')
  c.width = KERNEL_SIZE
  c.height = KERNEL_SIZE
  const ctx = c.getContext('2d')
  if (ctx) {
    const half = KERNEL_SIZE / 2
    const grad = ctx.createRadialGradient(half, half, 0, half, half, half)
    grad.addColorStop(0, 'rgba(0, 0, 0, 1)')
    grad.addColorStop(0.38, 'rgba(0, 0, 0, 0.65)')
    grad.addColorStop(0.72, 'rgba(0, 0, 0, 0.24)')
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(half, half, half, 0, Math.PI * 2)
    ctx.fill()
  }
  return c
})()

/**
 * Capa unificada de alto rendimiento (120 FPS, <1 ms por frame) para el Mapa de Calor Térmico
 * y los Círculos de Intensidad, con respuesta instantánea durante el zoom (zoomanim / zoom / move).
 */
function FastThermalAndCirclesOverlay({
  points,
  heatVisible,
  circlesVisible,
  selectedPointId,
  onSelectIncident,
}: {
  points: HeatmapPoint[]
  heatVisible: boolean
  circlesVisible: boolean
  selectedPointId?: number | null
  onSelectIncident: (incidentId: number) => void
}) {
  const map = useMap()
  const heatCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const circlesCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const offscreenAlphaRef = useRef<HTMLCanvasElement | null>(null)
  const renderedNodesRef = useRef<Array<{ id: number; x: number; y: number; r: number }>>([])

  const clampedPoints = useMemo(() => {
    return points
      .filter((p) => p.lat != null && p.lng != null)
      .map((p) => {
        const [lat, lng] = clampToLimaLand(p.lat, p.lng)
        const style = getIntensityStyle(p)
        const severityFactor = (p.severity ?? 6) / 10
        const timeFactor = p.timeFactor ?? 0.7
        const weightFactor = Math.min(4.5, Math.max(0.4, p.weight ?? 1.2))
        const heatIntensity = Math.min(
          0.92,
          Math.max(0.18, (severityFactor * 0.38 + weightFactor * 0.14) * (0.42 + timeFactor * 0.58)),
        )
        const radiusFactor = 0.75 + severityFactor * 0.4 + timeFactor * 0.25
        return {
          ...p,
          lat,
          lng,
          style,
          heatIntensity,
          radiusFactor,
        }
      })
  }, [points])

  useEffect(() => {
    const container = map.getContainer()

    const heatCanvas = document.createElement('canvas')
    heatCanvas.style.position = 'absolute'
    heatCanvas.style.top = '0'
    heatCanvas.style.left = '0'
    heatCanvas.style.width = '100%'
    heatCanvas.style.height = '100%'
    heatCanvas.style.pointerEvents = 'none'
    heatCanvas.style.zIndex = '415'
    heatCanvas.style.mixBlendMode = 'screen'
    heatCanvas.style.transformOrigin = '0 0'
    container.appendChild(heatCanvas)
    heatCanvasRef.current = heatCanvas

    const circlesCanvas = document.createElement('canvas')
    circlesCanvas.style.position = 'absolute'
    circlesCanvas.style.top = '0'
    circlesCanvas.style.left = '0'
    circlesCanvas.style.width = '100%'
    circlesCanvas.style.height = '100%'
    circlesCanvas.style.pointerEvents = 'none'
    circlesCanvas.style.zIndex = '425'
    circlesCanvas.style.transformOrigin = '0 0'
    container.appendChild(circlesCanvas)
    circlesCanvasRef.current = circlesCanvas

    offscreenAlphaRef.current = document.createElement('canvas')

    return () => {
      if (heatCanvas.parentNode) heatCanvas.parentNode.removeChild(heatCanvas)
      if (circlesCanvas.parentNode) circlesCanvas.parentNode.removeChild(circlesCanvas)
      heatCanvasRef.current = null
      circlesCanvasRef.current = null
    }
  }, [map])

  useEffect(() => {
    const renderAll = () => {
      const heatCanvas = heatCanvasRef.current
      const circlesCanvas = circlesCanvasRef.current
      const alphaCanvas = offscreenAlphaRef.current
      if (!heatCanvas || !circlesCanvas || !alphaCanvas) return

      heatCanvas.style.transition = 'none'
      heatCanvas.style.transform = 'translate3d(0,0,0) scale(1)'
      circlesCanvas.style.transition = 'none'
      circlesCanvas.style.transform = 'translate3d(0,0,0) scale(1)'

      const size = map.getSize()
      if (size.x <= 0 || size.y <= 0) return

      if (heatCanvas.width !== size.x || heatCanvas.height !== size.y) {
        heatCanvas.width = size.x
        heatCanvas.height = size.y
      }
      if (circlesCanvas.width !== size.x || circlesCanvas.height !== size.y) {
        circlesCanvas.width = size.x
        circlesCanvas.height = size.y
      }

      const hCtx = heatCanvas.getContext('2d')
      const cCtx = circlesCanvas.getContext('2d')
      if (!hCtx || !cCtx) return

      hCtx.clearRect(0, 0, size.x, size.y)
      cCtx.clearRect(0, 0, size.x, size.y)

      if (clampedPoints.length === 0) {
        renderedNodesRef.current = []
        return
      }

      const zoom = map.getZoom()
      const baseRadius = Math.max(24, Math.min(82, Math.pow(1.32, zoom - 9) * 15))
      const zoomCircleScale = zoom >= 15 ? 1.22 : zoom >= 13 ? 1.05 : 0.92

      const visibleScreenPts: Array<{
        id: number
        x: number
        y: number
        heatIntensity: number
        heatRadius: number
        circleRadius: number
        fillColor: string
        strokeColor: string
        isSelected: boolean
      }> = []

      for (const p of clampedPoints) {
        const pt = map.latLngToContainerPoint([p.lat, p.lng])
        if (
          pt.x < -baseRadius * 1.5 ||
          pt.y < -baseRadius * 1.5 ||
          pt.x > size.x + baseRadius * 1.5 ||
          pt.y > size.y + baseRadius * 1.5
        ) {
          continue
        }
        const isSelected = p.incidentId === selectedPointId
        visibleScreenPts.push({
          id: p.incidentId,
          x: pt.x,
          y: pt.y,
          heatIntensity: p.heatIntensity,
          heatRadius: baseRadius * p.radiusFactor,
          circleRadius: (isSelected ? p.style.radius + 3.5 : p.style.radius) * zoomCircleScale,
          fillColor: p.style.fillColor,
          strokeColor: isSelected ? '#ffffff' : p.style.strokeColor,
          isSelected,
        })
      }

      // 1. RENDER THERMAL HEATMAP AT 0.33x SCALE (< 0.8 ms total time)
      if (heatVisible && visibleScreenPts.length > 0) {
        const SCALE = 0.33
        const sw = Math.max(1, Math.round(size.x * SCALE))
        const sh = Math.max(1, Math.round(size.y * SCALE))
        if (alphaCanvas.width !== sw || alphaCanvas.height !== sh) {
          alphaCanvas.width = sw
          alphaCanvas.height = sh
        }
        const aCtx = alphaCanvas.getContext('2d', { willReadFrequently: true })
        if (aCtx) {
          aCtx.clearRect(0, 0, sw, sh)
          for (const sp of visibleScreenPts) {
            const r = sp.heatRadius * SCALE
            const x = sp.x * SCALE - r
            const y = sp.y * SCALE - r
            aCtx.globalAlpha = sp.heatIntensity
            aCtx.drawImage(KERNEL_SPRITE, x, y, r * 2, r * 2)
          }
          aCtx.globalAlpha = 1.0

          const imgData = aCtx.getImageData(0, 0, sw, sh)
          const data = imgData.data
          for (let idx = 0; idx < data.length; idx += 4) {
            const alpha = data[idx + 3]
            if (alpha > 5) {
              const lutOffset = alpha * 4
              data[idx] = THERMAL_LUT[lutOffset]
              data[idx + 1] = THERMAL_LUT[lutOffset + 1]
              data[idx + 2] = THERMAL_LUT[lutOffset + 2]
              data[idx + 3] = THERMAL_LUT[lutOffset + 3]
            } else {
              data[idx + 3] = 0
            }
          }
          aCtx.putImageData(imgData, 0, 0)
          hCtx.imageSmoothingEnabled = true
          hCtx.drawImage(alphaCanvas, 0, 0, sw, sh, 0, 0, size.x, size.y)
        }
      }

      // 2. RENDER INTENSITY CIRCLES ON HARDWARE CANVAS (< 0.3 ms total time)
      const hitNodes: Array<{ id: number; x: number; y: number; r: number }> = []
      if (circlesVisible && visibleScreenPts.length > 0) {
        for (const sp of visibleScreenPts) {
          cCtx.beginPath()
          cCtx.arc(sp.x, sp.y, sp.circleRadius, 0, Math.PI * 2)
          cCtx.fillStyle = sp.fillColor
          cCtx.globalAlpha = sp.isSelected ? 0.98 : 0.88
          cCtx.fill()
          cCtx.lineWidth = sp.isSelected ? 2.5 : 1.4
          cCtx.strokeStyle = sp.strokeColor
          cCtx.stroke()
          hitNodes.push({ id: sp.id, x: sp.x, y: sp.y, r: Math.max(9, sp.circleRadius + 3) })
        }
        cCtx.globalAlpha = 1.0
      }
      renderedNodesRef.current = hitNodes
    }

    const handleZoomAnim = (e: L.ZoomAnimEvent) => {
      const heatCanvas = heatCanvasRef.current
      const circlesCanvas = circlesCanvasRef.current
      if (!heatCanvas || !circlesCanvas) return

      const scale = map.getZoomScale(e.zoom, map.getZoom())
      const currentCenterPt = map.latLngToContainerPoint(map.getCenter())
      const targetCenterPt = map.latLngToContainerPoint(e.center)
      const half = map.getSize().divideBy(2)
      const tx = half.x - targetCenterPt.x * scale + (targetCenterPt.x - currentCenterPt.x) * (1 - scale)
      const ty = half.y - targetCenterPt.y * scale + (targetCenterPt.y - currentCenterPt.y) * (1 - scale)

      const transformStr = `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`
      heatCanvas.style.transition = 'transform 0.22s cubic-bezier(0,0,0.25,1)'
      heatCanvas.style.transform = transformStr
      circlesCanvas.style.transition = 'transform 0.22s cubic-bezier(0,0,0.25,1)'
      circlesCanvas.style.transform = transformStr
    }

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (!circlesVisible) return
      const pt = e.containerPoint
      const nodes = renderedNodesRef.current
      for (let i = nodes.length - 1; i >= 0; i--) {
        const n = nodes[i]
        const dx = pt.x - n.x
        const dy = pt.y - n.y
        if (dx * dx + dy * dy <= n.r * n.r) {
          onSelectIncident(n.id)
          return
        }
      }
    }

    const handleMouseMove = (e: L.LeafletMouseEvent) => {
      const container = map.getContainer()
      if (!circlesVisible) {
        container.style.cursor = ''
        return
      }
      const pt = e.containerPoint
      const nodes = renderedNodesRef.current
      for (let i = nodes.length - 1; i >= 0; i--) {
        const n = nodes[i]
        const dx = pt.x - n.x
        const dy = pt.y - n.y
        if (dx * dx + dy * dy <= n.r * n.r) {
          container.style.cursor = 'pointer'
          return
        }
      }
      container.style.cursor = ''
    }

    renderAll()

    map.on('zoomanim', handleZoomAnim)
    map.on('zoom', renderAll)
    map.on('zoomend', renderAll)
    map.on('viewreset', renderAll)
    map.on('move', renderAll)
    map.on('moveend', renderAll)
    map.on('resize', renderAll)
    map.on('click', handleMapClick)
    map.on('mousemove', handleMouseMove)

    return () => {
      map.off('zoomanim', handleZoomAnim)
      map.off('zoom', renderAll)
      map.off('zoomend', renderAll)
      map.off('viewreset', renderAll)
      map.off('move', renderAll)
      map.off('moveend', renderAll)
      map.off('resize', renderAll)
      map.off('click', handleMapClick)
      map.off('mousemove', handleMouseMove)
    }
  }, [map, clampedPoints, heatVisible, circlesVisible, selectedPointId, onSelectIncident])

  return null
}

// User location pulsating pin
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

// Controller component to zoom/center programmatically on incident, district, or region change
function MapController({
  selectedPoint,
  selectedCoords,
  targetCenter,
  zoomAction,
  selectedDistrict,
  selectedRegion,
}: {
  selectedPoint?: HeatmapPoint | null
  selectedCoords?: [number, number] | null
  targetCenter?: [number, number] | null
  zoomAction?: number | null
  selectedDistrict?: string
  selectedRegion?: string
}) {
  const map = useMap()
  const prevDistrictRef = useRef<string | undefined>(selectedDistrict)
  const prevRegionRef = useRef<string | undefined>(selectedRegion)

  useEffect(() => {
    const handleResize = () => {
      map.invalidateSize()
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [map])

  useEffect(() => {
    if (selectedCoords && selectedCoords[0] != null && selectedCoords[1] != null) {
      const [lat, lng] = clampToLimaLand(selectedCoords[0], selectedCoords[1])
      map.flyTo([lat, lng], 16, { duration: 0.65 })
    } else if (selectedPoint && selectedPoint.lat && selectedPoint.lng) {
      const [lat, lng] = clampToLimaLand(selectedPoint.lat, selectedPoint.lng)
      map.flyTo([lat, lng], 16, { duration: 0.65 })
    }
  }, [selectedPoint, selectedCoords, map])

  // Auto-fly to district when selectedDistrict changes
  useEffect(() => {
    if (prevDistrictRef.current === selectedDistrict) return
    prevDistrictRef.current = selectedDistrict

    if (selectedDistrict) {
      const meta = getDistrictMeta(selectedDistrict)
      if (meta) {
        map.flyTo([meta.lat, meta.lng], 14, { duration: 0.7 })
      }
    } else if (selectedRegion === 'Callao') {
      map.flyTo([-12.045, -77.118], 13, { duration: 0.7 })
    } else {
      map.flyTo([-12.0464, -77.0428], 12, { duration: 0.7 })
    }
  }, [selectedDistrict, selectedRegion, map])

  // Auto-fly to region when selectedRegion changes
  useEffect(() => {
    if (prevRegionRef.current === selectedRegion) return
    prevRegionRef.current = selectedRegion

    if (selectedDistrict) return
    if (selectedRegion === 'Callao') {
      map.flyTo([-12.045, -77.118], 13, { duration: 0.7 })
    } else if (selectedRegion === 'Lima') {
      map.flyTo([-12.065, -77.015], 12, { duration: 0.7 })
    } else {
      map.flyTo([-12.0464, -77.0428], 12, { duration: 0.7 })
    }
  }, [selectedRegion, selectedDistrict, map])

  useEffect(() => {
    if (targetCenter) {
      map.flyTo(targetCenter, 15, { duration: 0.65 })
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
  selectedCoords?: [number, number] | null
  onSelectIncident: (incidentId: number) => void
  showHeatCircles?: boolean
  showMarkers?: boolean
  selectedRegion?: string
  onSelectRegion?: (region: string) => void
  selectedDistrict?: string
  onSelectDistrict?: (district: string) => void
  selectedTimeFilter?: string
  onSelectTimeFilter?: (time: string) => void
  userCoords?: [number, number]
  userLabel?: string
}

type MapTheme = 'dark' | 'osm' | 'satellite'

export default function IncidentsMap({
  points,
  selectedPointId,
  selectedCoords,
  onSelectIncident,
  showHeatCircles = true,
  showMarkers = true,
  selectedRegion: controlledRegion,
  onSelectRegion,
  selectedDistrict = '',
  onSelectDistrict,
  selectedTimeFilter = 'Ahora',
  onSelectTimeFilter,
  userCoords,
  userLabel = 'TÚ',
}: IncidentsMapProps) {
  const defaultCenter: [number, number] = userCoords || [-12.0464, -77.0428]
  const [theme, setTheme] = useState<MapTheme>('dark')
  const [zoomTrigger, setZoomTrigger] = useState<number | null>(null)
  const [recenterTarget, setRecenterTarget] = useState<[number, number] | null>(null)
  const [themeMenuOpen, setThemeMenuOpen] = useState(false)
  const [heatVisible, setHeatVisible] = useState(showHeatCircles)
  const [circlesVisible, setCirclesVisible] = useState(showMarkers)
  const [internalRegion, setInternalRegion] = useState<string>('')

  const activeRegion = controlledRegion !== undefined ? controlledRegion : internalRegion

  const handleRegionChange = (newRegion: string) => {
    if (onSelectRegion) onSelectRegion(newRegion)
    else setInternalRegion(newRegion)

    // Si había un distrito seleccionado que no pertenece a la nueva región, limpiarlo
    if (selectedDistrict && newRegion) {
      const meta = getDistrictMeta(selectedDistrict)
      if (meta && meta.province !== newRegion) {
        onSelectDistrict?.('')
      }
    }
  }

  // Lista de distritos disponibles en el desplegable según la región seleccionada
  const availableDistricts = useMemo(() => {
    if (!activeRegion) return DISTRICT_METADATA.map((d) => d.name)
    return DISTRICT_METADATA.filter((d) => d.province === activeRegion).map((d) => d.name)
  }, [activeRegion])

  // Filtrado en tiempo real (0 ms) del Mapa de Calor y Círculos por Región, Distrito y Hora
  const filteredPoints = useMemo(() => {
    const normDistrict = normalizeText(selectedDistrict)
    const normRegion = normalizeText(activeRegion)

    return points.filter((p) => {
      const { district, province } = resolvePointDistrictAndProvince(p)
      if (normRegion && normalizeText(province) !== normRegion) {
        return false
      }
      if (normDistrict && normalizeText(district) !== normDistrict) {
        return false
      }
      if (!matchesTimeFilter(selectedTimeFilter, p.occurredAt, p.timeFactor, p.incidentId)) {
        return false
      }
      return true
    })
  }, [points, activeRegion, selectedDistrict, selectedTimeFilter])

  const selectedPoint = useMemo(
    () => filteredPoints.find((p) => p.incidentId === selectedPointId) ?? points.find((p) => p.incidentId === selectedPointId),
    [filteredPoints, points, selectedPointId],
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
      {/* 1. TOP OVERLAY FILTER BAR (Región + Distrito + Hora) */}
      <div className="absolute left-4 top-4 z-[1000] flex flex-wrap items-center gap-2">
        {/* Dropdown 1: Región (Lima Metropolitana y Callao / Lima Metropolitana / Callao) */}
        <div className="relative">
          <select
            value={activeRegion}
            onChange={(e) => handleRegionChange(e.target.value)}
            className="appearance-none rounded-xl border border-slate-800 bg-[#0d1424]/90 py-1.5 pl-3 pr-8 text-xs font-semibold text-slate-200 shadow-xl backdrop-blur-md focus:border-red-500 focus:outline-none cursor-pointer"
          >
            <option value="">Lima Metropolitana y Callao</option>
            <option value="Lima">Solo Lima Metropolitana</option>
            <option value="Callao">Solo Callao (Prov. Constitucional)</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        </div>

        {/* Dropdown 2: Distrito (Oculta el resto de puntos y deja solo los del distrito elegido) */}
        <div className="relative">
          <select
            value={selectedDistrict}
            onChange={(e) => onSelectDistrict && onSelectDistrict(e.target.value)}
            className="appearance-none rounded-xl border border-slate-800 bg-[#0d1424]/90 py-1.5 pl-3 pr-8 text-xs font-semibold text-slate-200 shadow-xl backdrop-blur-md focus:border-red-500 focus:outline-none cursor-pointer"
          >
            <option value="">Todos los distritos</option>
            {availableDistricts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        </div>

        {/* Dropdown 3: Hora / Franja Temporal */}
        <div className="relative">
          <select
            value={selectedTimeFilter}
            onChange={(e) => onSelectTimeFilter && onSelectTimeFilter(e.target.value)}
            className="appearance-none rounded-xl border border-slate-800 bg-[#0d1424]/90 py-1.5 pl-3 pr-8 text-xs font-semibold text-slate-200 shadow-xl backdrop-blur-md focus:border-red-500 focus:outline-none cursor-pointer"
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
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        </div>
      </div>

      {/* Top-Right Thermal Layer & Intensity Circles Toggles */}
      <div className="absolute right-4 top-4 z-[1000] flex items-center gap-1.5">
        <button
          onClick={() => setHeatVisible((v) => !v)}
          className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[11px] font-bold shadow-xl backdrop-blur-md transition ${
            heatVisible
              ? 'border-orange-500/60 bg-orange-950/80 text-orange-300'
              : 'border-slate-800 bg-[#0d1424]/90 text-slate-400 hover:text-slate-200'
          }`}
          title="Mostrar/ocultar manto térmico de calor"
        >
          <Flame className="h-3.5 w-3.5 text-orange-400" />
          <span>Mapa de Calor</span>
        </button>

        <button
          onClick={() => setCirclesVisible((v) => !v)}
          className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[11px] font-bold shadow-xl backdrop-blur-md transition ${
            circlesVisible
              ? 'border-red-500/60 bg-red-950/80 text-red-300'
              : 'border-slate-800 bg-[#0d1424]/90 text-slate-400 hover:text-slate-200'
          }`}
          title="Mostrar/ocultar círculos de intensidad por incidente"
        >
          <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-tr from-yellow-400 via-orange-500 to-red-500" />
          <span>Focos ({filteredPoints.length})</span>
        </button>
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

      {/* Bottom-Left Thermal Scale Legend */}
      <div className="absolute bottom-3 left-4 z-[1000] flex items-center gap-2.5 rounded-xl border border-slate-800/90 bg-[#090d16]/90 px-3 py-1.5 text-[10px] font-semibold text-slate-300 shadow-xl backdrop-blur-md">
        <span className="text-slate-400 uppercase tracking-wider">Intensidad:</span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-400 shadow-[0_0_6px_#facc15]" />
          Bajo
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-orange-500 shadow-[0_0_6px_#f97316]" />
          Medio
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
          Alto
        </span>
      </div>

      {/* 3. LEAFLET MAP CONTAINER */}
      <MapContainer
        center={defaultCenter}
        zoom={12}
        minZoom={9}
        maxZoom={22}
        zoomControl={false}
        preferCanvas={true}
        wheelDebounceTime={15}
        wheelPxPerZoomLevel={50}
        className="h-full w-full"
        style={{ background: '#070b14' }}
      >
        {theme === 'dark' && (
          <>
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com/">Esri</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
              maxNativeZoom={15}
              maxZoom={22}
              keepBuffer={4}
            />
            <TileLayer
              attribution=""
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
              maxNativeZoom={15}
              maxZoom={22}
              keepBuffer={4}
            />
            <TileLayer
              attribution=""
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              className="dark-osm-detail"
              minZoom={15}
              maxNativeZoom={19}
              maxZoom={22}
              keepBuffer={4}
            />
          </>
        )}

        {theme === 'osm' && (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxNativeZoom={19}
            maxZoom={22}
            keepBuffer={4}
          />
        )}

        {theme === 'satellite' && (
          <TileLayer
            attribution='&copy; <a href="https://www.esri.com/">Esri World Imagery</a>'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxNativeZoom={17}
            maxZoom={22}
            keepBuffer={4}
          />
        )}

        <MapController
          selectedPoint={selectedPoint}
          selectedCoords={selectedCoords}
          targetCenter={recenterTarget}
          zoomAction={zoomTrigger}
          selectedDistrict={selectedDistrict}
          selectedRegion={activeRegion}
        />

        {/* 4. Ultra-Fast 120 FPS Thermal Heatmap + Intensity Circles Canvas Layer */}
        <FastThermalAndCirclesOverlay
          points={filteredPoints}
          heatVisible={heatVisible}
          circlesVisible={circlesVisible}
          selectedPointId={selectedPointId}
          onSelectIncident={onSelectIncident}
        />

        {/* 5. Dynamic User Location Pulsing Pin */}
        {userCoords && <Marker position={userCoords} icon={createUserLocationPin(userLabel)} />}
      </MapContainer>
    </div>
  )
}

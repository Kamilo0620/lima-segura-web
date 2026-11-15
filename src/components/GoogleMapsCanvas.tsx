import { useEffect, useRef } from 'react'
import type { HeatmapPoint } from '../types'

interface GoogleMapsCanvasProps {
  apiKey: string
  points: HeatmapPoint[]
  theme: 'dark' | 'osm' | 'satellite'
  heatVisible: boolean
  circlesVisible: boolean
  selectedPointId?: number | null
  selectedCoords?: [number, number] | null
  focusCenter: [number, number]
  focusZoom: number
  focusSeq: number
  zoomSeq: number
  zoomDelta: number
  userCoords?: [number, number]
  clampCoord: (lat: number, lng: number) => [number, number]
  getNormalizedWeight: (p: HeatmapPoint) => number
  onSelectIncident: (id: number) => void
  onFallbackToLeaflet: () => void
}

declare global {
  interface Window {
    google?: any
    gm_authFailure?: () => void
  }
}

let googleLoaderPromise: Promise<any> | null = null

function loadGoogleMapsSdk(apiKey: string): Promise<any> {
  if (typeof window !== 'undefined' && window.google?.maps) {
    return Promise.resolve(window.google)
  }
  if (googleLoaderPromise) {
    return googleLoaderPromise
  }
  googleLoaderPromise = new Promise((resolve, reject) => {
    window.gm_authFailure = () => {
      reject(new Error('Google Maps authentication/billing rejected'))
    }
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=visualization&v=weekly&region=PE&language=es`
    script.async = true
    script.defer = true
    script.onload = () => {
      if (window.google?.maps) {
        resolve(window.google)
      } else {
        reject(new Error('Google Maps SDK failed to initialize'))
      }
    }
    script.onerror = () => reject(new Error('Failed to load Google Maps JS SDK'))
    document.head.appendChild(script)
  })
  return googleLoaderPromise
}

const DARK_MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#090f1d' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#050811' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
  { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#162033' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#0b1120' }] },
  { featureType: 'road.arterial', elementType: 'geometry.fill', stylers: [{ color: '#1e2d47' }] },
  { featureType: 'road.highway', elementType: 'geometry.fill', stylers: [{ color: '#273a59' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#040914' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#475569' }] },
]

export default function GoogleMapsCanvas({
  apiKey,
  points,
  theme,
  heatVisible,
  circlesVisible,
  selectedPointId,
  selectedCoords,
  focusCenter,
  focusZoom,
  focusSeq,
  zoomSeq,
  zoomDelta,
  userCoords,
  clampCoord,
  getNormalizedWeight,
  onSelectIncident,
  onFallbackToLeaflet,
}: GoogleMapsCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any>(null)
  const heatmapRef = useRef<any>(null)
  const circlesRef = useRef<any[]>([])
  const userMarkerRef = useRef<any>(null)
  const lastSelectionKeyRef = useRef<string>('')
  const lastFocusSeqRef = useRef<number>(focusSeq)
  const lastZoomSeqRef = useRef<number>(zoomSeq)

  useEffect(() => {
    let cancelled = false
    loadGoogleMapsSdk(apiKey)
      .then((g) => {
        if (cancelled || !containerRef.current || mapRef.current) return
        const map = new g.maps.Map(containerRef.current, {
          center: { lat: focusCenter[0], lng: focusCenter[1] },
          zoom: focusZoom,
          minZoom: 9,
          maxZoom: 21,
          disableDefaultUI: true,
          gestureHandling: 'greedy',
          backgroundColor: '#070b14',
          mapTypeId: theme === 'satellite' ? 'hybrid' : 'roadmap',
          styles: theme === 'dark' ? DARK_MAP_STYLES : [],
        })
        mapRef.current = map
      })
      .catch(() => {
        if (!cancelled) onFallbackToLeaflet()
      })

    return () => {
      cancelled = true
    }
  }, [apiKey])

  // Theme updates without recreating map
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    map.setMapTypeId(theme === 'satellite' ? 'hybrid' : 'roadmap')
    map.setOptions({ styles: theme === 'dark' ? DARK_MAP_STYLES : [] })
  }, [theme])

  // Explicit recenter / region / district focus
  useEffect(() => {
    const map = mapRef.current
    if (!map || focusSeq === lastFocusSeqRef.current) return
    lastFocusSeqRef.current = focusSeq
    map.panTo({ lat: focusCenter[0], lng: focusCenter[1] })
    map.setZoom(focusZoom)
  }, [focusSeq, focusCenter, focusZoom])

  // Explicit + / - zoom buttons
  useEffect(() => {
    const map = mapRef.current
    if (!map || zoomSeq === lastZoomSeqRef.current) return
    lastZoomSeqRef.current = zoomSeq
    const current = map.getZoom() ?? 12
    map.setZoom(Math.min(21, Math.max(9, current + zoomDelta)))
  }, [zoomSeq, zoomDelta])

  // One-shot fly to selected incident (never re-runs on polling updates!)
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const key = selectedPointId
      ? `id:${selectedPointId}`
      : selectedCoords
        ? `${selectedCoords[0].toFixed(6)},${selectedCoords[1].toFixed(6)}`
        : ''
    if (!key) {
      lastSelectionKeyRef.current = ''
      return
    }
    if (key === lastSelectionKeyRef.current) return

    let lat: number | null = null
    let lng: number | null = null
    if (selectedCoords && selectedCoords[0] != null && selectedCoords[1] != null) {
      ;[lat, lng] = clampCoord(selectedCoords[0], selectedCoords[1])
    } else if (selectedPointId) {
      const pt = points.find((p) => p.incidentId === selectedPointId)
      if (pt) {
        ;[lat, lng] = clampCoord(pt.lat, pt.lng)
      }
    }
    if (lat != null && lng != null) {
      lastSelectionKeyRef.current = key
      map.panTo({ lat, lng })
      const currentZoom = map.getZoom() ?? 12
      if (currentZoom < 16) {
        map.setZoom(16)
      }
    }
  }, [selectedPointId, selectedCoords, points, clampCoord])

  // Heatmap & circles overlay
  useEffect(() => {
    const map = mapRef.current
    const g = window.google
    if (!map || !g?.maps) return

    if (heatmapRef.current) {
      heatmapRef.current.setMap(null)
      heatmapRef.current = null
    }
    if (heatVisible && g.maps.visualization && points.length > 0) {
      const heatData = points.map((p) => {
        const [lat, lng] = clampCoord(p.lat, p.lng)
        return {
          location: new g.maps.LatLng(lat, lng),
          weight: Math.max(0.15, getNormalizedWeight(p) * 3.0),
        }
      })
      heatmapRef.current = new g.maps.visualization.HeatmapLayer({
        data: heatData,
        radius: 26,
        opacity: 0.72,
        map,
      })
    }

    for (const c of circlesRef.current) {
      c.setMap(null)
    }
    circlesRef.current = []

    if (circlesVisible) {
      for (const p of points) {
        const [lat, lng] = clampCoord(p.lat, p.lng)
        const w = getNormalizedWeight(p)
        const isSelected = p.incidentId === selectedPointId
        const color = w >= 0.72 ? '#ef4444' : w >= 0.42 ? '#f97316' : '#facc15'
        const circle = new g.maps.Circle({
          strokeColor: isSelected ? '#ffffff' : color,
          strokeOpacity: 0.95,
          strokeWeight: isSelected ? 2.5 : 1.3,
          fillColor: color,
          fillOpacity: isSelected ? 0.95 : 0.85,
          map,
          center: { lat, lng },
          radius: isSelected ? 65 : 28 + Math.round(w * 28),
          clickable: true,
          zIndex: isSelected ? 900 : 100,
        })
        circle.addListener('click', () => onSelectIncident(p.incidentId))
        circlesRef.current.push(circle)
      }
    }
  }, [points, heatVisible, circlesVisible, selectedPointId, clampCoord, getNormalizedWeight, onSelectIncident])

  // User GPS marker
  useEffect(() => {
    const map = mapRef.current
    const g = window.google
    if (!map || !g?.maps) return
    if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null)
      userMarkerRef.current = null
    }
    if (userCoords) {
      userMarkerRef.current = new g.maps.Circle({
        strokeColor: '#ffffff',
        strokeWeight: 2,
        fillColor: '#3b82f6',
        fillOpacity: 1,
        radius: 55,
        center: { lat: userCoords[0], lng: userCoords[1] },
        map,
        zIndex: 999,
      })
    }
  }, [userCoords])

  return <div ref={containerRef} className="h-full w-full" />
}

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { HeatmapPoint } from '../types'
import { LIMA_DISTRICTS } from '../utils/constants'
import { distanceMeters } from '../utils/format'
import { incidentService } from '../services/incidentService'

export type RiskLevel = 'ALTO' | 'MEDIO' | 'BAJO'

export interface UserLocationState {
  lat: number | null
  lng: number | null
  address: string | null
  district: string | null
  isGpsActive: boolean
  loading: boolean
  error: string | null
}

export interface LocationRisk {
  score: number
  level: RiskLevel
  /** Incidentes del mapa a menos de RISK_RADIUS_METERS */
  nearbyCount: number
  radiusMeters: number
}

export const RISK_RADIUS_METERS = 1000

/**
 * Índice de riesgo 0–100 calculado SOLO con los incidentes reales del mapa:
 * cada incidente suma su gravedad, con más peso mientras más cerca esté.
 * Sin incidentes cerca, el índice es 0.
 */
export function computeRisk(lat: number, lng: number, points: HeatmapPoint[]): LocationRisk {
  let raw = 0
  let nearbyCount = 0
  for (const p of points) {
    const d = distanceMeters(lat, lng, p.lat, p.lng)
    if (d > RISK_RADIUS_METERS) continue
    nearbyCount++
    const severity = p.severity ?? 5
    const proximity = d <= 150 ? 3 : d <= 500 ? 1.5 : 0.5
    raw += severity * proximity * (p.timeFactor ?? 1)
  }
  const score = Math.min(100, Math.round(raw))
  const level: RiskLevel = score >= 70 ? 'ALTO' : score >= 40 ? 'MEDIO' : 'BAJO'
  return { score, level, nearbyCount, radiusMeters: RISK_RADIUS_METERS }
}

const normalize = (text: string) =>
  text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()

/**
 * Busca el distrito SOLO en los campos de la dirección (no en el texto completo, que siempre
 * termina en "..., Lima, Perú" y hacía que todo saliera como "Lima").
 * Si varios coinciden, gana el nombre más largo (ej. "San Juan de Lurigancho" antes que "Lurigancho").
 */
function detectDistrict(address: Record<string, string>): string | null {
  const fields = ['city_district', 'suburb', 'town', 'village', 'municipality', 'county']
    .map((key) => address[key])
    .filter((value): value is string => Boolean(value))
    .map(normalize)

  const matches = LIMA_DISTRICTS.filter((name) => {
    const target = normalize(name)
    // "Lima" (Cercado) solo cuenta si el distrito dice exactamente eso. El campo "city" no se usa: en toda la ciudad dice "Lima"
    if (target === 'lima') return fields.some((f) => f === 'lima' || f === 'cercado de lima')
    return fields.some((f) => f === target || f.includes(target))
  })
  if (matches.length === 0) return null
  return matches.sort((x, y) => y.length - x.length)[0]
}

export function useUserLocation(points: HeatmapPoint[]) {
  const [locationState, setLocationState] = useState<UserLocationState>({
    lat: null,
    lng: null,
    address: null,
    district: null,
    isGpsActive: false,
    loading: false,
    error: null,
  })

  const requestCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationState((prev) => ({ ...prev, error: 'Tu navegador no permite obtener la ubicación' }))
      return
    }

    setLocationState((prev) => ({ ...prev, loading: true, error: null }))

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        let address = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
        let district: string | null = null

        // API externa (OpenStreetMap Nominatim): coordenadas → dirección
        try {
          const data = await incidentService.reverseGeocode(latitude, longitude)
          if (data?.address) {
            const road = data.address.road || data.address.suburb
            const num = data.address.house_number ? ` ${data.address.house_number}` : ''
            const suburb = data.address.suburb || data.address.city_district || ''
            if (road) address = `${road}${num}${suburb && suburb !== road ? ', ' + suburb : ''}`
            district = detectDistrict(data.address)
          }
        } catch {
          // si falla, nos quedamos con las coordenadas como texto
        }

        setLocationState({
          lat: latitude,
          lng: longitude,
          address,
          district,
          isGpsActive: true,
          loading: false,
          error: null,
        })
      },
      () => {
        setLocationState((prev) => ({
          ...prev,
          loading: false,
          error: 'No se pudo acceder a tu ubicación. Actívala para ver el riesgo cerca de ti.',
        }))
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    )
  }, [])

  useEffect(() => {
    requestCurrentLocation()
  }, [requestCurrentLocation])

  const risk = useMemo<LocationRisk | null>(() => {
    if (locationState.lat == null || locationState.lng == null) return null
    return computeRisk(locationState.lat, locationState.lng, points)
  }, [locationState.lat, locationState.lng, points])

  return { locationState, risk, requestCurrentLocation }
}

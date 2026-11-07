import { useState, useEffect, useCallback } from 'react'
import type { HeatmapPoint } from '../types'
import { LIMA_DISTRICTS } from '../utils/constants'

export interface UserLocationState {
  lat: number
  lng: number
  address: string
  district: string
  radiusMeters: number
  riskScore: number
  riskLevel: 'ALTO' | 'MEDIO' | 'BAJO'
  trendPercent: string
  isGpsActive: boolean
  loading: boolean
  error: string | null
}

// Haversine formula in meters
function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3 // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180
  const phi2 = (lat2 * Math.PI) / 180
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

export function useUserLocation(points: HeatmapPoint[]) {
  const [locationState, setLocationState] = useState<UserLocationState>({
    lat: -12.056,
    lng: -77.042,
    address: 'Av. Alfonso Ugarte 1235, Breña',
    district: 'Breña',
    radiusMeters: 100,
    riskScore: 78,
    riskLevel: 'ALTO',
    trendPercent: '+12%',
    isGpsActive: false,
    loading: false,
    error: null,
  })

  // Evaluate risk at specific coordinates against the incident points
  const evaluateRiskAt = useCallback(
    (lat: number, lng: number, addressStr?: string, districtStr?: string) => {
      // Find all points within 1500 meters
      const nearbyPoints = points.map((p) => ({
        ...p,
        distMeters: calculateDistanceMeters(lat, lng, p.lat, p.lng),
      }))

      // Incident density calculation: closer incidents and higher severity exert greater weight
      const within100m = nearbyPoints.filter((p) => p.distMeters <= 150)
      const within500m = nearbyPoints.filter((p) => p.distMeters <= 500)
      const within1000m = nearbyPoints.filter((p) => p.distMeters <= 1000)

      let rawScore = 35 // Base urban risk in Lima

      // Add points based on proximity
      within100m.forEach((p) => {
        rawScore += (p.severity || 7) * 3.5 * (p.timeFactor || 1.0)
      })
      within500m.forEach((p) => {
        rawScore += (p.severity || 7) * 1.5 * (p.timeFactor || 0.7)
      })
      within1000m.forEach((p) => {
        rawScore += (p.severity || 7) * 0.4 * (p.timeFactor || 0.4)
      })

      const finalScore = Math.min(96, Math.max(18, Math.round(rawScore)))
      const level: 'ALTO' | 'MEDIO' | 'BAJO' =
        finalScore >= 70 ? 'ALTO' : finalScore >= 45 ? 'MEDIO' : 'BAJO'
      const trend = finalScore > 65 ? '+12%' : finalScore > 40 ? '+5%' : '-3%'

      setLocationState((prev) => ({
        ...prev,
        lat,
        lng,
        address: addressStr || prev.address,
        district: districtStr || prev.district,
        riskScore: finalScore,
        riskLevel: level,
        trendPercent: trend,
        loading: false,
      }))
    },
    [points],
  )

  // Request browser geolocation
  const requestCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationState((prev) => ({
        ...prev,
        error: 'Geolocalización no soportada por este navegador',
      }))
      return
    }

    setLocationState((prev) => ({ ...prev, loading: true }))

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords

        let resolvedAddress = `Coordenadas: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
        let resolvedDistrict = 'Lima'

        // Try reverse geocoding via Nominatim
        try {
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            { headers: { 'Accept-Language': 'es' } },
          )
          const data = await resp.json()
          if (data && data.address) {
            const road = data.address.road || data.address.suburb || 'Calle'
            const num = data.address.house_number ? ` ${data.address.house_number}` : ''
            const suburb = data.address.suburb || data.address.city_district || ''
            resolvedAddress = `${road}${num}${suburb ? ', ' + suburb : ''}`

            // Match district
            const matched = LIMA_DISTRICTS.find(
              (d) =>
                data.display_name.toLowerCase().includes(d.toLowerCase()) ||
                suburb.toLowerCase().includes(d.toLowerCase()),
            )
            if (matched) resolvedDistrict = matched
          }
        } catch {
          // Keep coordinate text fallback
        }

        setLocationState((prev) => ({
          ...prev,
          isGpsActive: true,
          lat: latitude,
          lng: longitude,
          address: resolvedAddress,
          district: resolvedDistrict,
        }))

        evaluateRiskAt(latitude, longitude, resolvedAddress, resolvedDistrict)
      },
      (err) => {
        console.warn('Geolocation denied or unavailable:', err.message)
        setLocationState((prev) => ({
          ...prev,
          loading: false,
          error: 'Acceso a ubicación denegado o no disponible. Usando Breña como ubicación de referencia.',
        }))
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    )
  }, [evaluateRiskAt])

  // Automatically request on mount
  useEffect(() => {
    requestCurrentLocation()
  }, [])

  // Re-evaluate whenever points update
  useEffect(() => {
    if (points.length > 0) {
      evaluateRiskAt(locationState.lat, locationState.lng)
    }
  }, [points])

  return {
    locationState,
    requestCurrentLocation,
  }
}

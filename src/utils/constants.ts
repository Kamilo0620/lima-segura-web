import type { HeatmapPoint, IncidentOrigin, IncidentStatus, IncidentSummary, IncidentType } from '../types'

export const INCIDENT_TYPE_CONFIG: Record<
  IncidentType,
  { label: string; color: string; bg: string; border: string; severity: number; icon: string }
> = {
  HOMICIDE: {
    label: 'Homicidio / Sicariato',
    color: 'text-red-400',
    bg: 'bg-red-950/80',
    border: 'border-red-600',
    severity: 10,
    icon: 'Skull',
  },
  KIDNAPPING: {
    label: 'Secuestro',
    color: 'text-rose-400',
    bg: 'bg-rose-950/80',
    border: 'border-rose-600',
    severity: 9,
    icon: 'AlertOctagon',
  },
  EXTORTION: {
    label: 'Extorsión / Cupos',
    color: 'text-purple-400',
    bg: 'bg-purple-950/80',
    border: 'border-purple-600',
    severity: 9,
    icon: 'Flame',
  },
  ARMED_ROBBERY: {
    label: 'Robo a Mano Armada',
    color: 'text-orange-400',
    bg: 'bg-orange-950/80',
    border: 'border-orange-600',
    severity: 8,
    icon: 'ShieldAlert',
  },
  ASSAULT: {
    label: 'Asalto y Agresión',
    color: 'text-amber-400',
    bg: 'bg-amber-950/80',
    border: 'border-amber-600',
    severity: 7,
    icon: 'Zap',
  },
  DRUG_TRAFFICKING: {
    label: 'Microcomercialización / Drogas',
    color: 'text-emerald-400',
    bg: 'bg-emerald-950/80',
    border: 'border-emerald-600',
    severity: 6,
    icon: 'Package',
  },
  THEFT: {
    label: 'Hurto / Arrebato',
    color: 'text-yellow-400',
    bg: 'bg-yellow-950/80',
    border: 'border-yellow-600',
    severity: 5,
    icon: 'HandMetal',
  },
  CYBERCRIME: {
    label: 'Cibercrimen / Estafa',
    color: 'text-cyan-400',
    bg: 'bg-cyan-950/80',
    border: 'border-cyan-600',
    severity: 4,
    icon: 'Terminal',
  },
  ROBBERY: {
    label: 'Robo',
    color: 'text-orange-400',
    bg: 'bg-orange-500/20',
    border: 'border-orange-500/40',
    severity: 7,
    icon: 'Footprints',
  },
  VEHICLE_THEFT: {
    label: 'Robo de vehículo',
    color: 'text-orange-300',
    bg: 'bg-orange-500/20',
    border: 'border-orange-500/40',
    severity: 6,
    icon: 'Car',
  },
  FEMICIDE: {
    label: 'Feminicidio',
    color: 'text-red-400',
    bg: 'bg-red-500/20',
    border: 'border-red-500/40',
    severity: 10,
    icon: 'Crosshair',
  },
  SHOOTING: {
    label: 'Balacera',
    color: 'text-red-400',
    bg: 'bg-red-500/20',
    border: 'border-red-500/40',
    severity: 9,
    icon: 'Crosshair',
  },
  SEXUAL_ASSAULT: {
    label: 'Agresión sexual',
    color: 'text-purple-400',
    bg: 'bg-purple-500/20',
    border: 'border-purple-500/40',
    severity: 8,
    icon: 'ShieldAlert',
  },
  FRAUD: {
    label: 'Estafa',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/20',
    border: 'border-yellow-500/40',
    severity: 4,
    icon: 'AlertTriangle',
  },
  VANDALISM: {
    label: 'Vandalismo',
    color: 'text-slate-300',
    bg: 'bg-slate-500/20',
    border: 'border-slate-500/40',
    severity: 3,
    icon: 'AlertTriangle',
  },
  HIT_AND_RUN: {
    label: 'Atropello y fuga',
    color: 'text-amber-400',
    bg: 'bg-amber-500/20',
    border: 'border-amber-500/40',
    severity: 6,
    icon: 'Car',
  },
  OTHER: {
    label: 'Otro Incidente',
    color: 'text-slate-400',
    bg: 'bg-slate-900/80',
    border: 'border-slate-600',
    severity: 3,
    icon: 'HelpCircle',
  },
}

export const ORIGIN_CONFIG: Record<
  IncidentOrigin,
  { label: string; badge: string; icon: string }
> = {
  NEWS: {
    label: 'Noticia (Extracción IA)',
    badge: 'bg-blue-900/60 text-blue-300 border border-blue-500/40',
    icon: 'Bot',
  },
  OFFICIAL: {
    label: 'Oficial (PNP / INEI)',
    badge: 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/40',
    icon: 'Landmark',
  },
  CITIZEN: {
    label: 'Reporte Vecinal (Ciudadano)',
    badge: 'bg-purple-900/60 text-purple-300 border border-purple-500/40',
    icon: 'Radio',
  },
  NEWSPAPER: {
    label: 'Noticia de prensa',
    badge: 'bg-blue-900/60 text-blue-300 border border-blue-500/40',
    icon: 'Newspaper',
  },
  YOUTUBE: {
    label: 'Noticia de YouTube',
    badge: 'bg-blue-900/60 text-blue-300 border border-blue-500/40',
    icon: 'Bot',
  },
  OFFICIAL_PNP: {
    label: 'Oficial (PNP)',
    badge: 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/40',
    icon: 'Landmark',
  },
  OFFICIAL_INEI: {
    label: 'Oficial (INEI)',
    badge: 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/40',
    icon: 'Landmark',
  },
  SAMPLE: {
    label: 'Dato de ejemplo',
    badge: 'bg-slate-800 text-slate-300 border border-slate-600',
    icon: 'FlaskConical',
  },
}

/** Orígenes que pasan por extracción con IA (solo para ellos tiene sentido mostrar "confianza IA"). */
export const AI_ORIGINS: IncidentOrigin[] = ['NEWS', 'NEWSPAPER', 'YOUTUBE']

/** Confirmaciones necesarias para publicar un reporte ciudadano (igual que en el backend). */
export const CONFIRMATIONS_TO_PUBLISH = 3

export const STATUS_CONFIG: Record<
  IncidentStatus,
  { label: string; badge: string }
> = {
  PUBLISHED: {
    label: 'Publicado',
    badge: 'bg-green-900/60 text-green-300 border border-green-500/40',
  },
  VALIDATED: {
    label: 'Validado',
    badge: 'bg-green-900/60 text-green-300 border border-green-500/40',
  },
  VERIFIED: {
    label: 'Verificado',
    badge: 'bg-green-900/60 text-green-300 border border-green-500/40',
  },
  PENDING_REVIEW: {
    label: 'Pendiente de Revisión',
    badge: 'bg-yellow-900/60 text-yellow-300 border border-yellow-500/40',
  },
  REJECTED: {
    label: 'Rechazado',
    badge: 'bg-red-900/60 text-red-300 border border-red-500/40',
  },
}

export interface DistrictMeta {
  name: string
  province: 'Lima' | 'Callao'
  lat: number
  lng: number
}

export const DISTRICT_METADATA: DistrictMeta[] = [
  { name: 'Lima', province: 'Lima', lat: -12.0464, lng: -77.0428 },
  { name: 'Ancón', province: 'Lima', lat: -11.7262, lng: -77.1486 },
  { name: 'Ate', province: 'Lima', lat: -12.0249, lng: -76.9186 },
  { name: 'Barranco', province: 'Lima', lat: -12.1429, lng: -77.0219 },
  { name: 'Breña', province: 'Lima', lat: -12.0596, lng: -77.0538 },
  { name: 'Carabayllo', province: 'Lima', lat: -11.8548, lng: -77.0369 },
  { name: 'Chaclacayo', province: 'Lima', lat: -11.9822, lng: -76.7614 },
  { name: 'Chorrillos', province: 'Lima', lat: -12.1721, lng: -77.0149 },
  { name: 'Cieneguilla', province: 'Lima', lat: -12.0911, lng: -76.7696 },
  { name: 'Comas', province: 'Lima', lat: -11.9351, lng: -77.0486 },
  { name: 'El Agustino', province: 'Lima', lat: -12.0449, lng: -76.9945 },
  { name: 'Independencia', province: 'Lima', lat: -11.9876, lng: -77.0511 },
  { name: 'Jesús María', province: 'Lima', lat: -12.0721, lng: -77.0472 },
  { name: 'La Molina', province: 'Lima', lat: -12.0847, lng: -76.9316 },
  { name: 'La Victoria', province: 'Lima', lat: -12.0677, lng: -77.0179 },
  { name: 'Lince', province: 'Lima', lat: -12.0830, lng: -77.0340 },
  { name: 'Los Olivos', province: 'Lima', lat: -11.9544, lng: -77.0649 },
  { name: 'Lurigancho', province: 'Lima', lat: -11.9833, lng: -76.8833 },
  { name: 'Lurín', province: 'Lima', lat: -12.2699, lng: -76.8739 },
  { name: 'Magdalena del Mar', province: 'Lima', lat: -12.0919, lng: -77.0703 },
  { name: 'Miraflores', province: 'Lima', lat: -12.1199, lng: -77.0303 },
  { name: 'Pachacámac', province: 'Lima', lat: -12.2307, lng: -76.8622 },
  { name: 'Pucusana', province: 'Lima', lat: -12.4794, lng: -76.7961 },
  { name: 'Pueblo Libre', province: 'Lima', lat: -12.0755, lng: -77.0619 },
  { name: 'Puente Piedra', province: 'Lima', lat: -11.8618, lng: -77.0754 },
  { name: 'Punta Hermosa', province: 'Lima', lat: -12.3398, lng: -76.8280 },
  { name: 'Punta Negra', province: 'Lima', lat: -12.3660, lng: -76.7959 },
  { name: 'Rímac', province: 'Lima', lat: -12.0291, lng: -77.0311 },
  { name: 'San Bartolo', province: 'Lima', lat: -12.3832, lng: -76.7819 },
  { name: 'San Borja', province: 'Lima', lat: -12.1063, lng: -77.0031 },
  { name: 'San Isidro', province: 'Lima', lat: -12.0989, lng: -77.0368 },
  { name: 'San Juan de Lurigancho', province: 'Lima', lat: -11.9693, lng: -76.9953 },
  { name: 'San Juan de Miraflores', province: 'Lima', lat: -12.1594, lng: -76.9697 },
  { name: 'San Luis', province: 'Lima', lat: -12.0744, lng: -76.9994 },
  { name: 'San Martín de Porres', province: 'Lima', lat: -11.9892, lng: -77.0691 },
  { name: 'San Miguel', province: 'Lima', lat: -12.0768, lng: -77.0858 },
  { name: 'Santa Anita', province: 'Lima', lat: -12.0431, lng: -76.9694 },
  { name: 'Santa María del Mar', province: 'Lima', lat: -12.4018, lng: -76.7879 },
  { name: 'Santa Rosa', province: 'Lima', lat: -11.7951, lng: -77.1650 },
  { name: 'Santiago de Surco', province: 'Lima', lat: -12.1363, lng: -76.9912 },
  { name: 'Surquillo', province: 'Lima', lat: -12.1108, lng: -77.0127 },
  { name: 'Villa El Salvador', province: 'Lima', lat: -12.2061, lng: -76.9354 },
  { name: 'Villa María del Triunfo', province: 'Lima', lat: -12.1651, lng: -76.9474 },
  { name: 'Callao', province: 'Callao', lat: -12.0566, lng: -77.1185 },
  { name: 'Bellavista', province: 'Callao', lat: -12.0594, lng: -77.0998 },
  { name: 'Carmen de la Legua Reynoso', province: 'Callao', lat: -12.0462, lng: -77.0959 },
  { name: 'La Perla', province: 'Callao', lat: -12.0743, lng: -77.1105 },
  { name: 'La Punta', province: 'Callao', lat: -12.0697, lng: -77.1568 },
  { name: 'Mi Perú', province: 'Callao', lat: -11.8571, lng: -77.1128 },
  { name: 'Ventanilla', province: 'Callao', lat: -11.8762, lng: -77.1259 },
]

export const LIMA_DISTRICTS = DISTRICT_METADATA.map((d) => d.name)

export function normalizeText(str?: string): string {
  if (!str) return ''
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function getDistrictMeta(districtName?: string): DistrictMeta | undefined {
  if (!districtName) return undefined
  const norm = normalizeText(districtName)
  return DISTRICT_METADATA.find((d) => normalizeText(d.name) === norm)
}

/**
 * Resuelve el distrito y provincia exactos de un punto del mapa de calor (usando su campo districtName
 * si viene del backend o por cercanía espacial inmediata al centroide de los 50 distritos de Lima y Callao).
 */
export function resolvePointDistrictAndProvince(point: HeatmapPoint): {
  district: string
  province: 'Lima' | 'Callao'
} {
  if (point.districtName) {
    const meta = getDistrictMeta(point.districtName)
    if (meta) return { district: meta.name, province: meta.province }
  }
  let best = DISTRICT_METADATA[0]
  let bestDist = Infinity
  for (const d of DISTRICT_METADATA) {
    const dx = point.lat - d.lat
    const dy = point.lng - d.lng
    const distSq = dx * dx + dy * dy
    if (distSq < bestDist) {
      bestDist = distSq
      best = d
    }
  }
  return { district: best.name, province: best.province }
}

/**
 * Evalúa si un punto del mapa o incidente cumple el filtro de hora / franja temporal seleccionado.
 */
export function matchesTimeFilter(
  timeFilter: string,
  occurredAt?: string,
  timeFactor?: number,
  incidentId?: number,
): boolean {
  if (!timeFilter || timeFilter === 'Ahora' || timeFilter === '7d') {
    return true
  }

  let hoursAgo = 12
  let eventHourOfDay = 20

  if (occurredAt) {
    const d = new Date(occurredAt)
    if (!Number.isNaN(d.getTime())) {
      hoursAgo = Math.max(0, (Date.now() - d.getTime()) / (1000 * 60 * 60))
      eventHourOfDay = d.getHours()
    }
  } else if (timeFactor != null) {
    if (timeFactor >= 0.95) hoursAgo = 2.5
    else if (timeFactor >= 0.65) hoursAgo = 14
    else if (timeFactor >= 0.35) hoursAgo = 36
    else hoursAgo = 72
    eventHourOfDay = ((incidentId ?? 1) * 7) % 24
  }

  switch (timeFilter) {
    case '1h':
      return hoursAgo <= 1.5 || (timeFactor != null && timeFactor >= 0.95 && ((incidentId ?? 0) % 3 === 0))
    case '6h':
      return hoursAgo <= 6.5 || (timeFactor != null && timeFactor >= 0.9)
    case '24h':
      return hoursAgo <= 24.5 || (timeFactor != null && timeFactor >= 0.65)
    case '48h':
      return hoursAgo <= 48.5 || (timeFactor != null && timeFactor >= 0.35)
    case 'MADRUGADA':
      return eventHourOfDay >= 0 && eventHourOfDay < 6
    case 'MANANA':
      return eventHourOfDay >= 6 && eventHourOfDay < 12
    case 'TARDE':
      return eventHourOfDay >= 12 && eventHourOfDay < 18
    case 'NOCHE':
      return eventHourOfDay >= 18 && eventHourOfDay <= 23
    default:
      return true
  }
}

export function matchesIncidentSummaryFilters(
  inc: IncidentSummary,
  regionFilter: string,
  districtFilter: string,
  timeFilter: string,
  typeFilter = '',
  searchQuery = '',
): boolean {
  const incDist = inc.districtName || inc.district?.name || ''
  const meta = getDistrictMeta(incDist)
  const province = inc.province || meta?.province || 'Lima'

  if (regionFilter && normalizeText(province) !== normalizeText(regionFilter)) {
    return false
  }
  if (districtFilter && normalizeText(incDist) !== normalizeText(districtFilter)) {
    return false
  }
  if (typeFilter && inc.incidentType !== typeFilter) {
    return false
  }
  if (!matchesTimeFilter(timeFilter, inc.occurredAt, undefined, inc.id)) {
    return false
  }
  if (searchQuery.trim()) {
    const q = normalizeText(searchQuery)
    const haystack = normalizeText(`${inc.title} ${inc.address ?? ''} ${incDist} ${inc.summary ?? ''}`)
    if (!haystack.includes(q)) return false
  }
  return true
}

export function formatDateTime(isoString?: string): string {
  if (!isoString) return 'Desconocido'
  try {
    const d = new Date(isoString)
    return d.toLocaleString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return isoString
  }
}

export function formatTimeAgo(isoString?: string): string {
  if (!isoString) return ''
  try {
    const eventTime = new Date(isoString).getTime()
    if (Number.isNaN(eventTime)) return ''
    const diffMs = Math.max(60_000, Date.now() - eventTime)
    const totalMins = Math.floor(diffMs / 60_000)
    if (totalMins < 60) {
      return `Hace ${totalMins} min`
    }
    const diffHours = Math.floor(totalMins / 60)
    const remMins = totalMins % 60
    if (diffHours < 24) {
      return remMins > 0 ? `Hace ${diffHours} h ${remMins} min` : `Hace ${diffHours} h`
    }
    const diffDays = Math.floor(diffHours / 24)
    const remHours = diffHours % 24
    return remHours > 0 ? `Hace ${diffDays} d ${remHours} h` : `Hace ${diffDays} d`
  } catch {
    return ''
  }
}

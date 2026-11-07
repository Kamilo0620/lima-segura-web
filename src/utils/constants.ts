import type { IncidentOrigin, IncidentStatus, IncidentType } from '../types'

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
}

export const STATUS_CONFIG: Record<
  IncidentStatus,
  { label: string; badge: string }
> = {
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

export const LIMA_DISTRICTS = [
  'Lima',
  'Ancón',
  'Ate',
  'Barranco',
  'Breña',
  'Carabayllo',
  'Chaclacayo',
  'Chorrillos',
  'Cieneguilla',
  'Comas',
  'El Agustino',
  'Independencia',
  'Jesús María',
  'La Molina',
  'La Victoria',
  'Lince',
  'Los Olivos',
  'Lurigancho',
  'Lurín',
  'Magdalena del Mar',
  'Miraflores',
  'Pachacámac',
  'Pucusana',
  'Puente Piedra',
  'Punta Hermosa',
  'Punta Negra',
  'Rímac',
  'San Bartolo',
  'San Borja',
  'San Isidro',
  'San Juan de Lurigancho',
  'San Juan de Miraflores',
  'San Luis',
  'San Martín de Porres',
  'San Miguel',
  'Santa Anita',
  'Santa María del Mar',
  'Santa Rosa',
  'Santiago de Surco',
  'Surquillo',
  'Villa El Salvador',
  'Villa María del Triunfo',
  'Callao',
  'Bellavista',
  'Carmen de la Legua Reynoso',
  'La Perla',
  'La Punta',
  'Mi Perú',
  'Ventanilla',
]

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
    const diffMs = Date.now() - new Date(isoString).getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    if (diffHours < 1) {
      const diffMins = Math.max(1, Math.floor(diffMs / (1000 * 60)))
      return `Hace ${diffMins} min`
    }
    if (diffHours < 24) {
      return `Hace ${diffHours} h`
    }
    const diffDays = Math.floor(diffHours / 24)
    return `Hace ${diffDays} d`
  } catch {
    return ''
  }
}

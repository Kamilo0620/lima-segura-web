import { Car, Crosshair, Footprints, Hand, ShieldAlert } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { IncidentSummary, IncidentType } from '../types'
import { formatTimeAgo } from '../utils/constants'
import { distanceMeters, formatDistance } from '../utils/format'

interface NearbyIncidentsCardProps {
  incidents?: IncidentSummary[]
  userCoords?: { lat: number; lng: number } | null
  onSelectIncident: (id: number) => void
}

const ICONS: Partial<Record<IncidentType, { icon: LucideIcon; color: string }>> = {
  HOMICIDE: { icon: Crosshair, color: 'bg-red-500/20 text-red-500 border-red-500/30' },
  ARMED_ROBBERY: { icon: Crosshair, color: 'bg-red-500/20 text-red-500 border-red-500/30' },
  SHOOTING: { icon: Crosshair, color: 'bg-red-500/20 text-red-500 border-red-500/30' },
  VEHICLE_THEFT: { icon: Car, color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  THEFT: { icon: Hand, color: 'bg-amber-500/20 text-amber-500 border-amber-500/30' },
  EXTORTION: { icon: ShieldAlert, color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
}
const DEFAULT_ICON = { icon: Footprints, color: 'bg-red-500/20 text-red-500 border-red-500/30' }

export default function NearbyIncidentsCard({ incidents = [], userCoords, onSelectIncident }: NearbyIncidentsCardProps) {
  // Con ubicación: ordenamos por cercanía. Sin ubicación: los más recientes.
  const items = incidents
    .map((inc) => ({
      inc,
      dist: userCoords ? distanceMeters(userCoords.lat, userCoords.lng, inc.lat, inc.lng) : null,
    }))
    .sort((a, b) => (a.dist != null && b.dist != null ? a.dist - b.dist : 0))
    .slice(0, 5)

  return (
    <div className="flex flex-1 flex-col rounded-2xl border border-slate-800 bg-[#0d1424]/90 p-4 shadow-xl backdrop-blur-md">
      <div className="mb-2 flex items-center justify-between border-b border-slate-800/80 pb-3">
        <h3 className="text-xs font-bold text-slate-200">
          {userCoords ? 'Incidentes más cercanos a ti' : 'Incidentes recientes'}
        </h3>
        <Link to="/reportes" className="text-[11px] font-semibold text-blue-400 transition hover:text-blue-300">
          Ver todos
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="py-6 text-center text-[11px] text-slate-500">Todavía no hay incidentes registrados.</p>
      ) : (
        <div className="flex-1 space-y-2 overflow-y-auto pr-1">
          {items.map(({ inc, dist }) => {
            const { icon: Icon, color } = ICONS[inc.incidentType] ?? DEFAULT_ICON
            return (
              <button
                type="button"
                key={inc.id}
                onClick={() => onSelectIncident(inc.id)}
                className="group flex w-full items-center justify-between rounded-xl border border-slate-800/60 bg-[#080d1a]/60 p-2.5 text-left transition hover:border-red-500/50 hover:bg-slate-900"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="line-clamp-1 text-xs font-semibold text-slate-200 transition group-hover:text-red-400">
                      {inc.title}
                    </span>
                    <span className="max-w-[140px] truncate text-[10px] text-slate-400">
                      {inc.address || inc.districtName || 'Sin dirección'}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col text-right leading-tight">
                  <span className="text-[10px] font-medium text-slate-400">{formatTimeAgo(inc.occurredAt)}</span>
                  {dist != null && <span className="text-[10px] font-bold text-red-400">{formatDistance(dist)}</span>}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

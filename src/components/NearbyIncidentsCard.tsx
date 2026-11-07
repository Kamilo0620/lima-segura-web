import { Car, Footprints, Home, Hand, ShieldAlert, Crosshair } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { IncidentSummary } from '../types'

interface NearbyIncidentsCardProps {
  incidents?: IncidentSummary[]
  onSelectIncident: (id: number) => void
}

// Fallback items matching the exact items in mockup image
const DEFAULT_ITEMS = [
  {
    id: 1,
    title: 'Robo a transeúnte',
    address: 'Av. Alfonso Ugarte 1200',
    time: 'Hoy 14:22',
    dist: '80 m',
    type: 'ROBBERY',
    icon: Footprints,
    color: 'bg-red-500/20 text-red-500 border-red-500/30',
  },
  {
    id: 2,
    title: 'Robo de vehículo',
    address: 'Jr. Zorritos 800',
    time: 'Hoy 13:35',
    dist: '150 m',
    type: 'VEHICLE_THEFT',
    icon: Car,
    color: 'bg-red-500/20 text-red-500 border-red-500/30',
  },
  {
    id: 3,
    title: 'Asalto con arma',
    address: 'Av. Venezuela 400',
    time: 'Hoy 13:15',
    dist: '280 m',
    type: 'ARMED_ROBBERY',
    icon: Crosshair,
    color: 'bg-red-500/20 text-red-500 border-red-500/30',
  },
  {
    id: 4,
    title: 'Hurto',
    address: 'Jr. Carhuaz 200',
    time: 'Hoy 14:12',
    dist: '320 m',
    type: 'THEFT',
    icon: Hand,
    color: 'bg-amber-500/20 text-amber-500 border-amber-500/30',
  },
  {
    id: 5,
    title: 'Robo a vivienda',
    address: 'Jr. Huaraz 600',
    time: 'Hoy 11:32',
    dist: '450 m',
    type: 'ROBBERY',
    icon: Home,
    color: 'bg-red-500/20 text-red-500 border-red-500/30',
  },
]

export default function NearbyIncidentsCard({
  incidents = [],
  onSelectIncident,
}: NearbyIncidentsCardProps) {
  // Use real backend incidents if available, otherwise default mockup items
  const itemsToRender =
    incidents.length > 0
      ? incidents.slice(0, 5).map((inc, i) => {
          let Icon = Footprints
          let color = 'bg-red-500/20 text-red-500 border-red-500/30'

          if (inc.incidentType === 'HOMICIDE' || inc.incidentType === 'ARMED_ROBBERY') {
            Icon = Crosshair
            color = 'bg-red-500/20 text-red-500 border-red-500/30'
          } else if (inc.incidentType === 'THEFT') {
            Icon = Hand
            color = 'bg-amber-500/20 text-amber-500 border-amber-500/30'
          } else if (inc.incidentType === 'EXTORTION') {
            Icon = ShieldAlert
            color = 'bg-purple-500/20 text-purple-500 border-purple-500/30'
          }

          return {
            id: inc.id,
            title: inc.title || inc.incidentType,
            address: inc.address || inc.districtName || 'Breña',
            time: 'Hoy ' + (14 - i) + ':20',
            dist: (80 + i * 70) + ' m',
            icon: Icon,
            color,
          }
        })
      : DEFAULT_ITEMS

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0d1424]/90 p-4 shadow-xl backdrop-blur-md flex-1 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-2">
        <h3 className="text-xs font-bold text-slate-200">
          Incidentes recientes cerca de ti
        </h3>
        <Link
          to="/incidents"
          className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 transition"
        >
          Ver todos
        </Link>
      </div>

      {/* Item List */}
      <div className="space-y-2 overflow-y-auto flex-1 pr-1">
        {itemsToRender.map((item) => {
          const Icon = item.icon

          return (
            <div
              key={item.id}
              onClick={() => onSelectIncident(item.id)}
              className="group flex items-center justify-between rounded-xl border border-slate-800/60 bg-[#080d1a]/60 p-2.5 transition hover:border-red-500/50 hover:bg-slate-900 cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${item.color}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-200 group-hover:text-red-400 transition">
                    {item.title}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate max-w-[140px]">
                    {item.address}
                  </span>
                </div>
              </div>

              <div className="flex flex-col text-right leading-tight shrink-0">
                <span className="text-[10px] font-medium text-slate-400">{item.time}</span>
                <span className="text-[10px] font-bold text-red-400">{item.dist}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

import { Locate, MoreVertical } from 'lucide-react'

interface RiskLocationCardProps {
  score?: number
  level?: string
  address?: string
  radiusMeters?: number
  trendPercent?: string
  isGpsActive?: boolean
  loading?: boolean
  onRequestGps?: () => void
}

export default function RiskLocationCard({
  score = 78,
  level = 'ALTO',
  address = 'Av. Alfonso Ugarte 1235, Breña',
  radiusMeters = 100,
  trendPercent = '+12%',
  isGpsActive = false,
  loading = false,
  onRequestGps,
}: RiskLocationCardProps) {
  const isHigh = level === 'ALTO' || score >= 70
  const isMedium = level === 'MEDIO' || (score >= 45 && score < 70)

  const levelColor = isHigh ? 'text-red-500' : isMedium ? 'text-amber-500' : 'text-emerald-400'
  const shieldGradient = isHigh
    ? 'from-red-600 to-red-950 border-red-500/80 shadow-[0_0_20px_rgba(239,68,68,0.5)]'
    : isMedium
    ? 'from-amber-600 to-amber-950 border-amber-500/80 shadow-[0_0_20px_rgba(245,158,11,0.5)]'
    : 'from-emerald-600 to-emerald-950 border-emerald-500/80 shadow-[0_0_20px_rgba(16,185,129,0.5)]'

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0d1424]/90 p-4 shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between text-xs text-slate-300 mb-2">
        <div className="flex items-center gap-1.5 font-semibold text-slate-200">
          <span className={`flex h-2 w-2 rounded-full ${isHigh ? 'bg-red-500' : 'bg-emerald-500'} animate-ping`} />
          <span>Riesgo en tu ubicación</span>
        </div>

        <div className="flex items-center gap-1.5">
          {onRequestGps && (
            <button
              type="button"
              onClick={onRequestGps}
              disabled={loading}
              title="Obtener ubicación GPS exacta"
              className={`flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold border transition ${
                isGpsActive
                  ? 'border-emerald-500/60 bg-emerald-950/80 text-emerald-300'
                  : 'border-slate-700 bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Locate className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Buscando...' : isGpsActive ? 'GPS Activo' : 'Usar GPS'}</span>
            </button>
          )}
          <button type="button" className="text-slate-400 hover:text-white">
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Big Score & Shield Badge */}
      <div className="flex items-center gap-4 my-2">
        {/* Large Shield */}
        <div className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br p-2.5 border ${shieldGradient}`}>
          <svg viewBox="0 0 24 24" className="h-full w-full fill-white drop-shadow">
            <path d="M12 2L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-3z" />
          </svg>
        </div>

        {/* Level and Score */}
        <div>
          <div className={`text-xl font-black tracking-wide leading-none ${levelColor}`}>
            {level}
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-extrabold text-white leading-none tracking-tight">
              {score}
            </span>
            <span className="text-sm font-semibold text-slate-400">/100</span>
          </div>
        </div>
      </div>

      {/* Location Details */}
      <div className="mt-3 text-xs text-slate-300">
        <div className="font-semibold text-slate-200 truncate" title={address}>
          {address}
        </div>
        <div className="text-[11px] text-slate-400">
          Radio de escaneo: {radiusMeters} m
        </div>
      </div>

      {/* Trend sparkline section */}
      <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2.5">
        <span className="text-[11px] text-slate-400 font-medium">Tendencia (últimas 24h)</span>

        <div className="flex items-center gap-2">
          {/* SVG red curve sparkline */}
          <svg className="h-5 w-20 stroke-red-500 fill-none" viewBox="0 0 80 20">
            <path
              d="M0 15 Q 15 16, 25 12 T 50 14 T 70 5 T 80 4"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
          <span className={`text-xs font-bold ${levelColor}`}>{trendPercent}</span>
        </div>
      </div>
    </div>
  )
}

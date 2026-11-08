import { Locate } from 'lucide-react'
import type { LocationRisk } from '../hooks/useUserLocation'

interface RiskLocationCardProps {
  risk: LocationRisk | null
  address: string | null
  isGpsActive: boolean
  loading: boolean
  error?: string | null
  onRequestGps?: () => void
}

export default function RiskLocationCard({
  risk,
  address,
  isGpsActive,
  loading,
  error,
  onRequestGps,
}: RiskLocationCardProps) {
  const level = risk?.level
  const levelColor = level === 'ALTO' ? 'text-red-500' : level === 'MEDIO' ? 'text-amber-500' : 'text-emerald-400'
  const shieldGradient =
    level === 'ALTO'
      ? 'from-red-600 to-red-950 border-red-500/80'
      : level === 'MEDIO'
      ? 'from-amber-600 to-amber-950 border-amber-500/80'
      : level === 'BAJO'
      ? 'from-emerald-600 to-emerald-950 border-emerald-500/80'
      : 'from-slate-600 to-slate-900 border-slate-600'

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0d1424]/90 p-4 shadow-xl backdrop-blur-md">
      <div className="mb-2 flex items-center justify-between text-xs text-slate-300">
        <span className="font-semibold text-slate-200">Riesgo en tu ubicación</span>
        {onRequestGps && (
          <button
            type="button"
            onClick={onRequestGps}
            disabled={loading}
            className={`flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-bold transition ${
              isGpsActive
                ? 'border-emerald-500/60 bg-emerald-950/80 text-emerald-300'
                : 'border-slate-700 bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Locate className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Buscando...' : isGpsActive ? 'GPS activo' : 'Usar GPS'}
          </button>
        )}
      </div>

      <div className="my-2 flex items-center gap-4">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border bg-gradient-to-br p-2.5 ${shieldGradient}`}>
          <svg viewBox="0 0 24 24" className="h-full w-full fill-white drop-shadow">
            <path d="M12 2L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-3z" />
          </svg>
        </div>

        {risk ? (
          <div>
            <div className={`text-xl font-black leading-none tracking-wide ${levelColor}`}>{risk.level}</div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold leading-none tracking-tight text-white">{risk.score}</span>
              <span className="text-sm font-semibold text-slate-400">/100</span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400">
            {loading ? 'Obteniendo tu ubicación...' : error ?? 'Activa tu ubicación para calcular el riesgo cercano.'}
          </p>
        )}
      </div>

      {risk && (
        <div className="mt-3 border-t border-slate-800/80 pt-2.5 text-xs text-slate-300">
          {address && (
            <div className="truncate font-semibold text-slate-200" title={address}>
              {address}
            </div>
          )}
          <div className="text-[11px] text-slate-400">
            {risk.nearbyCount === 0
              ? `No hay incidentes registrados a menos de ${risk.radiusMeters / 1000} km`
              : `${risk.nearbyCount} incidente${risk.nearbyCount === 1 ? '' : 's'} a menos de ${risk.radiusMeters / 1000} km`}
          </div>
        </div>
      )}
    </div>
  )
}

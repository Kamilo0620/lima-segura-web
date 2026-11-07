import type { IncidentFilters, IncidentOrigin, IncidentType } from '../types'
import { INCIDENT_TYPE_CONFIG, LIMA_DISTRICTS } from '../utils/constants'
import { Layers, RefreshCw, SlidersHorizontal, X } from 'lucide-react'

interface IncidentFilterBarProps {
  filters: IncidentFilters
  onFilterChange: (newFilters: IncidentFilters) => void
  showHeatCircles: boolean
  onToggleHeatCircles: () => void
  showMarkers: boolean
  onToggleMarkers: () => void
  onRefresh: () => void
  totalCount?: number
}

export default function IncidentFilterBar({
  filters,
  onFilterChange,
  showHeatCircles,
  onToggleHeatCircles,
  showMarkers,
  onToggleMarkers,
  onRefresh,
  totalCount = 0,
}: IncidentFilterBarProps) {
  function handleChange(key: keyof IncidentFilters, value: any) {
    onFilterChange({ ...filters, [key]: value })
  }

  function handleReset() {
    onFilterChange({
      type: '',
      district: '',
      origin: '',
      minConfidence: 0.5,
    })
  }

  const hasActiveFilters = Boolean(
    filters.type || filters.district || filters.origin || (filters.minConfidence && filters.minConfidence > 0.5),
  )

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 shadow-xl backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-red-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Filtros del Mapa Delictivo
          </span>
          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-400">
            {totalCount} puntos en radar
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Map Layer Toggles */}
          <button
            type="button"
            onClick={onToggleHeatCircles}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
              showHeatCircles
                ? 'bg-red-600/20 text-red-400 border border-red-500/30'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Calor Temporal</span>
          </button>

          <button
            type="button"
            onClick={onToggleMarkers}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
              showMarkers
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Marcadores</span>
          </button>

          <button
            type="button"
            onClick={onRefresh}
            title="Refrescar datos"
            className="rounded-lg bg-slate-900 p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1 rounded-lg bg-red-950/40 px-2 py-1.5 text-xs text-red-300 hover:bg-red-900/50 transition border border-red-800/40"
            >
              <X className="h-3.5 w-3.5" />
              <span>Limpiar</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Selectors Grid */}
      <div className="grid grid-cols-1 gap-3 pt-3 sm:grid-cols-2 md:grid-cols-4">
        {/* Crime Type */}
        <div>
          <label className="mb-1 block text-[11px] font-medium text-slate-400">Tipo de Delito</label>
          <select
            value={filters.type || ''}
            onChange={(e) => handleChange('type', e.target.value as IncidentType)}
            className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 focus:border-red-500 focus:outline-none"
          >
            <option value="">Todos los Delitos</option>
            {Object.entries(INCIDENT_TYPE_CONFIG).map(([typeKey, cfg]) => (
              <option key={typeKey} value={typeKey}>
                {cfg.label}
              </option>
            ))}
          </select>
        </div>

        {/* District */}
        <div>
          <label className="mb-1 block text-[11px] font-medium text-slate-400">Distrito</label>
          <select
            value={filters.district || ''}
            onChange={(e) => handleChange('district', e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 focus:border-red-500 focus:outline-none"
          >
            <option value="">Todos los Distritos (Lima & Callao)</option>
            {LIMA_DISTRICTS.map((dist) => (
              <option key={dist} value={dist}>
                {dist}
              </option>
            ))}
          </select>
        </div>

        {/* Origin (News AI vs Official) */}
        <div>
          <label className="mb-1 block text-[11px] font-medium text-slate-400">Origen de los Datos</label>
          <select
            value={filters.origin || ''}
            onChange={(e) => handleChange('origin', e.target.value as IncidentOrigin)}
            className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 focus:border-red-500 focus:outline-none"
          >
            <option value="">Todas las Fuentes</option>
            <option value="NEWS">Noticias e IA (YouTube / Periódicos)</option>
            <option value="OFFICIAL">Oficial (PNP / Bomberos / INEI)</option>
          </select>
        </div>

        {/* Confidence slider */}
        <div>
          <div className="mb-1 flex items-center justify-between text-[11px] text-slate-400">
            <span>Confianza mínima IA</span>
            <span className="font-semibold text-slate-300">
              {Math.round((filters.minConfidence ?? 0.5) * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            value={filters.minConfidence ?? 0.5}
            onChange={(e) => handleChange('minConfidence', parseFloat(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-red-500"
          />
        </div>
      </div>
    </div>
  )
}

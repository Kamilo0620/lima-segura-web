import { useCallback, useEffect, useState } from 'react'
import type { IncidentFilters, IncidentSummary, PageResponse } from '../types'
import { incidentService } from '../services/incidentService'
import {
  INCIDENT_TYPE_CONFIG,
  LIMA_DISTRICTS,
  ORIGIN_CONFIG,
  formatTimeAgo,
} from '../utils/constants'
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  MapPin,
  RefreshCw,
  Search,
  ShieldAlert,
} from 'lucide-react'
import IncidentDetailModal from '../components/IncidentDetailModal'
import Spinner from '../components/Spinner'

export default function IncidentsPage() {
  const [data, setData] = useState<PageResponse<IncidentSummary> | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedIncidentId, setSelectedIncidentId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<IncidentFilters>({
    type: '',
    district: '',
    origin: '',
    page: 0,
    size: 12,
  })

  const loadIncidents = useCallback(async () => {
    try {
      setLoading(true)
      const res = await incidentService.getIncidents({
        ...filters,
      })
      setData(res)
    } catch (err) {
      console.error('Error cargando lista de incidentes:', err)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    loadIncidents()
  }, [loadIncidents])

  function handleFilterChange(key: keyof IncidentFilters, val: any) {
    setFilters((prev) => ({ ...prev, [key]: val, page: 0 }))
  }

  // Filter content by search query on client
  const incidents = (data?.content || []).filter((item) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      item.title?.toLowerCase().includes(q) ||
      item.summary?.toLowerCase().includes(q) ||
      item.address?.toLowerCase().includes(q) ||
      item.districtName?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-950 p-4 lg:p-8 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-red-500 uppercase">
              <ShieldAlert className="h-4 w-4" />
              Base de Datos Delictiva
            </div>
            <h1 className="text-2xl font-bold text-slate-100 sm:text-3xl">
              Catálogo de Incidentes Registrados
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Registro histórico y en tiempo real alimentado por IA (YouTube, Periódicos) y Fuentes Oficiales.
            </p>
          </div>

          <button
            onClick={loadIncidents}
            className="flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition shadow-lg"
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar Registro
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-xl backdrop-blur-xl">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar por palabra clave, calle o detalle..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:border-red-500 focus:outline-none"
              />
            </div>

            {/* Crime Type */}
            <div>
              <select
                value={filters.type || ''}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-red-500 focus:outline-none"
              >
                <option value="">Todos los Delitos</option>
                {Object.entries(INCIDENT_TYPE_CONFIG).map(([k, cfg]) => (
                  <option key={k} value={k}>
                    {cfg.label}
                  </option>
                ))}
              </select>
            </div>

            {/* District */}
            <div>
              <select
                value={filters.district || ''}
                onChange={(e) => handleFilterChange('district', e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-red-500 focus:outline-none"
              >
                <option value="">Todos los Distritos</option>
                {LIMA_DISTRICTS.map((dist) => (
                  <option key={dist} value={dist}>
                    {dist}
                  </option>
                ))}
              </select>
            </div>

            {/* Origin */}
            <div>
              <select
                value={filters.origin || ''}
                onChange={(e) => handleFilterChange('origin', e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-red-500 focus:outline-none"
              >
                <option value="">Cualquier Origen</option>
                <option value="NEWS">Noticias e IA</option>
                <option value="OFFICIAL">Oficial (PNP / INEI)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3">
            <Spinner />
            <p className="text-xs text-slate-400">Consultando incidentes...</p>
          </div>
        ) : incidents.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center">
            <ShieldAlert className="mx-auto mb-3 h-10 w-10 text-slate-600" />
            <h3 className="text-base font-semibold text-slate-300">No se encontraron incidentes</h3>
            <p className="mt-1 text-xs text-slate-500">
              Prueba cambiando los filtros o el término de búsqueda.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {incidents.map((inc) => {
              const config = INCIDENT_TYPE_CONFIG[inc.incidentType] || INCIDENT_TYPE_CONFIG.OTHER
              const origin = ORIGIN_CONFIG[inc.origin] || ORIGIN_CONFIG.NEWS

              return (
                <div
                  key={inc.id}
                  className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl transition hover:border-slate-700 hover:bg-slate-900 backdrop-blur-md"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-bold tracking-wider ${config.bg} ${config.color} border ${config.border}`}
                      >
                        {config.label}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {formatTimeAgo(inc.occurredAt)}
                      </span>
                    </div>

                    <h3 className="line-clamp-2 text-sm font-bold text-slate-100">
                      {inc.title}
                    </h3>

                    <p className="line-clamp-3 text-xs leading-relaxed text-slate-400">
                      {inc.summary}
                    </p>
                  </div>

                  <div className="mt-4 border-t border-slate-800/80 pt-3">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-red-400" />
                        {inc.districtName || 'Lima'}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Confianza: {Math.round((inc.confidence || 0.8) * 100)}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={`rounded px-2 py-0.5 text-[10px] font-medium ${origin.badge}`}>
                        {origin.label}
                      </span>

                      <button
                        onClick={() => setSelectedIncidentId(inc.id)}
                        className="flex items-center gap-1 rounded-lg bg-red-600/20 px-3 py-1.5 text-xs font-semibold text-red-400 border border-red-500/30 transition hover:bg-red-600 hover:text-white"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Ver Expediente
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-800/80 pt-4">
            <span className="text-xs text-slate-400">
              Página <span className="font-semibold text-slate-200">{(data.number || 0) + 1}</span> de{' '}
              <span className="font-semibold text-slate-200">{data.totalPages}</span> ({data.totalElements} incidentes)
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={data.first}
                onClick={() => handleFilterChange('page', Math.max(0, (filters.page || 0) - 1))}
                className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 disabled:opacity-40 hover:bg-slate-800"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </button>

              <button
                disabled={data.last}
                onClick={() => handleFilterChange('page', (filters.page || 0) + 1)}
                className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 disabled:opacity-40 hover:bg-slate-800"
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Intelligence Modal */}
      <IncidentDetailModal
        incidentId={selectedIncidentId}
        onClose={() => setSelectedIncidentId(null)}
      />
    </div>
  )
}

import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import IncidentDetailModal from '../components/IncidentDetailModal'
import ReportIncidentModal from '../components/ReportIncidentModal'
import Pagination from '../components/Pagination'
import EmptyState from '../components/EmptyState'
import ErrorMessage from '../components/ErrorMessage'
import Spinner from '../components/Spinner'
import { incidentService } from '../services/incidentService'
import { useFetch } from '../hooks/useFetch'
import { useDebounce } from '../hooks/useDebounce'
import type { IncidentOrigin, IncidentStatus, IncidentType } from '../types'
import {
  INCIDENT_TYPE_CONFIG,
  LIMA_DISTRICTS,
  ORIGIN_CONFIG,
  STATUS_CONFIG,
  formatDateTime,
} from '../utils/constants'
import { ExternalLink, FileText, PlusCircle, Search } from 'lucide-react'

const PAGE_SIZE = 15

export default function ReportsPage() {
  // Los filtros viven en la URL (?q=...&type=...&page=...) para poder compartir o recargar la búsqueda
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page') ?? 0)
  const type = searchParams.get('type') ?? ''
  const district = searchParams.get('district') ?? ''
  const status = searchParams.get('status') ?? ''
  const origin = searchParams.get('origin') ?? ''
  const q = searchParams.get('q') ?? ''

  // El texto se escribe en un estado local y se envía al servidor 400 ms después de dejar de teclear
  const [searchText, setSearchText] = useState(q)
  const debouncedSearch = useDebounce(searchText, 400)

  const [selectedIncidentId, setSelectedIncidentId] = useState<number | null>(null)
  const [reportModalOpen, setReportModalOpen] = useState(false)

  const updateParam = (key: string, value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value) next.set(key, value)
      else next.delete(key)
      if (key !== 'page') next.delete('page') // al cambiar un filtro se vuelve a la primera página
      return next
    })
  }

  const fetcher = useCallback(
    (signal: AbortSignal) =>
      incidentService.getIncidents(
        {
          type: type as IncidentType,
          district,
          status: status as IncidentStatus,
          origin: origin as IncidentOrigin,
          search: q,
          page,
          size: PAGE_SIZE,
        },
        signal,
      ),
    [type, district, status, origin, q, page],
  )
  const { data, loading, error, refetch } = useFetch(fetcher)

  // Cuando el usuario deja de escribir, el texto pasa a la URL (y eso dispara la búsqueda en el servidor)
  useEffect(() => {
    if (debouncedSearch.trim() !== q) updateParam('q', debouncedSearch.trim())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  const selectClass =
    'rounded-xl border border-slate-800 bg-[#070b14] px-3 py-2 text-xs text-slate-200 focus:border-red-500 focus:outline-none'

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-[#050811] text-slate-100">
      <Sidebar />

      <main className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 lg:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-[#0d1424]/90 p-5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-500/40 bg-blue-950/80 text-blue-400">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="flex items-center gap-2 text-lg font-black text-white">
                Reportes de incidentes
                {data && (
                  <span className="rounded-full border border-blue-500/40 bg-blue-950/60 px-2.5 py-0.5 text-xs font-bold text-blue-300">
                    {data.totalElements} resultados
                  </span>
                )}
              </h1>
              <p className="text-xs text-slate-400">
                Incidentes extraídos de noticias y reportes enviados por vecinos.
              </p>
            </div>
          </div>

          <button
            onClick={() => setReportModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-red-600/30 transition hover:bg-red-500"
          >
            <PlusCircle className="h-4 w-4" />
            Reportar incidente
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-800 bg-[#0d1424]/70 p-4 md:grid-cols-5">
          <div className="relative md:col-span-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Buscar por título o calle..."
              className="w-full rounded-xl border border-slate-800 bg-[#070b14] py-2 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:border-red-500 focus:outline-none"
            />
          </div>

          <select value={type} onChange={(e) => updateParam('type', e.target.value)} className={selectClass}>
            <option value="">Todos los tipos</option>
            {(Object.keys(INCIDENT_TYPE_CONFIG) as IncidentType[]).map((t) => (
              <option key={t} value={t}>
                {INCIDENT_TYPE_CONFIG[t].label}
              </option>
            ))}
          </select>

          <select value={district} onChange={(e) => updateParam('district', e.target.value)} className={selectClass}>
            <option value="">Todos los distritos</option>
            {LIMA_DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select value={status} onChange={(e) => updateParam('status', e.target.value)} className={selectClass}>
            <option value="">Cualquier estado</option>
            <option value="PUBLISHED">Publicado</option>
            <option value="PENDING_REVIEW">Pendiente de confirmación</option>
            <option value="VALIDATED">Validado</option>
            <option value="REJECTED">Descartado</option>
          </select>

          <select value={origin} onChange={(e) => updateParam('origin', e.target.value)} className={selectClass}>
            <option value="">Cualquier origen</option>
            <option value="CITIZEN">Reporte vecinal</option>
            <option value="NEWSPAPER">Prensa</option>
            <option value="YOUTUBE">YouTube</option>
            <option value="SAMPLE">Datos de ejemplo</option>
          </select>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Spinner />
          </div>
        ) : error ? (
          <ErrorMessage message={error} onRetry={refetch} />
        ) : !data || data.content.length === 0 ? (
          <EmptyState message="No se encontraron incidentes con esos filtros." />
        ) : (
          <div className="divide-y divide-slate-800/80 overflow-hidden rounded-2xl border border-slate-800 bg-[#0d1424]/90 shadow-xl">
            {data.content.map((incident) => {
              const config = INCIDENT_TYPE_CONFIG[incident.incidentType] ?? INCIDENT_TYPE_CONFIG.OTHER
              const originCfg = ORIGIN_CONFIG[incident.origin]
              const statusCfg = STATUS_CONFIG[incident.status]
              const sev = config.severity

              return (
                <button
                  type="button"
                  key={incident.id}
                  onClick={() => setSelectedIncidentId(incident.id)}
                  className="flex w-full flex-col justify-between gap-3 p-4 text-left transition hover:bg-slate-800/40 sm:flex-row sm:items-center"
                >
                  <div className="flex flex-1 items-start gap-3">
                    <span
                      className={`mt-1.5 inline-block h-3 w-3 shrink-0 rounded-full ${
                        sev >= 8 ? 'bg-red-500' : sev >= 5 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                    />
                    <div>
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${config.bg} ${config.color} ${config.border}`}>
                          {config.label}
                        </span>
                        <span className="rounded-md border border-slate-800 bg-[#070b14] px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                          {incident.districtName || 'Distrito no identificado'}
                        </span>
                        {originCfg && (
                          <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${originCfg.badge}`}>
                            {originCfg.label}
                          </span>
                        )}
                        {statusCfg && (
                          <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${statusCfg.badge}`}>
                            {statusCfg.label}
                            {incident.origin === 'CITIZEN' && incident.status === 'PENDING_REVIEW' &&
                              ` · ${incident.confirmationsCount ?? 0}/3`}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-slate-100">{incident.title}</h3>
                      {(incident.address || incident.summary) && (
                        <p className="mt-0.5 line-clamp-1 text-xs text-slate-400">
                          {incident.address || incident.summary}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center justify-between gap-4 sm:justify-end">
                    <div className="text-right text-[11px] text-slate-400">
                      <div>
                        Gravedad: <span className="font-bold text-white">{sev}/10</span>
                      </div>
                      <div className="text-[10px] text-slate-500">{formatDateTime(incident.occurredAt)}</div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-slate-400" />
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {data && (
          <Pagination
            page={page}
            totalPages={data.totalPages}
            onPageChange={(p) => updateParam('page', String(p))}
          />
        )}
      </main>

      <ReportIncidentModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        onIncidentReported={refetch}
      />

      <IncidentDetailModal incidentId={selectedIncidentId} onClose={() => setSelectedIncidentId(null)} />
    </div>
  )
}

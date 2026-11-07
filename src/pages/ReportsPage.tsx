import { useState, useEffect, useCallback } from 'react'
import Sidebar from '../components/Sidebar'
import IncidentDetailModal from '../components/IncidentDetailModal'
import ReportIncidentModal from '../components/ReportIncidentModal'
import { incidentService } from '../services/incidentService'
import type { IncidentSummary, IncidentType } from '../types'
import { INCIDENT_TYPE_CONFIG, LIMA_DISTRICTS } from '../utils/constants'
import {
  FileText,
  PlusCircle,
  Search,
  CheckCircle2,
  Clock,
  ExternalLink,
  Shield,
  Radio,
} from 'lucide-react'

export default function ReportsPage() {
  const [incidents, setIncidents] = useState<IncidentSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [selectedIncidentId, setSelectedIncidentId] = useState<number | null>(null)
  const [reportModalOpen, setReportModalOpen] = useState(false)

  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')

  const fetchReports = useCallback(async () => {
    setLoading(true)
    try {
      const data = await incidentService.getIncidents({
        district: selectedDistrict || undefined,
        incidentType: (selectedType as IncidentType) || undefined,
        status: selectedStatus || undefined,
        page,
        size: 15,
      })
      setIncidents(data.content || [])
      setTotalPages(data.totalPages || 1)
      setTotalElements(data.totalElements || 0)
    } catch (err) {
      console.error('Error al cargar reportes:', err)
    } finally {
      setLoading(false)
    }
  }, [selectedDistrict, selectedType, selectedStatus, page])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const filteredIncidents = incidents.filter((i) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    const titleMatch = i.title?.toLowerCase().includes(q)
    const descMatch = (i.summary || i.description || '')?.toLowerCase().includes(q)
    const locMatch = (i.address || i.exactLocation || '')?.toLowerCase().includes(q)
    const distMatch = (i.districtName || i.district?.name || '')?.toLowerCase().includes(q)
    return titleMatch || descMatch || locMatch || distMatch
  })

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-[#050811] text-slate-100">
      <Sidebar />

      <main className="flex-1 flex flex-col p-4 lg:p-6 gap-4 overflow-y-auto">
        {/* Header Section */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-[#0d1424]/90 p-5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-950/80 border border-blue-500/40 text-blue-400">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white flex items-center gap-2">
                Centro de Reportes &amp; Denuncias Delictivas
                <span className="rounded-full bg-blue-950/60 border border-blue-500/40 px-2.5 py-0.5 text-xs font-bold text-blue-300">
                  {totalElements} expedientes
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Historial auditado de incidentes procesados por IA y reportes generados por la comunidad.
              </p>
            </div>
          </div>

          <button
            onClick={() => setReportModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-red-600/30 hover:bg-red-500 transition"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Reportar Incidente</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 rounded-2xl border border-slate-800 bg-[#0d1424]/70 p-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por palabra clave, calle..."
              className="w-full rounded-xl border border-slate-800 bg-[#070b14] py-2 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:border-red-500 focus:outline-none"
            />
          </div>

          {/* Crime Type */}
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value)
              setPage(0)
            }}
            className="rounded-xl border border-slate-800 bg-[#070b14] px-3 py-2 text-xs text-slate-200 focus:border-red-500 focus:outline-none"
          >
            <option value="">Todos los tipos de delito</option>
            {(Object.keys(INCIDENT_TYPE_CONFIG) as IncidentType[]).map((type) => (
              <option key={type} value={type}>
                {INCIDENT_TYPE_CONFIG[type]?.label || type}
              </option>
            ))}
          </select>

          {/* District */}
          <select
            value={selectedDistrict}
            onChange={(e) => {
              setSelectedDistrict(e.target.value)
              setPage(0)
            }}
            className="rounded-xl border border-slate-800 bg-[#070b14] px-3 py-2 text-xs text-slate-200 focus:border-red-500 focus:outline-none"
          >
            <option value="">Todos los distritos</option>
            {LIMA_DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Status */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value)
              setPage(0)
            }}
            className="rounded-xl border border-slate-800 bg-[#070b14] px-3 py-2 text-xs text-slate-200 focus:border-red-500 focus:outline-none"
          >
            <option value="">Cualquier estado</option>
            <option value="VERIFIED">Verificado (Oficial/Confirmado)</option>
            <option value="PENDING_REVIEW">En Revisión / Pendiente</option>
            <option value="REJECTED">Descartado</option>
          </select>
        </div>

        {/* Reports Feed Table / List */}
        <div className="rounded-2xl border border-slate-800 bg-[#0d1424]/90 overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
              <span className="h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
              Cargando expedientes del radar...
            </div>
          ) : filteredIncidents.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No se encontraron incidentes con los filtros seleccionados.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {filteredIncidents.map((incident) => {
                const config = (INCIDENT_TYPE_CONFIG as any)[incident.incidentType] || {
                  label: incident.incidentType,
                  color: 'red',
                  bg: 'bg-red-950/60 text-red-400 border-red-500/40',
                }
                const isVerified = incident.status === 'VALIDATED' || (incident.status as any) === 'VERIFIED'
                const isCitizen = (incident.origin as any) === 'CITIZEN' || incident.title.includes('Ciudadano')
                const sev = incident.severity || Math.round((incident.confidence || 0.8) * 10)

                return (
                  <div
                    key={incident.id}
                    onClick={() => setSelectedIncidentId(incident.id)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-slate-800/40 transition cursor-pointer gap-3"
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-1">
                        <span
                          className={`inline-block h-3 w-3 rounded-full ${
                            sev >= 8
                              ? 'bg-red-500 shadow-[0_0_8px_#ef4444]'
                              : sev >= 5
                              ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]'
                              : 'bg-emerald-500'
                          }`}
                        />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span
                            className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${config.bg || config.badgeBg || 'bg-red-950/60 text-red-400 border-red-500/40'}`}
                          >
                            {config.label}
                          </span>
                          <span className="rounded-md border border-slate-800 bg-[#070b14] px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                            {incident.districtName || incident.district?.name || 'Lima'}
                          </span>
                          {isCitizen ? (
                            <span className="rounded-md border border-purple-500/40 bg-purple-950/60 px-2 py-0.5 text-[10px] font-bold text-purple-300 flex items-center gap-1">
                              <Radio className="h-3 w-3" /> Reporte Vecinal
                            </span>
                          ) : (
                            <span className="rounded-md border border-blue-500/40 bg-blue-950/60 px-2 py-0.5 text-[10px] font-bold text-blue-300 flex items-center gap-1">
                              <Shield className="h-3 w-3" /> Prensa Oficial
                            </span>
                          )}
                          {isVerified ? (
                            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                              <CheckCircle2 className="h-3 w-3" /> Verificado
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] text-amber-400 font-bold">
                              <Clock className="h-3 w-3" /> En Revisión
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-slate-100 hover:text-red-400 transition">
                          {incident.title}
                        </h3>
                        <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                          {incident.address || incident.exactLocation || incident.summary || incident.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end">
                      <div className="text-right text-[11px] text-slate-400">
                        <div>Severidad: <span className="font-bold text-white">{sev}/10</span></div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(incident.occurredAt).toLocaleDateString('es-PE', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>

                      <button
                        type="button"
                        className="rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-300 hover:text-white"
                        title="Ver expediente detallado"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-slate-800/80 px-4 py-3 text-xs text-slate-400">
            <div>
              Página {page + 1} de {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                disabled={page <= 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="rounded-lg border border-slate-800 bg-[#070b14] px-3 py-1 text-slate-300 disabled:opacity-40 hover:bg-slate-800"
              >
                Anterior
              </button>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-slate-800 bg-[#070b14] px-3 py-1 text-slate-300 disabled:opacity-40 hover:bg-slate-800"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <ReportIncidentModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        onIncidentReported={fetchReports}
      />

      {selectedIncidentId && (
        <IncidentDetailModal
          incidentId={selectedIncidentId}
          onClose={() => setSelectedIncidentId(null)}
        />
      )}
    </div>
  )
}

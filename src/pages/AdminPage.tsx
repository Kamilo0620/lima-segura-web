import { useEffect, useState } from 'react'
import type {
  DatasetImportResult,
  IncidentSummary,
  IngestionRun,
  NewsSource,
  SourceItem,
} from '../types'
import { adminService } from '../services/adminService'
import { formatDateTime } from '../utils/constants'
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Database,
  FileSpreadsheet,
  Globe,
  Play,
  Radio,
  RefreshCw,
  RotateCcw,
  Shield,
  Tv,
  Upload,
  XCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import Spinner from '../components/Spinner'

type AdminTab = 'runs' | 'sources' | 'items' | 'moderation' | 'datasets'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('runs')
  const [loading, setLoading] = useState<boolean>(false)

  // Ingestion Runs state
  const [runs, setRuns] = useState<IngestionRun[]>([])
  // Sources state
  const [sources, setSources] = useState<NewsSource[]>([])
  // Source Items state
  const [items, setItems] = useState<SourceItem[]>([])
  // Moderation incidents
  const [pendingIncidents, setPendingIncidents] = useState<IncidentSummary[]>([])
  // CSV Import state
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [importResult, setImportResult] = useState<DatasetImportResult | null>(null)
  const [importing, setImporting] = useState<boolean>(false)

  // Load data depending on active tab
  const loadData = async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      if (activeTab === 'runs') {
        const res = await adminService.getIngestionRuns(undefined, 0, 30)
        setRuns(res.content || [])
      } else if (activeTab === 'sources') {
        const data = await adminService.getSources()
        setSources(data || [])
      } else if (activeTab === 'items') {
        const res = await adminService.getSourceItems(undefined, 0, 40)
        setItems(res.content || [])
      } else if (activeTab === 'moderation') {
        const res = await adminService.getIncidentsForReview('PENDING_REVIEW', 0, 30)
        setPendingIncidents(res.content || [])
      }
    } catch (err: any) {
      if (!silent) toast.error(err?.message || 'Error cargando datos administrativos')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    loadData(false)
    const interval = setInterval(() => {
      loadData(true)
    }, 8000)
    return () => clearInterval(interval)
  }, [activeTab])

  // Trigger immediate manual ingestion
  const handleTriggerIngestion = async (sourceId: number, name: string) => {
    try {
      await adminService.triggerSourceIngestion(sourceId)
      toast.success(`Sondeo forzado iniciado para: ${name}`)
      setTimeout(() => loadData(true), 1500)
      setTimeout(() => loadData(true), 4500)
    } catch (err: any) {
      toast.error(`Error al disparar ingesta: ${err?.message || 'Fallo de conexión'}`)
    }
  }

  // Trigger all sources ingestion
  const handleTriggerAllSources = async () => {
    try {
      toast.loading('Disparando sondeo y extracción IA en todas las fuentes...', { id: 'ingest-all' })
      const res = await adminService.triggerAllIngestion()
      toast.success(
        res?.sourcesPolled
          ? `Ciclo completado: ${res.sourcesPolled} fuentes sondeadas (+${res.newItemsRelevant ?? 0} nuevos incidentes procesados)`
          : res?.message || 'Ciclo de ingesta disparado exitosamente',
        { id: 'ingest-all', duration: 5000 }
      )
      loadData(true)
      setTimeout(() => loadData(true), 3000)
      setTimeout(() => loadData(true), 7000)
    } catch (err: any) {
      toast.error('Error al forzar ciclo completo de ingesta', { id: 'ingest-all' })
    }
  }

  // Reprocess source item
  const handleReprocessItem = async (itemId: number) => {
    try {
      await adminService.reprocessSourceItem(itemId)
      toast.success(`Item #${itemId} puesto en cola para reanálisis con IA`)
      setTimeout(loadData, 1500)
    } catch (err: any) {
      toast.error('Error al reprocesar item')
    }
  }

  // Moderate incident (Approve / Reject)
  const handleModerateIncident = async (id: number, status: 'VALIDATED' | 'REJECTED') => {
    try {
      await adminService.reviewIncident(id, {
        status,
        reviewNotes: status === 'VALIDATED' ? 'Aprobado por consola admin' : 'Rechazado por inconsistencia',
      })
      toast.success(status === 'VALIDATED' ? 'Incidente publicado en mapa' : 'Incidente descartado')
      setPendingIncidents((prev) => prev.filter((i) => i.id !== id))
    } catch (err: any) {
      toast.error('Error al procesar moderación')
    }
  }

  // CSV Import handler
  const handleImportCsv = async () => {
    if (!csvFile) {
      toast.error('Selecciona un archivo CSV antes de importar')
      return
    }
    setImporting(true)
    try {
      const result = await adminService.importDataset(csvFile)
      setImportResult(result)
      toast.success(`Importación exitosa: ${result.importedCount} incidentes cargados`)
      setCsvFile(null)
    } catch (err: any) {
      toast.error(err?.message || 'Error al importar dataset CSV')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-950 p-4 lg:p-8 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-red-500 uppercase">
              <Shield className="h-4 w-4" />
              Consola Central de Operaciones
            </div>
            <h1 className="text-2xl font-bold text-slate-100 sm:text-3xl">
              Administración de Ingesta & Datos Oficiales
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Monitoreo del pipeline automatizado, control de fuentes periodísticas, moderación y datasets PNP/INEI.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleTriggerAllSources}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2 text-xs font-bold text-white hover:from-red-500 hover:to-red-600 transition shadow-lg shadow-red-600/30 active:scale-95"
            >
              <Play className="h-4 w-4" />
              <span>⚡ Forzar Ingesta para Todas las Fuentes</span>
            </button>

            <button
              onClick={() => loadData(false)}
              className="flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition shadow-lg"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Actualizar Tablero</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800/80 pb-2">
          <button
            onClick={() => setActiveTab('runs')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
              activeTab === 'runs'
                ? 'bg-red-600 text-white shadow-lg'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>Corridas de Ingesta (Runs)</span>
          </button>

          <button
            onClick={() => setActiveTab('sources')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
              activeTab === 'sources'
                ? 'bg-red-600 text-white shadow-lg'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <Radio className="h-4 w-4" />
            <span>Catálogo de Fuentes (Medios)</span>
          </button>

          <button
            onClick={() => setActiveTab('items')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
              activeTab === 'items'
                ? 'bg-red-600 text-white shadow-lg'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <Database className="h-4 w-4" />
            <span>Items Descubiertos (Noticias / Audio)</span>
          </button>

          <button
            onClick={() => setActiveTab('moderation')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
              activeTab === 'moderation'
                ? 'bg-red-600 text-white shadow-lg'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="h-4 w-4" />
            <span>Cola de Moderación ({pendingIncidents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('datasets')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
              activeTab === 'datasets'
                ? 'bg-red-600 text-white shadow-lg'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Carga CSV PNP / INEI</span>
          </button>
        </div>

        {/* Tab 1: Ingestion Runs */}
        {activeTab === 'runs' && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  Historial de Ciclos de Ingesta (Cada 5 Minutos)
                </h3>
                <p className="text-xs text-slate-400">
                  Registro cronológico de sondeos automáticos contra canales RSS de periódicos y YouTube.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <Spinner />
              </div>
            ) : runs.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-500">
                Aún no hay ciclos de ingesta registrados en la base de datos.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase">
                    <tr>
                      <th className="p-3">ID</th>
                      <th className="p-3">Fuente Monitoreada</th>
                      <th className="p-3">Fecha y Hora</th>
                      <th className="p-3">Items Hallados</th>
                      <th className="p-3">Nuevos Incidentes</th>
                      <th className="p-3">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {runs.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-mono text-slate-400">#{r.id}</td>
                        <td className="p-3 font-semibold text-slate-200">{r.sourceName || `Fuente #${r.sourceId}`}</td>
                        <td className="p-3 text-slate-400">{formatDateTime(r.startedAt)}</td>
                        <td className="p-3 text-slate-300 font-mono">{r.itemsFound}</td>
                        <td className="p-3 font-mono text-emerald-400 font-bold">+{r.itemsNew}</td>
                        <td className="p-3">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              r.status === 'SUCCESS' || r.status === 'COMPLETED'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                                : r.status === 'RUNNING'
                                ? 'bg-blue-950 text-blue-300 border border-blue-500/30 animate-pulse'
                                : 'bg-red-950 text-red-300 border border-red-500/30'
                            }`}
                          >
                            {r.status === 'COMPLETED' || r.status === 'SUCCESS'
                              ? 'COMPLETADO'
                              : r.status === 'RUNNING'
                              ? 'EN CURSO'
                              : r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Sources Catalog */}
        {activeTab === 'sources' && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  Matriz de Fuentes de Información Periodística ({sources.length})
                </h3>
                <p className="text-xs text-slate-400">
                  Ponderación de credibilidad (1 a 10) y frecuencia de sondeo en minutos.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <Spinner />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {sources.map((s) => (
                  <div
                    key={s.id}
                    className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950/70 p-4 shadow-lg"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                          {s.type === 'YOUTUBE_CHANNEL' ? (
                            <Tv className="h-4 w-4 text-red-500" />
                          ) : (
                            <Globe className="h-4 w-4 text-cyan-400" />
                          )}
                          {s.type}
                        </span>

                        <span className="rounded bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                          Credibilidad: {s.credibility}/10
                        </span>
                      </div>

                      <h4 className="mt-2 text-sm font-bold text-slate-100">{s.name}</h4>
                      <p className="mt-1 line-clamp-1 text-[11px] font-mono text-slate-500">{s.url}</p>

                      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Intervalo: cada {s.pollIntervalMinutes} min</span>
                        <span>Estado: {s.active ? '🟢 Activo' : '⚪ Pausado'}</span>
                      </div>
                    </div>

                    <div className="mt-4 border-t border-slate-800/80 pt-3">
                      <button
                        onClick={() => handleTriggerIngestion(s.id, s.name)}
                        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-red-600/20 py-2 text-xs font-semibold text-red-400 border border-red-500/30 hover:bg-red-600 hover:text-white transition shadow"
                      >
                        <Play className="h-3.5 w-3.5" />
                        Forzar Ingesta Inmediata
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Source Items */}
        {activeTab === 'items' && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl backdrop-blur-xl space-y-4">
            <h3 className="text-base font-bold text-slate-100">
              Items Capturados (Artículos de Periódicos y Videos de YouTube)
            </h3>
            <p className="text-xs text-slate-400">
              Contenido descubierto antes y después de su procesamiento por el LLM.
            </p>

            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <Spinner />
              </div>
            ) : items.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-500">
                No hay items capturados actualmente.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase">
                    <tr>
                      <th className="p-3">ID</th>
                      <th className="p-3">Medio</th>
                      <th className="p-3">Titular / Asunto</th>
                      <th className="p-3">Estado</th>
                      <th className="p-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {items.map((it) => (
                      <tr key={it.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-mono text-slate-400">#{it.id}</td>
                        <td className="p-3 text-slate-300 font-semibold">{it.sourceName}</td>
                        <td className="p-3 max-w-md">
                          <div className="font-semibold text-slate-200 line-clamp-1">{it.title}</div>
                          <div className="text-[11px] font-mono text-slate-500 line-clamp-1">{it.url}</div>
                        </td>
                        <td className="p-3">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              it.status === 'EXTRACTED'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                                : it.status === 'CONTENT_READY' || it.status === 'DISCOVERED'
                                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                                : it.status === 'IRRELEVANT'
                                ? 'bg-slate-800 text-slate-400 border border-slate-700'
                                : 'bg-red-950 text-red-300 border border-red-500/30'
                            }`}
                          >
                            {it.status === 'EXTRACTED'
                              ? 'PROCESADO IA'
                              : it.status === 'CONTENT_READY' || it.status === 'DISCOVERED'
                              ? 'EN COLA IA'
                              : it.status === 'IRRELEVANT'
                              ? 'FILTRADO (NO DELITO)'
                              : it.status}
                          </span>
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => handleReprocessItem(it.id)}
                            className="flex items-center gap-1 rounded bg-slate-800 px-2.5 py-1 text-[11px] text-cyan-400 hover:bg-slate-700 transition"
                          >
                            <RotateCcw className="h-3 w-3" />
                            Reprocesar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Moderation */}
        {activeTab === 'moderation' && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl backdrop-blur-xl space-y-4">
            <h3 className="text-base font-bold text-slate-100">
              Cola de Revisión y Validación de Incidentes
            </h3>
            <p className="text-xs text-slate-400">
              Incidentes que requieren confirmación humana antes de ser reflejados en el mapa de calor público.
            </p>

            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <Spinner />
              </div>
            ) : pendingIncidents.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                <CheckCircle className="mx-auto mb-2 h-8 w-8 text-emerald-500" />
                <p className="font-semibold text-slate-200">No hay incidentes pendientes de revisión.</p>
                <p className="text-slate-500 mt-1">Todos los eventos actuales fueron aprobados automáticamente.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingIncidents.map((inc) => (
                  <div
                    key={inc.id}
                    className="flex flex-col justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/70 p-4 md:flex-row md:items-center"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-yellow-950 px-2 py-0.5 text-[10px] font-bold text-yellow-400 border border-yellow-500/30">
                          {inc.incidentType}
                        </span>
                        <span className="text-xs text-slate-400">{inc.districtName}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-100">{inc.title}</h4>
                      <p className="text-xs text-slate-400">{inc.summary}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleModerateIncident(inc.id, 'VALIDATED')}
                        className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg hover:bg-emerald-500 transition"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Aprobar
                      </button>

                      <button
                        onClick={() => handleModerateIncident(inc.id, 'REJECTED')}
                        className="flex items-center gap-1 rounded-xl bg-red-950/60 border border-red-800 px-3.5 py-2 text-xs font-semibold text-red-300 hover:bg-red-900 transition"
                      >
                        <XCircle className="h-4 w-4" />
                        Rechazar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: CSV Import */}
        {activeTab === 'datasets' && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-xl space-y-6 max-w-2xl mx-auto">
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Importación de Datasets Oficiales (PNP / INEI)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Carga masiva de denuncias policiales y censos de criminalidad en formato CSV para poblar el mapa como Fuente Oficial (Ground Truth).
              </p>
            </div>

            {/* Upload Zone */}
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-700 bg-slate-950/60 p-8 text-center transition hover:border-red-500/50">
              <Upload className="mb-3 h-10 w-10 text-slate-500" />
              <label className="cursor-pointer">
                <span className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-lg hover:bg-red-500 transition">
                  Seleccionar archivo CSV
                </span>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                />
              </label>
              {csvFile ? (
                <p className="mt-3 text-xs font-semibold text-emerald-400">
                  Archivo seleccionado: {csvFile.name} ({(csvFile.size / 1024).toFixed(1)} KB)
                </p>
              ) : (
                <p className="mt-2 text-[11px] text-slate-500">
                  Formato esperado: CSV con columnas latitud, longitud, tipo_delito, distrito, fecha.
                </p>
              )}
            </div>

            <button
              disabled={!csvFile || importing}
              onClick={handleImportCsv}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-xs font-bold text-white shadow-lg hover:bg-red-500 transition disabled:opacity-50"
            >
              {importing ? <Spinner /> : <FileSpreadsheet className="h-4 w-4" />}
              {importing ? 'Procesando e Indexando CSV...' : 'Cargar Dataset al Sistema'}
            </button>

            {/* Import Summary */}
            {importResult && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-4 text-xs space-y-1.5 text-emerald-200">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  Resumen de la Carga:
                </div>
                <div>Filas procesadas: {importResult.totalRows}</div>
                <div>Incidentes importados con éxito: {importResult.importedCount}</div>
                <div>Filas omitidas o duplicadas: {importResult.skippedCount}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

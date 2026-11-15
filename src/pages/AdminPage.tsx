import { useEffect, useState } from 'react'
import type {
  DatasetImportResult,
  IncidentSummary,
  IngestionRun,
  NewsSource,
  OfficialSourcesStatusResponse,
  PipelineTelemetryResponse,
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
  Radar,
  Radio,
  RefreshCw,
  RotateCcw,
  Shield,
  Terminal,
  Tv,
  Upload,
  XCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import Spinner from '../components/Spinner'

type AdminTab = 'runs' | 'sources' | 'items' | 'moderation' | 'datasets' | 'logs'

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
  // CSV Import & Official PNP/INEI Sources state
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [importResult, setImportResult] = useState<DatasetImportResult | null>(null)
  const [importing, setImporting] = useState<boolean>(false)
  const [officialStatus, setOfficialStatus] = useState<OfficialSourcesStatusResponse | null>(null)
  const [syncingPnp, setSyncingPnp] = useState<boolean>(false)
  const [crossVerifying, setCrossVerifying] = useState<boolean>(false)
  const [telemetry, setTelemetry] = useState<PipelineTelemetryResponse | null>(null)

  const loadTelemetry = async () => {
    try {
      const data = await adminService.getTelemetry()
      setTelemetry(data)
    } catch {
      // Ignora fallo silencioso de sondeo de telemetría
    }
  }

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
      } else if (activeTab === 'datasets') {
        const data = await adminService.getOfficialSourcesStatus(false)
        setOfficialStatus(data)
      } else if (activeTab === 'logs') {
        await loadTelemetry()
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

  useEffect(() => {
    loadTelemetry()
    const telemetryInterval = setInterval(loadTelemetry, 3000)
    return () => clearInterval(telemetryInterval)
  }, [])

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

  const handleCrossVerify = async () => {
    setCrossVerifying(true)
    try {
      const stats = await adminService.triggerCrossVerification()
      toast.success(
        `Verificación cruzada: ${stats.inspected} revisados, ${stats.refinedGeo} calles precisadas, ${stats.refinedTime} horas exactas`,
      )
      loadData(true)
    } catch (err: any) {
      toast.error(err?.message || 'Error en verificación cruzada')
    } finally {
      setCrossVerifying(false)
    }
  }

  const handleSyncPnpBaseline = async () => {
    setSyncingPnp(true)
    try {
      const result = await adminService.syncPnpBaseline(25)
      setImportResult(result)
      toast.success(result.message || `Lote PNP filtrado: ${result.importedCount} útiles`)
    } catch (err: any) {
      toast.error(err?.message || 'Error sincronizando GEOMININTER')
    } finally {
      setSyncingPnp(false)
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
              disabled={crossVerifying}
              onClick={handleCrossVerify}
              className="flex items-center gap-2 rounded-xl bg-slate-900 border border-emerald-500/40 px-4 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-950/40 transition shadow-lg disabled:opacity-50"
            >
              <Globe className="h-4 w-4" />
              <span>{crossVerifying ? 'Cruzando fuentes...' : 'Verificación Cruzada Web'}</span>
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

        {/* Live Internet Search & Pipeline Telemetry Strip */}
        <div className="rounded-2xl border border-slate-800/90 bg-slate-900/75 px-4 py-3 shadow-lg backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
                  telemetry?.searchingInternetNow
                    ? 'border-emerald-500/50 bg-emerald-950/60 text-emerald-300'
                    : 'border-slate-700 bg-slate-950 text-slate-400'
                }`}
              >
                <Radar className={`h-4 w-4 ${telemetry?.searchingInternetNow ? 'animate-spin' : ''}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      telemetry?.searchingInternetNow
                        ? 'border border-emerald-500/40 bg-emerald-950/70 text-emerald-300'
                        : 'border border-slate-700 bg-slate-950 text-slate-300'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        telemetry?.searchingInternetNow ? 'bg-emerald-400 animate-ping' : 'bg-cyan-400'
                      }`}
                    />
                    {telemetry?.searchingInternetNow
                      ? `Buscando en internet (${telemetry.activeOperationsCount} activa)`
                      : 'Motor de ingesta en línea'}
                  </span>
                  {telemetry?.lastActivityAt && (
                    <span className="text-[11px] text-slate-400">
                      Última actividad: {formatDateTime(telemetry.lastActivityAt)}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs font-medium text-slate-200">
                  {telemetry?.currentOperation || 'Sincronizando telemetría del servidor...'}
                </p>
              </div>
            </div>

            {telemetry && (
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <span className="rounded-lg border border-emerald-500/30 bg-emerald-950/40 px-2.5 py-1 font-semibold text-emerald-300">
                  Reales (Prensa+YT+Vecinos):{' '}
                  {telemetry.realNewspaperCount + telemetry.realYoutubeCount + telemetry.citizenCount}
                </span>
                <span className="rounded-lg border border-amber-500/30 bg-amber-950/40 px-2.5 py-1 font-semibold text-amber-300">
                  Base Muestra (SAMPLE): {telemetry.sampleBaselineCount}
                </span>
                <span className="rounded-lg border border-blue-500/30 bg-blue-950/40 px-2.5 py-1 font-semibold text-blue-300">
                  Total Publicados: {telemetry.totalPublished}
                </span>
                <span className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 font-semibold text-slate-300">
                  En Cola: {telemetry.sourceItemsQueued}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800/80 pb-2">
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
              activeTab === 'logs'
                ? 'bg-red-600 text-white shadow-lg'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <Terminal className="h-4 w-4" />
            <span>Logs &amp; Búsqueda Web en Vivo</span>
          </button>
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

        {/* Tab 5: CSV Import & Official PNP/INEI Evaluation */}
        {activeTab === 'datasets' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            {officialStatus && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">
                      Evaluación en Vivo de Fuentes Oficiales (PNP / MININTER / INEI)
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">{officialStatus.executiveSummary}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => adminService.getOfficialSourcesStatus(true).then(setOfficialStatus)}
                      className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-[11px] font-semibold text-slate-300 hover:bg-slate-800 transition"
                    >
                      Reauditar ahora
                    </button>
                    <button
                      disabled={syncingPnp}
                      onClick={handleSyncPnpBaseline}
                      className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-[11px] font-semibold text-slate-200 hover:bg-slate-700 transition disabled:opacity-50"
                    >
                      {syncingPnp ? 'Filtrando PNP...' : 'Sincronizar Lote Base PNP Filtrado'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {officialStatus.sources.map((src) => (
                    <div
                      key={src.id}
                      className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-100">{src.name}</span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                            src.reachable ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'
                          }`}
                        >
                          {src.reachable ? 'Activo' : 'Restringido'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        <strong className="text-slate-300">Cadencia:</strong> {src.updateCadence}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        <strong className="text-slate-300">Último corte:</strong> {src.latestDataDate}
                        {src.estimatedLagDays != null ? ` (~${src.estimatedLagDays} días de rezago)` : ''}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        <strong className="text-slate-300">Rol óptimo:</strong> {src.recommendedRole}
                      </div>
                      <p className="text-[10px] text-slate-500 pt-1">{src.noiseAndFilteringNotes}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-xl space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  Importación de Datasets Oficiales (SIDPOL / MININTER / INEI CSV)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Acepta formato genérico y exportaciones oficiales SIDPOL (`departamento_hecho`, `distrito_hecho`, `modalidad_hecho`, `direccion_hecho`, `lat_hecho`, `long_hecho`), filtrando automáticamente Ley 30364, violencia psicológica y ruido no callejero.
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
                {importResult.message && <div className="text-emerald-100">{importResult.message}</div>}
                <div>Filas procesadas: {importResult.totalRows}</div>
                <div>Delitos callejeros importados con éxito: {importResult.importedCount}</div>
                <div>Filas filtradas o duplicadas: {importResult.skippedCount}</div>
              </div>
            )}
            </div>
          </div>
        )}

        {/* Tab 6: Live Logs, Real vs Sample Breakdown & Web Search Telemetry */}
        {activeTab === 'logs' && (
          <div className="space-y-5">
            {telemetry ? (
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                    <div className="text-[11px] font-semibold uppercase text-slate-400">Publicados Totales</div>
                    <div className="mt-1 text-2xl font-black text-white">{telemetry.totalPublished}</div>
                  </div>
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4">
                    <div className="text-[11px] font-semibold uppercase text-emerald-300">Prensa Real</div>
                    <div className="mt-1 text-2xl font-black text-emerald-200">{telemetry.realNewspaperCount}</div>
                  </div>
                  <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-4">
                    <div className="text-[11px] font-semibold uppercase text-cyan-300">YouTube TV</div>
                    <div className="mt-1 text-2xl font-black text-cyan-200">{telemetry.realYoutubeCount}</div>
                  </div>
                  <div className="rounded-2xl border border-blue-500/30 bg-blue-950/20 p-4">
                    <div className="text-[11px] font-semibold uppercase text-blue-300">Ciudadanos</div>
                    <div className="mt-1 text-2xl font-black text-blue-200">{telemetry.citizenCount}</div>
                  </div>
                  <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4">
                    <div className="text-[11px] font-semibold uppercase text-amber-300">Base Muestra</div>
                    <div className="mt-1 text-2xl font-black text-amber-200">{telemetry.sampleBaselineCount}</div>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                    <div className="text-[11px] font-semibold uppercase text-slate-400">Cola / Descartados</div>
                    <div className="mt-1 text-lg font-black text-slate-100">
                      {telemetry.sourceItemsQueued}{' '}
                      <span className="text-xs font-medium text-slate-400">/ {telemetry.sourceItemsDiscarded} desc.</span>
                    </div>
                  </div>
                </div>

                {/* Recent Published Table */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl backdrop-blur-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-100">
                        Últimos Incidentes Publicados (Orden Real Más Reciente)
                      </h3>
                      <p className="text-xs text-slate-400">
                        Transparencia de origen real vs muestra, precisión geoespacial y modelo IA que extrajo el hecho.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={loadTelemetry}
                      className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-[11px] font-semibold text-slate-300 hover:text-white transition"
                    >
                      Refrescar ahora
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-800 text-[11px] uppercase text-slate-400">
                        <tr>
                          <th className="py-2 pr-3">ID</th>
                          <th className="py-2 pr-3">Origen</th>
                          <th className="py-2 pr-3">Distrito</th>
                          <th className="py-2 pr-3">Titular</th>
                          <th className="py-2 pr-3">Precisión / IA</th>
                          <th className="py-2">Fecha del Hecho</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/70">
                        {telemetry.recentPublished.map((inc) => (
                          <tr key={inc.id} className="hover:bg-slate-800/40">
                            <td className="py-2.5 pr-3 font-mono text-slate-400">#{inc.id}</td>
                            <td className="py-2.5 pr-3">
                              <span
                                className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                                  inc.origin === 'SAMPLE'
                                    ? 'bg-amber-950/70 text-amber-300 border border-amber-500/30'
                                    : 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/30'
                                }`}
                              >
                                {inc.origin}
                              </span>
                            </td>
                            <td className="py-2.5 pr-3 text-slate-300">{inc.districtName}</td>
                            <td className="py-2.5 pr-3 font-medium text-slate-100 max-w-md truncate">{inc.title}</td>
                            <td className="py-2.5 pr-3 text-[11px] text-slate-400">
                              {inc.geoPrecision || '-'} · {inc.llmModel || '-'}
                            </td>
                            <td className="py-2.5 text-[11px] text-slate-400">{formatDateTime(inc.occurredAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Live Monospace Console Logs */}
                <div className="rounded-2xl border border-slate-800 bg-[#04070f] p-5 shadow-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Terminal className="h-4 w-4 text-emerald-400" />
                      <h3 className="text-sm font-bold text-slate-100">
                        Consola de Actividad Web e Ingesta en Tiempo Real
                      </h3>
                    </div>
                    <span className="text-[11px] text-slate-400">Actualización automática cada 3 s</span>
                  </div>

                  <div className="max-h-96 overflow-y-auto rounded-xl border border-slate-800/90 bg-black/70 p-3 font-mono text-[11px] space-y-1.5">
                    {telemetry.recentLogs.length === 0 ? (
                      <div className="py-6 text-center text-slate-500">
                        Sin eventos recientes registrados desde el último arranque del servidor.
                      </div>
                    ) : (
                      telemetry.recentLogs.map((entry, idx) => (
                        <div key={`${entry.timestamp}-${idx}`} className="flex flex-wrap items-start gap-2 leading-relaxed">
                          <span className="shrink-0 text-slate-500">[{formatDateTime(entry.timestamp)}]</span>
                          <span
                            className={`shrink-0 rounded px-1.5 py-0.2 text-[10px] font-bold ${
                              entry.level === 'ERROR'
                                ? 'bg-red-950 text-red-300'
                                : entry.level === 'WARN'
                                  ? 'bg-amber-950 text-amber-300'
                                  : 'bg-blue-950 text-blue-300'
                            }`}
                          >
                            {entry.stage}
                          </span>
                          <span className="shrink-0 text-cyan-300">{entry.source}:</span>
                          <span className="text-slate-200">{entry.message}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex h-40 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/60">
                <Spinner />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

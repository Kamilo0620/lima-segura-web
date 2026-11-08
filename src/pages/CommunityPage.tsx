import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, PlusCircle, Users } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import ReportIncidentModal from '../components/ReportIncidentModal'
import ConfirmIncidentButton from '../components/ConfirmIncidentButton'
import Pagination from '../components/Pagination'
import EmptyState from '../components/EmptyState'
import ErrorMessage from '../components/ErrorMessage'
import Spinner from '../components/Spinner'
import { useFetch } from '../hooks/useFetch'
import { incidentService } from '../services/incidentService'
import { CONFIRMATIONS_TO_PUBLISH, INCIDENT_TYPE_CONFIG, formatTimeAgo } from '../utils/constants'
import type { IncidentStatus } from '../types'

type Tab = 'PENDING_REVIEW' | 'PUBLISHED'

export default function CommunityPage() {
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('PENDING_REVIEW')
  const [page, setPage] = useState(0)

  const fetcher = useCallback(
    (signal: AbortSignal) =>
      incidentService.getIncidents(
        { origin: 'CITIZEN', status: tab as IncidentStatus, page, size: 10 },
        signal,
      ),
    [tab, page],
  )
  const { data, loading, error, refetch } = useFetch(fetcher)

  const changeTab = (next: Tab) => {
    setTab(next)
    setPage(0)
  }

  const tabClass = (active: boolean) =>
    `rounded-xl px-4 py-2 text-xs font-bold transition ${
      active ? 'bg-teal-600 text-white' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
    }`

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-[#050811] text-slate-100">
      <Sidebar />

      <main className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 lg:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-[#0d1424]/90 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-teal-500/40 bg-teal-950/80 text-teal-400">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white">Reportes de la comunidad</h1>
              <p className="text-xs text-slate-400">
                Los vecinos reportan lo que vieron. Cuando {CONFIRMATIONS_TO_PUBLISH} personas distintas lo confirman,
                el reporte se publica en el mapa.
              </p>
            </div>
          </div>

          <button
            onClick={() => setReportModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-teal-600/30 transition hover:bg-teal-500"
          >
            <PlusCircle className="h-4 w-4" />
            Reportar lo que vi
          </button>
        </div>

        <div className="flex gap-2 border-b border-slate-800 pb-2">
          <button onClick={() => changeTab('PENDING_REVIEW')} className={tabClass(tab === 'PENDING_REVIEW')}>
            Por confirmar
          </button>
          <button onClick={() => changeTab('PUBLISHED')} className={tabClass(tab === 'PUBLISHED')}>
            Confirmados
          </button>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Spinner />
          </div>
        ) : error ? (
          <ErrorMessage message={error} onRetry={refetch} />
        ) : !data || data.content.length === 0 ? (
          <EmptyState
            message={
              tab === 'PENDING_REVIEW'
                ? 'No hay reportes esperando confirmación. ¡Sé el primero en reportar!'
                : 'Todavía no hay reportes confirmados por la comunidad.'
            }
          />
        ) : (
          <div className="space-y-3">
            {data.content.map((report) => {
              const type = INCIDENT_TYPE_CONFIG[report.incidentType] ?? INCIDENT_TYPE_CONFIG.OTHER
              return (
                <article
                  key={report.id}
                  className="rounded-2xl border border-slate-800 bg-[#0d1424]/90 p-5 shadow-xl transition hover:border-slate-700"
                >
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${type.bg} ${type.color} ${type.border}`}>
                        {type.label}
                      </span>
                      {report.districtName && (
                        <span className="rounded-md border border-slate-800 bg-[#070b14] px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                          {report.districtName}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">{formatTimeAgo(report.createdAt || report.occurredAt)}</span>
                  </div>

                  <Link to={`/incidents/${report.id}`} className="text-sm font-bold text-white hover:text-teal-300">
                    {report.title}
                  </Link>

                  {report.address && (
                    <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                      <MapPin className="h-3.5 w-3.5" />
                      {report.address}
                    </div>
                  )}

                  {report.summary && <p className="mt-2 text-xs leading-relaxed text-slate-300">{report.summary}</p>}

                  <div className="mt-4 border-t border-slate-800/80 pt-3">
                    <ConfirmIncidentButton
                      incident={report}
                      onConfirmed={(result) => {
                        if (result.status === 'PUBLISHED') refetch()
                      }}
                    />
                  </div>
                </article>
              )
            })}
          </div>
        )}

        {data && <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />}
      </main>

      <ReportIncidentModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        onIncidentReported={refetch}
      />
    </div>
  )
}

import { useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Clock, MapPinned, Plus } from 'lucide-react'
import { reportService } from '../services/reportService'
import { useFetch } from '../hooks/useFetch'
import { useCatalogs } from '../hooks/useCatalogs'
import { useAuth } from '../hooks/useAuth'
import ReportsMap from '../components/ReportsMap'
import { STATUS_COLORS } from '../utils/constants'
import StatCard from '../components/StatCard'
import Spinner from '../components/Spinner'
import ErrorMessage from '../components/ErrorMessage'

const MAP_LIMIT = 200

const LEGEND = [
  { label: 'Pendiente', color: STATUS_COLORS.PENDING },
  { label: 'Validado', color: STATUS_COLORS.VALIDATED },
  { label: 'No verificado', color: STATUS_COLORS.UNVERIFIED },
]

export default function HomePage() {
  const { user } = useAuth()
  const { categoryNames } = useCatalogs()

  const fetchReports = useCallback(
    (signal: AbortSignal) => reportService.getAll({ page: 0, size: MAP_LIMIT }, signal),
    [],
  )
  const { data, loading, error, refetch } = useFetch(fetchReports)
  const reports = useMemo(() => data?.content ?? [], [data])

  const stats = useMemo(
    () => ({
      total: data?.totalElements ?? 0,
      pending: reports.filter((r) => r.status === 'PENDING').length,
      validated: reports.filter((r) => r.status === 'VALIDATED').length,
    }),
    [data, reports],
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hola, {user?.name}</h1>
          <p className="text-slate-600">Así está la seguridad en Lima según los vecinos.</p>
        </div>
        <Link
          to="/reports/new"
          className="flex items-center justify-center gap-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          <Plus className="h-4 w-4" />
          Reportar incidente
        </Link>
      </div>

      {loading && <Spinner />}
      {!loading && error && <ErrorMessage message={error} onRetry={refetch} />}
      {!loading && !error && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Reportes totales" value={stats.total} icon={<MapPinned className="h-6 w-6 text-slate-700" />} />
            <StatCard label="Pendientes" value={stats.pending} icon={<Clock className="h-6 w-6 text-amber-500" />} />
            <StatCard label="Validados" value={stats.validated} icon={<CheckCircle2 className="h-6 w-6 text-red-600" />} />
          </div>

          <ReportsMap reports={reports} categoryNames={categoryNames} />

          <div className="flex flex-wrap gap-4 text-sm text-slate-600">
            {LEGEND.map((item) => (
              <span key={item.label} className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                {item.label}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
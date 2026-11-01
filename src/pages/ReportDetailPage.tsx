import { useCallback, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { CalendarDays, MapPin, Tag, ThumbsUp, Trash2, Users } from 'lucide-react'
import { reportService } from '../services/reportService'
import { getErrorMessage } from '../services/api'
import { useFetch } from '../hooks/useFetch'
import { useCatalogs } from '../hooks/useCatalogs'
import { useAuth } from '../hooks/useAuth'
import Breadcrumbs from '../components/Breadcrumbs'
import StatusBadge from '../components/StatusBadge'
import Spinner from '../components/Spinner'
import ErrorMessage from '../components/ErrorMessage'

const CONFIRMATIONS_TO_VALIDATE = 3

export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>()
  const reportId = Number(id)
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()
  const { zoneNames, categoryNames } = useCatalogs()

  const fetchReport = useCallback(
    (signal: AbortSignal) => reportService.getById(reportId, signal),
    [reportId],
  )
  const { data: report, loading, error, refetch } = useFetch(fetchReport)
  const [actionLoading, setActionLoading] = useState(false)

  async function handleConfirm() {
    setActionLoading(true)
    try {
      await reportService.confirm(reportId)
      toast.success('¡Gracias por confirmar este reporte!')
      refetch()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setActionLoading(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm('¿Seguro que quieres eliminar este reporte?')) return
    setActionLoading(true)
    try {
      await reportService.remove(reportId)
      toast.success('Reporte eliminado')
      navigate('/reports', { replace: true })
    } catch (err) {
      toast.error(getErrorMessage(err))
      setActionLoading(false)
    }
  }

  if (loading) return <Spinner />
  if (error || !report) return <ErrorMessage message={error ?? 'Reporte no encontrado'} onRetry={refetch} />

  const isOwner = user?.id === report.userId
  const canConfirm = !isOwner && report.status === 'PENDING'

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Reportes', to: '/reports' }, { label: `Reporte #${report.id}` }]} />

      <div className="space-y-5 rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <h1 className="text-2xl font-bold text-slate-900">{report.description}</h1>
          <StatusBadge status={report.status} />
        </div>

        <div className="grid gap-3 text-slate-600 sm:grid-cols-2">
          <span className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-red-600" />
            {zoneNames.get(report.zoneId) ?? `Zona ${report.zoneId}`}
          </span>
          <span className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-red-600" />
            {categoryNames.get(report.categoryId) ?? `Categoría ${report.categoryId}`}
          </span>
          <span className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-red-600" />
            {new Date(report.createdAt).toLocaleString('es-PE')}
          </span>
          <span className="flex items-center gap-2">
            <Users className="h-5 w-5 text-red-600" />
            {report.confirmationsCount} de {CONFIRMATIONS_TO_VALIDATE} confirmaciones
          </span>
        </div>

        <p className="text-sm text-slate-500">
          Ubicación: {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}
        </p>

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row">
          {canConfirm && (
            <button
              onClick={handleConfirm}
              disabled={actionLoading}
              className="flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              <ThumbsUp className="h-4 w-4" />
              Yo también lo vi
            </button>
          )}
          {isOwner && report.status === 'PENDING' && (
            <p className="text-sm text-slate-500">Es tu reporte: otros usuarios deben confirmarlo.</p>
          )}
          {(isOwner || isAdmin) && (
            <button
              onClick={handleDelete}
              disabled={actionLoading}
              className="flex items-center justify-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-red-700 hover:bg-red-50 disabled:opacity-60 sm:ml-auto"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
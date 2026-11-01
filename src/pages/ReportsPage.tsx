import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { reportService } from '../services/reportService'
import { useFetch } from '../hooks/useFetch'
import { useDebounce } from '../hooks/useDebounce'
import { useCatalogs } from '../hooks/useCatalogs'
import SearchBar from '../components/SearchBar'
import ReportCard from '../components/ReportCard'
import Pagination from '../components/Pagination'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'
import ErrorMessage from '../components/ErrorMessage'

const PAGE_SIZE = 6

export default function ReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page') ?? '0')
  const search = searchParams.get('search') ?? ''

  const [searchInput, setSearchInput] = useState(search)
  const debouncedSearch = useDebounce(searchInput, 400)
  const { zoneNames, categoryNames } = useCatalogs()

  useEffect(() => {
    if (debouncedSearch === search) return
    const params: Record<string, string> = {}
    if (debouncedSearch) params.search = debouncedSearch
    setSearchParams(params)
  }, [debouncedSearch, search, setSearchParams])

  const fetchReports = useCallback(
    (signal: AbortSignal) => reportService.getAll({ page, size: PAGE_SIZE, search }, signal),
    [page, search],
  )
  const { data, loading, error, refetch } = useFetch(fetchReports)

  function handlePageChange(newPage: number) {
    const params: Record<string, string> = { page: String(newPage) }
    if (search) params.search = search
    setSearchParams(params)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Reportes ciudadanos</h1>
        <div className="flex items-center gap-4">
          {data && <span className="text-sm text-slate-500">{data.totalElements} reportes</span>}
          <Link
            to="/reports/new"
            className="flex items-center gap-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            <Plus className="h-4 w-4" />
            Nuevo reporte
          </Link>
        </div>
      </div>

      <SearchBar value={searchInput} onChange={setSearchInput} placeholder="Buscar por descripción..." />

      {loading && <Spinner />}
      {!loading && error && <ErrorMessage message={error} onRetry={refetch} />}
      {!loading && !error && data?.content.length === 0 && (
        <EmptyState message={search ? `No hay reportes que coincidan con "${search}"` : 'Aún no hay reportes'} />
      )}
      {!loading && !error && data && data.content.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.content.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                zoneName={zoneNames.get(report.zoneId)}
                categoryName={categoryNames.get(report.categoryId)}
              />
            ))}
          </div>
          <Pagination page={data.page} totalPages={data.totalPages} onPageChange={handlePageChange} />
        </>
      )}
    </div>
  )
}
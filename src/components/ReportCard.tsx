import { Link } from 'react-router-dom'
import { MapPin, Tag } from 'lucide-react'
import type { Report } from '../types'
import StatusBadge from './StatusBadge'

interface ReportCardProps {
  report: Report
  zoneName?: string
  categoryName?: string
}

export default function ReportCard({ report, zoneName, categoryName }: ReportCardProps) {
  return (
    <Link
      to={`/reports/${report.id}`}
      className="block rounded-xl bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="font-medium text-slate-900">{report.description}</p>
        <StatusBadge status={report.status} />
      </div>
      <div className="flex flex-wrap gap-4 text-sm text-slate-500">
        <span className="flex items-center gap-1">
          <MapPin className="h-4 w-4" />
          {zoneName ?? `Zona ${report.zoneId}`}
        </span>
        <span className="flex items-center gap-1">
          <Tag className="h-4 w-4" />
          {categoryName ?? `Categoría ${report.categoryId}`}
        </span>
      </div>
    </Link>
  )
}
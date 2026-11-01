import type { ReportStatus } from '../types'

const STATUS_STYLES: Record<ReportStatus, { label: string; className: string }> = {
  PENDING: { label: 'Pendiente', className: 'bg-amber-100 text-amber-800' },
  VALIDATED: { label: 'Validado', className: 'bg-green-100 text-green-800' },
  UNVERIFIED: { label: 'No verificado', className: 'bg-slate-200 text-slate-700' },
}

export default function StatusBadge({ status }: { status: ReportStatus }) {
  const { label, className } = STATUS_STYLES[status]
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}>{label}</span>
}
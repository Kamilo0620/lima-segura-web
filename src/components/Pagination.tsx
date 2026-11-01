import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const buttonClass =
    'flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40'

  return (
    <div className="flex items-center justify-center gap-3">
      <button className={buttonClass} disabled={page === 0} onClick={() => onPageChange(page - 1)}>
        <ChevronLeft className="h-4 w-4" /> Anterior
      </button>
      <span className="text-sm text-slate-600">
        Página {page + 1} de {totalPages}
      </span>
      <button
        className={buttonClass}
        disabled={page >= totalPages - 1}
        onClick={() => onPageChange(page + 1)}
      >
        Siguiente <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}
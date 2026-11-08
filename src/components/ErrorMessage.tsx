import { AlertTriangle } from 'lucide-react'

interface ErrorMessageProps {
  message: string
  onRetry?: () => void
}

export default function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-red-500/30 bg-red-950/30 py-10 text-sm text-red-300">
      <AlertTriangle className="h-10 w-10" />
      <p>{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-500">
          Reintentar
        </button>
      )}
    </div>
  )
}

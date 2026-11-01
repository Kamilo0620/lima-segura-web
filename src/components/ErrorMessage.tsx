import { AlertTriangle } from 'lucide-react'

interface ErrorMessageProps {
  message: string
  onRetry?: () => void
}

export default function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl bg-red-50 py-10 text-red-700">
      <AlertTriangle className="h-10 w-10" />
      <p>{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700">
          Reintentar
        </button>
      )}
    </div>
  )
}
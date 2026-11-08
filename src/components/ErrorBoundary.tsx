import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

/**
 * Atrapa errores de renderizado de cualquier componente hijo
 * y muestra una pantalla amigable en vez de dejar la página en blanco.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Error no controlado en la interfaz:', error, info.componentStack)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#050811] p-6 text-center text-slate-100">
        <AlertTriangle className="h-12 w-12 text-red-500" />
        <h1 className="text-lg font-bold">Algo salió mal</h1>
        <p className="max-w-sm text-sm text-slate-400">
          Ocurrió un error inesperado en la página. Puedes recargar para intentarlo de nuevo.
        </p>
        <button
          onClick={() => window.location.assign('/')}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500"
        >
          Volver al inicio
        </button>
      </div>
    )
  }
}

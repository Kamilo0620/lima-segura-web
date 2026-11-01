import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-6xl font-bold text-red-600">404</h1>
      <p className="text-slate-600">La página que buscas no existe.</p>
      <Link to="/" className="rounded-lg bg-slate-800 px-4 py-2 text-white">
        Volver al inicio
      </Link>
    </div>
  )
}
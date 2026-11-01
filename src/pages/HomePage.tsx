import { useAuth } from '../hooks/useAuth'

export default function HomePage() {
  const { user } = useAuth()
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Hola, {user?.name}</h1>
      <p className="text-slate-600">Aquí irá el mapa de reportes.</p>
    </div>
  )
}
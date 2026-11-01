import { useAuth } from '../hooks/useAuth'

export default function HomePage() {
  const { user, logout } = useAuth()
  return (
    <div className="mx-auto max-w-3xl p-8">
      <h1 className="text-2xl font-bold">Hola, {user?.name}</h1>
      <p className="text-slate-600">Rol: {user?.role}</p>
      <button onClick={logout} className="mt-4 rounded-lg bg-slate-800 px-4 py-2 text-white">
        Cerrar sesión
      </button>
    </div>
  )
}
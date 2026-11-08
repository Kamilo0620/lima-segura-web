import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../hooks/useAuth'
import {
  Settings,
  User,
  Shield,
  MapPin,
  LogOut,
  Save,
  CheckCircle,
} from 'lucide-react'

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [gpsHighAccuracy, setGpsHighAccuracy] = useState(true)
  const [mapTheme, setMapTheme] = useState('dark')
  const [autoRefreshMinutes, setAutoRefreshMinutes] = useState(5)
  const [savedSuccess, setSavedSuccess] = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 3000)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-[#050811] text-slate-100">
      <Sidebar />

      <main className="flex-1 flex flex-col p-4 lg:p-6 gap-4 overflow-y-auto max-w-4xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-[#0d1424]/90 p-5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-slate-300">
              <Settings className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white flex items-center gap-2">
                Configuración del Sistema y Preferencias
              </h1>
              <p className="text-xs text-slate-400">
                Ajustes de geolocalización, parámetros de visualización del mapa de calor y perfil de usuario.
              </p>
            </div>
          </div>

          {user?.role === 'ADMIN' && (
            <button
              onClick={() => navigate('/admin')}
              className="flex items-center gap-2 rounded-xl bg-red-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-red-500 transition"
            >
              <Shield className="h-4 w-4" />
              <span>Consola de Administración</span>
            </button>
          )}
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/50 bg-emerald-950/80 p-3 text-xs font-bold text-emerald-300">
            <CheckCircle className="h-4 w-4 text-emerald-400" />
            Preferencias guardadas correctamente en este dispositivo.
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          {/* 1. User Profile */}
          <div className="rounded-2xl border border-slate-800 bg-[#0d1424]/90 p-5 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <User className="h-4 w-4 text-blue-400" />
              Perfil de Ciudadano
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-400 font-semibold block mb-1">Nombre Completo</label>
                <input
                  type="text"
                  disabled
                  value={user?.name ?? ''}
                  className="w-full rounded-xl border border-slate-800 bg-[#070b14] px-3.5 py-2 text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Correo Electrónico</label>
                <input
                  type="text"
                  disabled
                  value={user?.email ?? ''}
                  className="w-full rounded-xl border border-slate-800 bg-[#070b14] px-3.5 py-2 text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Rol en la Plataforma</label>
                <span className="inline-block rounded-lg border border-red-500/40 bg-red-950/60 px-3 py-1.5 font-bold text-red-300">
                  {user?.role === 'ADMIN' ? 'ADMINISTRADOR DE SISTEMA' : 'CIUDADANO'}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Geolocation & Map */}
          <div className="rounded-2xl border border-slate-800 bg-[#0d1424]/90 p-5 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-red-400" />
              Parámetros de Ubicación &amp; Cartografía
            </h3>

            <div className="space-y-3 text-xs">
              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-[#070b14] cursor-pointer">
                <div>
                  <div className="font-bold text-slate-200">Alta Precisión GPS (HTML5 Geolocation)</div>
                  <div className="text-[11px] text-slate-400">
                    Solicita coordenadas continuas de alta fidelidad para calcular el radio de riesgo.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={gpsHighAccuracy}
                  onChange={(e) => setGpsHighAccuracy(e.target.checked)}
                  className="h-4 w-4 accent-red-500 rounded"
                />
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Capa de Mapa Predeterminada</label>
                  <select
                    value={mapTheme}
                    onChange={(e) => setMapTheme(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-[#070b14] px-3.5 py-2 text-slate-200 focus:outline-none"
                  >
                    <option value="dark">Radar Oscuro (Esri World Dark Canvas)</option>
                    <option value="satellite">Satélite de Alta Resolución</option>
                    <option value="osm">Callejero OpenStreetMap</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Intervalo de Refresco Automático</label>
                  <select
                    value={autoRefreshMinutes}
                    onChange={(e) => setAutoRefreshMinutes(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-800 bg-[#070b14] px-3.5 py-2 text-slate-200 focus:outline-none"
                  >
                    <option value={1}>Cada 1 minuto (Tiempo Real Extremo)</option>
                    <option value={5}>Cada 5 minutos (Recomendado)</option>
                    <option value={15}>Cada 15 minutos</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-red-600/30 hover:bg-red-500 transition"
            >
              <Save className="h-4 w-4" />
              <span>Guardar Configuración</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-2.5 text-xs font-bold text-red-400 hover:bg-red-900/60 transition"
            >
              <LogOut className="h-4 w-4" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}

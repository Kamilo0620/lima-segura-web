import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, Filter, Search, Shield, User, LogOut, Settings } from 'lucide-react'
import LimaSeguraLogo from './LimaSeguraLogo'
import { useAuth } from '../hooks/useAuth'
import { useIncidentStream } from '../hooks/useIncidentStream'
import { incidentService } from '../services/incidentService'
import { INCIDENT_TYPE_CONFIG } from '../utils/constants'

interface LiveNotification {
  id: number
  title: string
  desc: string
  receivedAt: Date
}

interface TopBarProps {
  onSearch?: (query: string) => void
  onToggleFilters?: () => void
}

export default function TopBar({ onSearch, onToggleFilters }: TopBarProps) {
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const [currentTime, setCurrentTime] = useState('')
  const [currentDate, setCurrentDate] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [searchVal, setSearchVal] = useState('')
  // Notificaciones reales: llegan por SSE cuando el backend publica un incidente
  const [notifications, setNotifications] = useState<LiveNotification[]>([])

  const handlePublished = useCallback(async (incidentId: number) => {
    let title = 'Nuevo incidente publicado'
    let desc = `Incidente #${incidentId}`
    try {
      const detail = await incidentService.getIncidentDetail(incidentId)
      title = INCIDENT_TYPE_CONFIG[detail.incidentType]?.label ?? title
      desc = [detail.title, detail.districtName].filter(Boolean).join(' · ')
    } catch {
      // si falla el detalle, mostramos el aviso genérico
    }
    setNotifications((prev) => [{ id: incidentId, title, desc, receivedAt: new Date() }, ...prev].slice(0, 10))
    setUnreadCount((c) => c + 1)
  }, [])
  useIncidentStream(handlePublished)

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      // 14:37:22
      setCurrentTime(
        now.toLocaleTimeString('es-PE', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }),
      )
      // 20 de mayo, 2025
      setCurrentDate(
        now.toLocaleDateString('es-PE', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
      )
    }
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSearch) onSearch(searchVal)
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-[#090d16]/95 px-4 backdrop-blur-md lg:px-6">
      {/* 1. Left Logo */}
      <Link to="/" className="flex items-center gap-3">
        <LimaSeguraLogo className="h-9 w-9" />
      </Link>

      {/* 2. Center Search Bar + Filter Pill */}
      <form
        onSubmit={handleSearchSubmit}
        className="hidden md:flex items-center gap-2 max-w-xl w-full mx-6"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Buscar dirección, distrito o lugar..."
            className="w-full rounded-xl border border-slate-800 bg-[#0d1527]/90 py-2 pl-10 pr-4 text-xs text-slate-100 placeholder-slate-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          />
        </div>
        <button
          type="button"
          onClick={onToggleFilters}
          className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-[#0d1527] px-3.5 py-2 text-xs font-semibold text-slate-300 hover:border-slate-700 hover:text-white transition"
        >
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <span>Filtros</span>
        </button>
      </form>

      {/* 3. Right Status, Clock, Notification & Profile */}
      <div className="flex items-center gap-4 lg:gap-6">
        {/* Live Clock matching mockup */}
        <div className="hidden sm:flex flex-col text-right">
          <div className="text-[10px] text-slate-400">
            Hora actual: <span className="font-mono text-slate-200 font-bold">{currentTime}</span>
          </div>
          <div className="text-[10px] text-slate-400">{currentDate}</div>
        </div>

        {/* Notifications Icon with Badge & Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setNotificationsOpen(!notificationsOpen)
              setProfileOpen(false)
            }}
            className="relative rounded-xl border border-slate-800 bg-[#0d1527] p-2 text-slate-300 hover:text-white transition"
            title="Alertas de Seguridad"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white shadow-sm">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-800 bg-[#090d16] p-3 shadow-2xl z-50 backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                <span className="text-xs font-bold text-white">Alertas de Seguridad</span>
                <button
                  onClick={() => setUnreadCount(0)}
                  className="text-[10px] text-blue-400 hover:underline"
                >
                  Marcar leídas
                </button>
              </div>

              <div className="space-y-2">
                {notifications.length === 0 && (
                  <p className="py-4 text-center text-[11px] text-slate-500">
                    Sin alertas nuevas. Te avisaremos cuando se publique un incidente.
                  </p>
                )}
                {notifications.map((n) => (
                  <Link
                    key={`${n.id}-${n.receivedAt.getTime()}`}
                    to={`/incidents/${n.id}`}
                    onClick={() => setNotificationsOpen(false)}
                    className="block rounded-xl border border-slate-800/80 bg-[#0d1424] p-2.5 transition hover:border-slate-700"
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-red-400">{n.title}</span>
                      <span className="text-[9px] font-normal text-slate-400">
                        {n.receivedAt.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] leading-tight text-slate-300">{n.desc}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill matching mockup */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-[#0d1527] p-1.5 pr-3 hover:border-slate-700 transition"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-700 text-slate-200 font-bold text-xs">
              <User className="h-4 w-4" />
            </div>
            <div className="flex flex-col text-left leading-none">
              <span className="text-xs font-semibold text-slate-200">
                {user?.name ?? 'Invitado'}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                {!isAuthenticated ? 'Sin sesión' : isAdmin ? 'Administrador' : 'Ciudadano'}
              </span>
            </div>
          </button>

          {/* Profile Dropdown */}
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-800 bg-[#090d16] p-1.5 shadow-2xl z-50">
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800"
                >
                  <Shield className="h-3.5 w-3.5 text-red-500" />
                  <span>Consola Admin</span>
                </Link>
              )}
              {isAuthenticated && (
                <Link
                  to="/configuracion"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800"
                >
                  <Settings className="h-3.5 w-3.5 text-slate-400" />
                  <span>Configuración</span>
                </Link>
              )}
              <div className="my-1 border-t border-slate-800" />
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    logout()
                    setProfileOpen(false)
                    navigate('/')
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-950/40"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Cerrar sesión</span>
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-emerald-400 hover:bg-slate-800"
                >
                  <User className="h-3.5 w-3.5" />
                  <span>Iniciar sesión</span>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

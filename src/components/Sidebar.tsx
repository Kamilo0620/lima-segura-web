import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  BarChart3,
  Bell,
  Clock,
  FileText,
  HelpCircle,
  Info,
  LayoutDashboard,
  Map,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Users,
} from 'lucide-react'

export default function Sidebar() {
  const location = useLocation()
  const [lastUpdateTime, setLastUpdateTime] = useState('')
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('lima_segura_sidebar_open')
      return saved != null ? saved === 'true' : false
    } catch {
      return false
    }
  })

  const toggleSidebar = () => {
    setIsOpen((prev) => {
      const next = !prev
      try {
        localStorage.setItem('lima_segura_sidebar_open', String(next))
      } catch {
        // ignore
      }
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'))
      }, 220)
      return next
    })
  }

  useEffect(() => {
    const handleExternalToggle = () => toggleSidebar()
    window.addEventListener('lima-segura:toggle-sidebar', handleExternalToggle)
    return () => window.removeEventListener('lima-segura:toggle-sidebar', handleExternalToggle)
  }, [])

  useEffect(() => {
    const update = () => {
      const now = new Date()
      setLastUpdateTime(
        now.toLocaleTimeString('es-PE', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }),
      )
    }
    update()
    const timer = setInterval(update, 5000)
    return () => clearInterval(timer)
  }, [])

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Mapa de riesgo', path: '/mapa', icon: Map },
    { label: 'Reportes', path: '/reportes', icon: FileText },
    { label: 'Mis alertas', path: '/alertas', icon: Bell },
    { label: 'Histórico', path: '/historico', icon: Clock },
    { label: 'Estadísticas', path: '/estadisticas', icon: BarChart3 },
    { label: 'Comunidad', path: '/comunidad', icon: Users },
    { label: 'Configuración', path: '/configuracion', icon: Settings },
    { label: 'Ayuda', path: '/ayuda', icon: HelpCircle },
  ]

  return (
    <aside
      className={`relative flex flex-col justify-between border-r border-slate-800/80 bg-[#070b14] text-slate-300 shrink-0 min-h-[calc(100vh-64px)] transition-all duration-200 ease-in-out ${
        isOpen ? 'w-64 p-3.5' : 'w-16 p-2 items-center'
      }`}
    >
      {/* Top Toggle Button + Navigation Items */}
      <div className="w-full space-y-2">
        <div className={`flex items-center ${isOpen ? 'justify-between px-1' : 'justify-center'} pb-2 border-b border-slate-800/80`}>
          {isOpen && (
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Menú de Navegación
            </span>
          )}
          <button
            type="button"
            onClick={toggleSidebar}
            title={isOpen ? 'Plegar panel lateral' : 'Desplegar panel lateral'}
            className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-[#0d1527] px-2.5 py-2 text-xs font-semibold text-slate-300 hover:border-blue-500/50 hover:text-white transition"
          >
            {isOpen ? (
              <>
                <PanelLeftClose className="h-4 w-4 text-blue-400" />
                <span className="text-[11px]">Ocultar</span>
              </>
            ) : (
              <PanelLeftOpen className="h-4 w-4 text-blue-400" />
            )}
          </button>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            const Icon = item.icon

            return (
              <Link
                key={item.label}
                to={item.path}
                title={!isOpen ? item.label : undefined}
                className={`group relative flex items-center ${
                  isOpen ? 'gap-3 px-3.5 py-2.5' : 'justify-center p-2.5'
                } rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-bold'
                    : 'text-slate-400 hover:bg-slate-900/70 hover:text-slate-100'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                {isOpen ? (
                  <span className="truncate">{item.label}</span>
                ) : (
                  <span className="pointer-events-none absolute left-14 z-50 hidden whitespace-nowrap rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white shadow-xl group-hover:block">
                    {item.label}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Bottom Risk Legend & Live Status */}
      {isOpen ? (
        <div className="w-full space-y-3 pt-4 border-t border-slate-800/80">
          <div className="rounded-xl border border-slate-800 bg-[#0d1424]/80 p-3 text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-[11px] text-slate-200 uppercase tracking-wider">
                Nivel de riesgo
              </span>
              <Info className="h-3.5 w-3.5 text-slate-400" />
            </div>

            <div className="space-y-2 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-400 shadow-[0_0_8px_#facc15]" />
                <div>
                  <span className="font-bold text-slate-200">BAJO</span>
                  <span className="text-[10px] text-slate-400 ml-1.5 block">
                    Menor intensidad / &gt;24h
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-orange-500 shadow-[0_0_8px_#f97316]" />
                <div>
                  <span className="font-bold text-slate-200">MEDIO</span>
                  <span className="text-[10px] text-slate-400 ml-1.5 block">
                    Riesgo moderado / 6-24h
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
                <div>
                  <span className="font-bold text-slate-200">ALTO</span>
                  <span className="text-[10px] text-slate-400 ml-1.5 block">
                    Riesgo crítico / Reciente
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-slate-300">
              <span>Datos actualizados:</span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                En tiempo real
              </span>
            </div>
            <div>Última actualización: {lastUpdateTime}</div>
            <div className="text-[9px] text-slate-400 pt-1">
              &copy; 2026 LIMA SEGURA. Todos los derechos reservados.
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 pt-3 border-t border-slate-800/80" title={`En tiempo real · Última actualización: ${lastUpdateTime}`}>
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" title="Riesgo Bajo" />
          <span className="h-2.5 w-2.5 rounded-full bg-orange-500" title="Riesgo Medio" />
          <span className="h-2.5 w-2.5 rounded-full bg-red-500" title="Riesgo Alto" />
          <span className="mt-2 h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      )}
    </aside>
  )
}

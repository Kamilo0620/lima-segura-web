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
  Settings,
  Users,
} from 'lucide-react'

export default function Sidebar() {
  const location = useLocation()
  const [lastUpdateTime, setLastUpdateTime] = useState('')

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
    <aside className="hidden lg:flex w-64 flex-col justify-between border-r border-slate-800/80 bg-[#070b14] p-4 text-slate-300 shrink-0 min-h-[calc(100vh-64px)]">
      {/* 1. Main Navigation Items */}
      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          const Icon = item.icon

          return (
            <Link
              key={item.label}
              to={item.path}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-bold'
                  : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-100'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* 2. Bottom Risk Legend & Live Status matching mockup */}
      <div className="space-y-4 pt-4 border-t border-slate-800/80">
        {/* Risk Level Explanation Card */}
        <div className="rounded-xl border border-slate-800 bg-[#0d1424]/80 p-3 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-[11px] text-slate-200 uppercase tracking-wider">
              Nivel de riesgo
            </span>
            <Info className="h-3.5 w-3.5 text-slate-400" />
          </div>

          <div className="space-y-2 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
              <div>
                <span className="font-bold text-slate-200">BAJO</span>
                <span className="text-[10px] text-slate-400 ml-1.5 block">
                  Riesgo bajo de incidentes
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b]" />
              <div>
                <span className="font-bold text-slate-200">MEDIO</span>
                <span className="text-[10px] text-slate-400 ml-1.5 block">
                  Riesgo moderado
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
              <div>
                <span className="font-bold text-slate-200">ALTO</span>
                <span className="text-[10px] text-slate-400 ml-1.5 block">
                  Riesgo alto de incidentes
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time sync indicator matching mockup */}
        <div className="text-[10px] text-slate-400 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-slate-300">
            <span>Datos actualizados:</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              En tiempo real
            </span>
          </div>
          <div>Última actualización: {lastUpdateTime || '14:37:10'}</div>
          <div className="text-[9px] text-slate-400 pt-1">
            &copy; 2025 LIMA SEGURA. Todos los derechos reservados.
          </div>
        </div>
      </div>
    </aside>
  )
}

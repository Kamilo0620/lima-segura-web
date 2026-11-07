import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Flame,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  ShieldAlert,
  User,
  X,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

interface NavItem {
  to: string
  label: string
  icon: any
  adminOnly?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Mapa en Vivo', icon: Flame },
  { to: '/incidents', label: 'Incidentes', icon: ShieldAlert },
  { to: '/admin', label: 'Consola Admin', icon: LayoutDashboard, adminOnly: true },
]

function linkClass({ isActive }: { isActive: boolean }) {
  return `flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
    isActive
      ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
  }`
}

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const items = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin)

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <nav className="sticky top-0 z-[1500] border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand */}
        <NavLink to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600/20 text-red-500 border border-red-500/30 group-hover:scale-105 transition">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black tracking-wider text-slate-100">
                LIMA SEGURA
              </span>
              <span className="rounded bg-red-950 px-1.5 py-0.2 text-[9px] font-black text-red-400 border border-red-800/50">
                AI RADAR
              </span>
            </div>
            <div className="text-[10px] text-slate-400 -mt-0.5">
              Inteligencia Delictiva en Tiempo Real
            </div>
          </div>
        </NavLink>

        {/* Desktop Nav Items */}
        <div className="hidden items-center gap-1 md:flex">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <NavLink key={item.to} to={item.to} end={item.to === '/'} className={linkClass}>
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </div>

        {/* Right Section: Stream status + Auth */}
        <div className="hidden items-center gap-3 md:flex">
          {/* Live stream badge */}
          <div className="flex items-center gap-1.5 rounded-full bg-slate-900 border border-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-300">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Lima & Callao</span>
          </div>

          {user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-xl bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs text-slate-200">
                <User className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-semibold text-slate-200">{user.name}</span>
                <span className="rounded bg-slate-800 px-1.5 py-0.2 text-[10px] font-bold text-red-400">
                  {user.role}
                </span>
              </div>

              <button
                onClick={handleLogout}
                title="Cerrar sesión"
                className="flex items-center gap-1 rounded-xl bg-slate-900 border border-slate-800 p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <NavLink
              to="/login"
              className="flex items-center gap-1.5 rounded-xl bg-red-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg hover:bg-red-500 transition"
            >
              <LogIn className="h-4 w-4" />
              <span>Ingresar</span>
            </NavLink>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="rounded-xl border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:bg-slate-800 hover:text-white md:hidden"
          aria-label="Abrir menú"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {open && (
        <div className="space-y-1.5 border-t border-slate-800/80 bg-slate-950 p-4 md:hidden">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={linkClass}
                onClick={() => setOpen(false)}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            )
          })}

          <div className="border-t border-slate-800/80 pt-3 mt-3 flex items-center justify-between">
            {user ? (
              <>
                <span className="text-xs text-slate-300">
                  {user.name} ({user.role})
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs text-slate-300"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Salir
                </button>
              </>
            ) : (
              <NavLink
                to="/login"
                onClick={() => setOpen(false)}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-red-600 py-2 text-xs font-bold text-white"
              >
                <LogIn className="h-4 w-4" />
                <span>Iniciar Sesión</span>
              </NavLink>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

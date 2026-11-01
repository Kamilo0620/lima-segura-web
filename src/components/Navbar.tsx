import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { LogOut, Menu, ShieldAlert, X } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

interface NavItem {
  to: string
  label: string
  adminOnly?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Mapa' },
  { to: '/reports', label: 'Reportes' },
  { to: '/incidents', label: 'Incidentes' },
  { to: '/admin', label: 'Admin', adminOnly: true },
]

function linkClass({ isActive }: { isActive: boolean }) {
  return `block rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-red-600 text-white' : 'text-slate-200 hover:bg-slate-700'
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
    <nav className="bg-slate-900 text-white shadow">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <NavLink to="/" className="flex items-center gap-2 text-lg font-bold">
          <ShieldAlert className="h-6 w-6 text-red-500" />
          LIMA SEGURA
        </NavLink>

        <div className="hidden items-center gap-1 md:flex">
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className={linkClass}>
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <span className="text-sm text-slate-300">{user?.name}</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-slate-700"
          >
            <LogOut className="h-4 w-4" />
            Salir
          </button>
        </div>

        <button
          onClick={() => setOpen((prev) => !prev)}
          className="rounded-lg p-2 hover:bg-slate-700 md:hidden"
          aria-label="Abrir menú"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="space-y-1 border-t border-slate-700 px-4 py-3 md:hidden">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={linkClass}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
          <div className="flex items-center justify-between border-t border-slate-700 pt-3">
            <span className="text-sm text-slate-300">{user?.name}</span>
            <button onClick={handleLogout} className="flex items-center gap-1 text-sm text-slate-200">
              <LogOut className="h-4 w-4" />
              Salir
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
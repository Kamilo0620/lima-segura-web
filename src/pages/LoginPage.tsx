import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../hooks/useAuth'
import { getErrorMessage } from '../services/api'
import { KeyRound, LogIn, Mail, ShieldAlert, Sparkles } from 'lucide-react'
import Spinner from '../components/Spinner'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!email || !password) {
      toast.error('Por favor completa todos los campos')
      return
    }

    setLoading(true)
    try {
      await login({ email, password })
      toast.success('¡Sesión iniciada con éxito!')
      navigate(from, { replace: true })
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  function handleFillAdmin() {
    setEmail('admin@limasegura.pe')
    setPassword('password123')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-slate-100">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-2xl">
        {/* Glow decorative effect */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-red-600/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-blue-600/15 blur-3xl" />

        {/* Brand Icon & Heading */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600/20 text-red-500 border border-red-500/30 shadow-lg shadow-red-500/10">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            LIMA SEGURA
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Acceso a la Plataforma de Monitoreo & Control Delictivo
          </p>
        </div>

        {/* Quick Demo Credentials Pill */}
        <button
          type="button"
          onClick={handleFillAdmin}
          className="mb-5 flex w-full items-center justify-between rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-300 transition hover:bg-red-900/50"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-red-400 shrink-0" />
            <div className="text-left">
              <span className="font-bold">Usar Credenciales de Administrador:</span>
              <div className="text-[11px] text-red-400/80">admin@limasegura.pe / password123</div>
            </div>
          </div>
          <span className="rounded bg-red-800/60 px-2 py-0.5 text-[10px] font-bold text-white">
            Autocompletar
          </span>
        </button>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-300">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@limasegura.pe"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-3 text-xs text-white placeholder-slate-500 focus:border-red-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-300">
              Contraseña
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-3 text-xs text-white placeholder-slate-500 focus:border-red-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-xs font-bold text-white shadow-xl shadow-red-600/20 hover:bg-red-500 transition disabled:opacity-50 mt-2"
          >
            {loading ? <Spinner /> : <LogIn className="h-4 w-4" />}
            {loading ? 'Validando Credenciales...' : 'Iniciar Sesión'}
          </button>
        </form>

        {/* Footer Navigation */}
        <div className="mt-6 text-center text-xs text-slate-400">
          ¿No tienes una cuenta aún?{' '}
          <Link to="/register" className="font-semibold text-red-400 hover:text-red-300">
            Regístrate aquí
          </Link>
        </div>
      </div>
    </div>
  )
}

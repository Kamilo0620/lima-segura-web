import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../hooks/useAuth'
import { getErrorMessage } from '../services/api'
import { KeyRound, Mail, ShieldAlert, User, UserPlus } from 'lucide-react'
import Spinner from '../components/Spinner'

interface RegisterForm {
  name: string
  email: string
  password: string
  confirmPassword: string
}

const EMPTY_FORM: RegisterForm = { name: '', email: '', password: '', confirmPassword: '' }

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState<RegisterForm>(EMPTY_FORM)
  const [loading, setLoading] = useState(false)

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.name.trim() || !form.email || !form.password) {
      toast.error('Por favor completa todos los campos requeridos')
      return
    }
    if (form.password.length < 6) {
      toast.error('La contraseña debe tener mínimo 6 caracteres')
      return
    }
    if (form.confirmPassword !== form.password) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    setLoading(true)
    try {
      await register({ name: form.name.trim(), email: form.email, password: form.password })
      toast.success('¡Cuenta creada exitosamente!')
      navigate('/', { replace: true })
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-slate-100">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-2xl">
        {/* Glow decorative effect */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-red-600/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-blue-600/15 blur-3xl" />

        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600/20 text-red-500 border border-red-500/30 shadow-lg shadow-red-500/10">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            LIMA SEGURA
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Crea tu cuenta ciudadana para consultar el radar de seguridad
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-300">
              Nombre Completo
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="text"
                name="name"
                required
                value={form.name}
                onChange={handleChange}
                placeholder="Juan Pérez"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-3 text-xs text-white placeholder-slate-500 focus:border-red-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-300">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="juan@ejemplo.com"
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
                name="password"
                required
                value={form.password}
                onChange={handleChange}
                placeholder="Mínimo 6 caracteres"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-3 text-xs text-white placeholder-slate-500 focus:border-red-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-300">
              Confirmar Contraseña
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="password"
                name="confirmPassword"
                required
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Repite tu contraseña"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-3 text-xs text-white placeholder-slate-500 focus:border-red-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-xs font-bold text-white shadow-xl shadow-red-600/20 hover:bg-red-500 transition disabled:opacity-50 mt-2"
          >
            {loading ? <Spinner /> : <UserPlus className="h-4 w-4" />}
            {loading ? 'Creando Cuenta...' : 'Registrar Cuenta'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-semibold text-red-400 hover:text-red-300">
            Inicia sesión aquí
          </Link>
        </div>
      </div>
    </div>
  )
}

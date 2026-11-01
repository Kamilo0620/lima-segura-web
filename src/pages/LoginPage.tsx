import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../hooks/useAuth'
import { getErrorMessage } from '../services/api'
import FormInput from '../components/FormInput'
import Button from '../components/Button'

interface LoginErrors {
  email?: string
  password?: string
}

function validate(email: string, password: string): LoginErrors {
  const errors: LoginErrors = {}
  if (!email) errors.email = 'El correo es obligatorio'
  else if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = 'Correo no válido'
  if (!password) errors.password = 'La contraseña es obligatoria'
  return errors
}

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<LoginErrors>({})
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validationErrors = validate(email, password)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setLoading(true)
    try {
      await login({ email, password })
      toast.success('¡Bienvenido!')
      navigate(from, { replace: true })
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <form
        onSubmit={handleSubmit}
        noValidate
        className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-8 shadow-md"
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">LIMA SEGURA</h1>
          <p className="text-sm text-slate-500">Inicia sesión para continuar</p>
        </div>

        <FormInput
          label="Correo"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          autoComplete="email"
        />
        <FormInput
          label="Contraseña"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          autoComplete="current-password"
        />

        <Button type="submit" loading={loading}>
          Ingresar
        </Button>

        <p className="text-center text-sm text-slate-600">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="font-semibold text-red-600 hover:underline">
            Regístrate
          </Link>
        </p>
      </form>
    </div>
  )
}
import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../hooks/useAuth'
import { getErrorMessage } from '../services/api'
import FormInput from '../components/FormInput'
import Button from '../components/Button'

interface RegisterForm {
  name: string
  email: string
  password: string
  confirmPassword: string
}

type RegisterErrors = Partial<Record<keyof RegisterForm, string>>

const EMPTY_FORM: RegisterForm = { name: '', email: '', password: '', confirmPassword: '' }

function validate(form: RegisterForm): RegisterErrors {
  const errors: RegisterErrors = {}
  if (!form.name.trim()) errors.name = 'El nombre es obligatorio'
  if (!form.email) errors.email = 'El correo es obligatorio'
  else if (!/^\S+@\S+\.\S+$/.test(form.email)) errors.email = 'Correo no válido'
  if (form.password.length < 6) errors.password = 'Mínimo 6 caracteres'
  if (form.confirmPassword !== form.password) errors.confirmPassword = 'Las contraseñas no coinciden'
  return errors
}

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState<RegisterForm>(EMPTY_FORM)
  const [errors, setErrors] = useState<RegisterErrors>({})
  const [loading, setLoading] = useState(false)

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target
    const nextForm = { ...form, [name]: value }
    setForm(nextForm)
    if (errors[name as keyof RegisterForm]) {
      setErrors(validate(nextForm))
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validationErrors = validate(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setLoading(true)
    try {
      await register({ name: form.name.trim(), email: form.email, password: form.password })
      toast.success('¡Cuenta creada!')
      navigate('/', { replace: true })
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
          <h1 className="text-2xl font-bold text-slate-900">Crear cuenta</h1>
          <p className="text-sm text-slate-500">Únete a LIMA SEGURA</p>
        </div>

        <FormInput label="Nombre" name="name" value={form.name} onChange={handleChange} error={errors.name} />
        <FormInput
          label="Correo"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
          autoComplete="email"
        />
        <FormInput
          label="Contraseña"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          autoComplete="new-password"
        />
        <FormInput
          label="Confirmar contraseña"
          name="confirmPassword"
          type="password"
          value={form.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          autoComplete="new-password"
        />

        <Button type="submit" loading={loading}>
          Registrarme
        </Button>

        <p className="text-center text-sm text-slate-600">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-semibold text-red-600 hover:underline">
            Inicia sesión
          </Link>
        </p>
      </form>
    </div>
  )
}
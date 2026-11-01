import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
}

export default function Button({ loading = false, disabled, children, ...props }: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className="w-full rounded-lg bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
      {...props}
    >
      {loading ? 'Cargando...' : children}
    </button>
  )
}
import type { SelectHTMLAttributes } from 'react'

interface Option {
  value: number
  label: string
}

interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  options: Option[]
  placeholder?: string
  error?: string
}

export default function FormSelect({ label, options, placeholder = 'Selecciona...', error, id, ...props }: FormSelectProps) {
  const selectId = id ?? props.name
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={selectId} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <select
        id={selectId}
        className={`rounded-lg border bg-white px-3 py-2 outline-none focus:ring-2 ${
          error ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:ring-slate-200'
        }`}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}
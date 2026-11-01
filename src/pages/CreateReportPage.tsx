import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { LocateFixed } from 'lucide-react'
import { reportService } from '../services/reportService'
import { getErrorMessage } from '../services/api'
import { useCatalogs } from '../hooks/useCatalogs'
import Breadcrumbs from '../components/Breadcrumbs'
import FormSelect from '../components/FormSelect'
import Button from '../components/Button'
import LocationPicker from '../components/LocationPicker'
import type { LatLng } from '../components/LocationPicker'

const MAX_DESCRIPTION = 500

interface ReportForm {
  zoneId: string
  categoryId: string
  description: string
}

type ReportErrors = Partial<Record<keyof ReportForm | 'location', string>>

function validate(form: ReportForm, location: LatLng | null): ReportErrors {
  const errors: ReportErrors = {}
  if (!form.zoneId) errors.zoneId = 'Elige una zona'
  if (!form.categoryId) errors.categoryId = 'Elige una categoría'
  if (!form.description.trim()) errors.description = 'Describe qué pasó'
  else if (form.description.length > MAX_DESCRIPTION) errors.description = `Máximo ${MAX_DESCRIPTION} caracteres`
  if (!location) errors.location = 'Marca el lugar en el mapa'
  return errors
}

export default function CreateReportPage() {
  const navigate = useNavigate()
  const { zones, categories } = useCatalogs()

  const [form, setForm] = useState<ReportForm>({ zoneId: '', categoryId: '', description: '' })
  const [location, setLocation] = useState<LatLng | null>(null)
  const [mapCenter, setMapCenter] = useState<LatLng | null>(null)
  const [errors, setErrors] = useState<ReportErrors>({})
  const [loading, setLoading] = useState(false)
  const [locating, setLocating] = useState(false)

  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = event.target
    const nextForm = { ...form, [name]: value }
    setForm(nextForm)

    if (name === 'zoneId') {
      const zone = zones.find((z) => z.id === Number(value))
      if (zone) setMapCenter({ lat: zone.latitude, lng: zone.longitude })
    }
    if (errors[name as keyof ReportForm]) setErrors(validate(nextForm, location))
  }

  function handleLocationChange(position: LatLng) {
    setLocation(position)
    if (errors.location) setErrors(validate(form, position))
  }

  function handleLocateMe() {
    if (!navigator.geolocation) {
      toast.error('Tu navegador no permite obtener la ubicación')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const position = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        handleLocationChange(position)
        setMapCenter(position)
        setLocating(false)
      },
      () => {
        toast.error('No pudimos obtener tu ubicación. Márcala en el mapa.')
        setLocating(false)
      },
    )
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validationErrors = validate(form, location)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0 || !location) return

    setLoading(true)
    try {
      const created = await reportService.create({
        zoneId: Number(form.zoneId),
        categoryId: Number(form.categoryId),
        description: form.description.trim(),
        latitude: location.lat,
        longitude: location.lng,
      })
      toast.success('Reporte enviado. ¡Gracias por ayudar!')
      navigate(`/reports/${created.id}`)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Reportes', to: '/reports' }, { label: 'Nuevo reporte' }]} />

      <form onSubmit={handleSubmit} noValidate className="space-y-5 rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Reportar un incidente</h1>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormSelect
            label="Zona"
            name="zoneId"
            value={form.zoneId}
            onChange={handleChange}
            options={zones.map((z) => ({ value: z.id, label: `${z.name} (${z.district})` }))}
            error={errors.zoneId}
          />
          <FormSelect
            label="Categoría"
            name="categoryId"
            value={form.categoryId}
            onChange={handleChange}
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            error={errors.categoryId}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="description" className="text-sm font-medium text-slate-700">
            ¿Qué pasó?
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            value={form.description}
            onChange={handleChange}
            placeholder="Ej: Me arrebataron el celular cerca al paradero"
            className={`rounded-lg border px-3 py-2 outline-none focus:ring-2 ${
              errors.description ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:ring-slate-200'
            }`}
          />
          <div className="flex justify-between text-xs">
            <span className="text-red-600">{errors.description}</span>
            <span className={form.description.length > MAX_DESCRIPTION ? 'text-red-600' : 'text-slate-400'}>
              {form.description.length}/{MAX_DESCRIPTION}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Ubicación (haz clic en el mapa)</span>
            <button
              type="button"
              onClick={handleLocateMe}
              disabled={locating}
              className="flex items-center gap-1 text-sm font-medium text-red-600 hover:underline disabled:opacity-60"
            >
              <LocateFixed className="h-4 w-4" />
              {locating ? 'Buscando...' : 'Usar mi ubicación'}
            </button>
          </div>
          <LocationPicker value={location} onChange={handleLocationChange} center={mapCenter} />
          {location && (
            <p className="text-xs text-slate-500">
              {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
            </p>
          )}
          {errors.location && <span className="text-xs text-red-600">{errors.location}</span>}
        </div>

        <Button type="submit" loading={loading}>
          Enviar reporte
        </Button>
      </form>
    </div>
  )
}
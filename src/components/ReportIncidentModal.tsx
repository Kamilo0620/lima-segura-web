import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertOctagon, LocateFixed, Send, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { incidentService } from '../services/incidentService'
import { getErrorMessage } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { CONFIRMATIONS_TO_PUBLISH, LIMA_DISTRICTS } from '../utils/constants'
import LocationPicker from './LocationPicker'
import type { LatLng } from './LocationPicker'
import type { IncidentType } from '../types'

interface ReportIncidentModalProps {
  isOpen: boolean
  onClose: () => void
  onIncidentReported?: () => void
}

const REPORT_TYPES: { value: IncidentType; label: string }[] = [
  { value: 'ROBBERY', label: 'Robo a transeúnte' },
  { value: 'ARMED_ROBBERY', label: 'Asalto a mano armada' },
  { value: 'VEHICLE_THEFT', label: 'Robo de vehículo / autopartes' },
  { value: 'THEFT', label: 'Hurto simple' },
  { value: 'EXTORTION', label: 'Extorsión / Cobro de cupos' },
  { value: 'HOMICIDE', label: 'Homicidio / Sicariato' },
  { value: 'KIDNAPPING', label: 'Secuestro al paso' },
  { value: 'OTHER', label: 'Otro incidente' },
]

const EMPTY_FORM = {
  incidentType: 'ROBBERY' as IncidentType,
  title: '',
  summary: '',
  address: '',
  districtName: '',
}

export default function ReportIncidentModal({ isOpen, onClose, onIncidentReported }: ReportIncidentModalProps) {
  const { isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(false)
  const [locating, setLocating] = useState(false)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [location, setLocation] = useState<LatLng | null>(null)

  if (!isOpen) return null

  const close = () => {
    setFormData(EMPTY_FORM)
    setLocation(null)
    onClose()
  }

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Tu navegador no permite obtener la ubicación')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocating(false)
      },
      () => {
        toast.error('No se pudo obtener tu ubicación. Marca el punto en el mapa.')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      toast.error('Escribe un título breve')
      return
    }
    if (!location) {
      toast.error('Marca en el mapa dónde ocurrió el incidente')
      return
    }

    try {
      setLoading(true)
      await incidentService.reportIncident({
        ...formData,
        title: formData.title.trim(),
        districtName: formData.districtName || undefined,
        lat: location.lat,
        lng: location.lng,
      })
      toast.success(
        `Reporte enviado. Se publicará en el mapa cuando ${CONFIRMATIONS_TO_PUBLISH} vecinos lo confirmen.`,
        { duration: 5000 },
      )
      onIncidentReported?.()
      close()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full rounded-xl border border-slate-800 bg-[#0d1527] px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-red-500 focus:outline-none'

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative max-h-[95vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-800 bg-[#0a101d] p-6 text-slate-100 shadow-2xl">
        <button
          onClick={close}
          aria-label="Cerrar"
          className="absolute right-4 top-4 rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-500/30 bg-red-600/20 text-red-500">
            <AlertOctagon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Reportar Incidente Ciudadano</h3>
            <p className="text-xs text-slate-400">
              Tu reporte aparecerá en el mapa cuando {CONFIRMATIONS_TO_PUBLISH} vecinos confirmen que también lo vieron.
            </p>
          </div>
        </div>

        {!isAuthenticated ? (
          <div className="mt-5 space-y-4 text-center">
            <p className="text-sm text-slate-300">Necesitas iniciar sesión para enviar un reporte.</p>
            <div className="flex justify-center gap-2">
              <Link
                to="/login"
                onClick={close}
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500"
              >
                Iniciar sesión
              </Link>
              <Link
                to="/register"
                onClick={close}
                className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800"
              >
                Crear cuenta
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-300">Tipo de delito</label>
              <select
                value={formData.incidentType}
                onChange={(e) => setFormData({ ...formData, incidentType: e.target.value as IncidentType })}
                className={inputClass}
              >
                {REPORT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-300">Título del incidente</label>
              <input
                type="text"
                required
                maxLength={150}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ej. Arrebato de celular por dos sujetos en moto"
                className={inputClass}
              />
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">¿Dónde ocurrió? (haz clic en el mapa)</label>
                <button
                  type="button"
                  onClick={useMyLocation}
                  disabled={locating}
                  className="flex items-center gap-1 text-[11px] font-bold text-blue-400 hover:text-blue-300 disabled:opacity-50"
                >
                  <LocateFixed className="h-3.5 w-3.5" />
                  {locating ? 'Ubicando...' : 'Usar mi ubicación'}
                </button>
              </div>
              <LocationPicker value={location} onChange={setLocation} />
              {location && (
                <p className="mt-1 text-[11px] text-slate-500">
                  {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-300">Distrito</label>
                <select
                  value={formData.districtName}
                  onChange={(e) => setFormData({ ...formData, districtName: e.target.value })}
                  className={inputClass}
                >
                  <option value="">Selecciona...</option>
                  {LIMA_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-300">Referencia / calle</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Ej. Av. Arica con Jr. Napo"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-300">Descripción (opcional)</label>
              <textarea
                rows={3}
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                placeholder="Qué pasó, vestimenta de los sospechosos, placas..."
                className={`${inputClass} resize-none`}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-lg transition hover:bg-blue-500 disabled:opacity-50"
            >
              {loading ? 'Enviando reporte...' : (
                <>
                  <Send className="h-4 w-4" /> Enviar reporte
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

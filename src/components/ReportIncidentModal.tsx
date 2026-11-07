import { useState } from 'react'
import { AlertOctagon, Send, X } from 'lucide-react'
import { incidentService } from '../services/incidentService'
import { LIMA_DISTRICTS } from '../utils/constants'
import toast from 'react-hot-toast'

interface ReportIncidentModalProps {
  isOpen: boolean
  onClose: () => void
  onIncidentReported?: () => void
}

export default function ReportIncidentModal({
  isOpen,
  onClose,
  onIncidentReported,
}: ReportIncidentModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    incidentType: 'ROBBERY',
    title: '',
    summary: '',
    address: 'Av. Alfonso Ugarte 1200',
    districtName: 'Breña',
    lat: -12.056,
    lng: -77.042,
  })

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      toast.error('Por favor ingresa un título o descripción breve')
      return
    }

    try {
      setLoading(true)
      await incidentService.reportIncident(formData)
      toast.success('¡Alerta de incidente registrada en tiempo real!')
      if (onIncidentReported) onIncidentReported()
      onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al enviar reporte ciudadano')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-[#0a101d] p-6 text-slate-100 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600/20 text-red-500 border border-red-500/30">
            <AlertOctagon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Reportar Incidente Ciudadano</h3>
            <p className="text-xs text-slate-400">
              Tu reporte alimentará el mapa de riesgo en tiempo real tras la validación comunitaria.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {/* Crime Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Tipo de Delito
            </label>
            <select
              value={formData.incidentType}
              onChange={(e) => setFormData({ ...formData, incidentType: e.target.value })}
              className="w-full rounded-xl border border-slate-800 bg-[#0d1527] px-3 py-2 text-xs text-slate-200 focus:border-red-500 focus:outline-none"
            >
              <option value="ROBBERY">Robo a transeúnte</option>
              <option value="ARMED_ROBBERY">Asalto a mano armada</option>
              <option value="VEHICLE_THEFT">Robo de vehículo / autopartes</option>
              <option value="THEFT">Hurto simple</option>
              <option value="EXTORTION">Extorsión / Cobro de cupos</option>
              <option value="HOMICIDE">Homicidio / Sicariato</option>
              <option value="KIDNAPPING">Secuestro al paso</option>
              <option value="OTHER">Otro incidente</option>
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Título del Incidente
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ej. Arrebato de celular por dos sujetos en moto"
              className="w-full rounded-xl border border-slate-800 bg-[#0d1527] px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-red-500 focus:outline-none"
            />
          </div>

          {/* District & Address Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Distrito
              </label>
              <select
                value={formData.districtName}
                onChange={(e) => setFormData({ ...formData, districtName: e.target.value })}
                className="w-full rounded-xl border border-slate-800 bg-[#0d1527] px-3 py-2 text-xs text-slate-200 focus:border-red-500 focus:outline-none"
              >
                {LIMA_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Dirección / Calle / Cruce
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Ej. Av. Alfonso Ugarte con Jr. Zorritos"
                className="w-full rounded-xl border border-slate-800 bg-[#0d1527] px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-red-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Details */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Descripción detallada
            </label>
            <textarea
              rows={3}
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              placeholder="Describe lo sucedido, armas observadas, placas o vestimenta de los sospechosos..."
              className="w-full rounded-xl border border-slate-800 bg-[#0d1527] px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-red-500 focus:outline-none resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-lg transition hover:bg-blue-500 disabled:opacity-50"
            >
              {loading ? (
                <span>Publicando reporte...</span>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Enviar Alerta a la Comunidad</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

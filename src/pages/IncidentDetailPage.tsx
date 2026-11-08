import { useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Calendar, ExternalLink, MapPin, Newspaper } from 'lucide-react'
import { CircleMarker, MapContainer } from 'react-leaflet'
import DarkTiles from '../components/DarkTiles'
import 'leaflet/dist/leaflet.css'
import Sidebar from '../components/Sidebar'
import Breadcrumbs from '../components/Breadcrumbs'
import Spinner from '../components/Spinner'
import ErrorMessage from '../components/ErrorMessage'
import ConfirmIncidentButton from '../components/ConfirmIncidentButton'
import { useFetch } from '../hooks/useFetch'
import { incidentService } from '../services/incidentService'
import {
  AI_ORIGINS,
  INCIDENT_TYPE_CONFIG,
  ORIGIN_CONFIG,
  STATUS_CONFIG,
  formatDateTime,
  formatTimeAgo,
} from '../utils/constants'

export default function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const incidentId = Number(id)

  const fetcher = useCallback(
    (signal: AbortSignal) => incidentService.getIncidentDetail(incidentId, signal),
    [incidentId],
  )
  const { data: incident, loading, error, refetch } = useFetch(fetcher)

  const content = () => {
    if (!Number.isInteger(incidentId) || incidentId <= 0) {
      return <ErrorMessage message="El identificador del incidente no es válido." />
    }
    if (loading) {
      return (
        <div className="flex h-64 items-center justify-center">
          <Spinner />
        </div>
      )
    }
    if (error || !incident) {
      return <ErrorMessage message={error ?? 'No se encontró el incidente.'} onRetry={refetch} />
    }

    const type = INCIDENT_TYPE_CONFIG[incident.incidentType] ?? INCIDENT_TYPE_CONFIG.OTHER
    const origin = ORIGIN_CONFIG[incident.origin]
    const status = STATUS_CONFIG[incident.status]
    const isAi = AI_ORIGINS.includes(incident.origin) && incident.confidence != null

    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="space-y-4 rounded-2xl border border-slate-800 bg-[#0d1424]/90 p-5 lg:col-span-2">
          <div className="flex flex-wrap gap-2">
            <span className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${type.bg} ${type.color} ${type.border}`}>
              {type.label}
            </span>
            {origin && <span className={`rounded-lg px-2.5 py-1 text-xs ${origin.badge}`}>{origin.label}</span>}
            {status && <span className={`rounded-lg px-2.5 py-1 text-xs ${status.badge}`}>{status.label}</span>}
          </div>

          <h1 className="text-xl font-black text-white">{incident.title}</h1>

          {incident.origin === 'SAMPLE' && (
            <p className="rounded-xl border border-slate-700 bg-slate-900/60 p-3 text-xs text-slate-400">
              Dato de ejemplo cargado para la demostración; no corresponde a un hecho real verificado.
            </p>
          )}

          <p className="whitespace-pre-line text-sm leading-relaxed text-slate-300">
            {incident.summary || 'Sin descripción.'}
          </p>

          {incident.evidenceExcerpt && (
            <blockquote className="rounded-lg border-l-2 border-red-500 bg-slate-950/80 p-3 text-xs italic text-slate-400">
              "{incident.evidenceExcerpt}"
            </blockquote>
          )}

          {incident.origin === 'CITIZEN' && (
            <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-4">
              <p className="mb-3 text-xs text-slate-300">
                Este reporte lo envió un vecino. Si tú también lo viste, confírmalo: con 3 confirmaciones se publica en el mapa.
              </p>
              <ConfirmIncidentButton incident={incident} confirmedByMe={incident.confirmedByMe} />
            </div>
          )}

          {incident.sources && incident.sources.length > 0 && (
            <div className="space-y-2">
              <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300">
                <Newspaper className="h-4 w-4 text-cyan-400" /> Fuentes ({incident.sources.length})
              </h2>
              {incident.sources.map((src, idx) => (
                <a
                  key={idx}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 p-2.5 text-xs hover:border-slate-600"
                >
                  <span>
                    <span className="block font-semibold text-slate-200">{src.sourceName || 'Fuente'}</span>
                    <span className="line-clamp-1 text-[11px] text-slate-400">{src.title}</span>
                  </span>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
                </a>
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <div className="h-56 overflow-hidden rounded-2xl border border-slate-800">
            <MapContainer center={[incident.lat, incident.lng]} zoom={15} className="h-full w-full" scrollWheelZoom={false}>
              <DarkTiles />
              <CircleMarker
                center={[incident.lat, incident.lng]}
                radius={10}
                pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.6 }}
              />
            </MapContainer>
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-800 bg-[#0d1424]/90 p-4 text-xs">
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 text-red-400" />
              <div>
                <div className="font-semibold text-slate-200">{incident.address || 'Sin dirección exacta'}</div>
                <div className="text-slate-400">{incident.districtName || 'Distrito no identificado'}</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Calendar className="mt-0.5 h-4 w-4 text-blue-400" />
              <div>
                <div className="font-semibold text-slate-200">{formatDateTime(incident.occurredAt)}</div>
                <div className="text-slate-400">{formatTimeAgo(incident.occurredAt)}</div>
              </div>
            </div>
            <div className="text-slate-400">
              Gravedad: <span className="font-bold text-white">{type.severity}/10</span>
            </div>
            {isAi && (
              <div className="text-slate-400">
                Confianza de la IA:{' '}
                <span className="font-bold text-white">{Math.round((incident.confidence ?? 0) * 100)}%</span>
                {incident.llmModel && <span className="block text-[11px]">Modelo: {incident.llmModel}</span>}
              </div>
            )}
          </div>
        </aside>
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-[#050811] text-slate-100">
      <Sidebar />
      <main className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 lg:p-6">
        <Breadcrumbs
          items={[
            { label: 'Inicio', to: '/' },
            { label: 'Reportes', to: '/reportes' },
            { label: `Incidente #${id}` },
          ]}
        />
        {content()}
        <Link to="/reportes" className="text-xs text-blue-400 hover:underline">
          ← Volver a reportes
        </Link>
      </main>
    </div>
  )
}

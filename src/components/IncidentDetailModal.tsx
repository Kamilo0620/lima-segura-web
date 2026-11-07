import { useEffect, useState } from 'react'
import type { IncidentDetail } from '../types'
import { incidentService } from '../services/incidentService'
import {
  INCIDENT_TYPE_CONFIG,
  ORIGIN_CONFIG,
  STATUS_CONFIG,
  formatDateTime,
  formatTimeAgo,
} from '../utils/constants'
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Cpu,
  ExternalLink,
  Flame,
  MapPin,
  Newspaper,
  ShieldAlert,
  X,
} from 'lucide-react'
import Spinner from './Spinner'

interface IncidentDetailModalProps {
  incidentId: number | null
  onClose: () => void
}

export default function IncidentDetailModal({ incidentId, onClose }: IncidentDetailModalProps) {
  const [detail, setDetail] = useState<IncidentDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!incidentId) {
      setDetail(null)
      return
    }

    let isMounted = true
    setLoading(true)
    setError(null)

    incidentService
      .getIncidentDetail(incidentId)
      .then((data) => {
        if (isMounted) setDetail(data)
      })
      .catch((err) => {
        if (isMounted) setError(err?.message || 'No se pudo cargar el detalle del incidente.')
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [incidentId])

  if (!incidentId) return null

  const config = detail ? INCIDENT_TYPE_CONFIG[detail.incidentType] || INCIDENT_TYPE_CONFIG.OTHER : null
  const origin = detail ? ORIGIN_CONFIG[detail.origin] || ORIGIN_CONFIG.NEWS : null
  const status = detail ? STATUS_CONFIG[detail.status] || STATUS_CONFIG.VALIDATED : null

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-end bg-black/75 p-0 backdrop-blur-sm sm:p-4 animate-in fade-in duration-200">
      <div
        className="relative flex h-full w-full max-w-xl flex-col border-l border-slate-800 bg-slate-950/95 p-6 text-slate-100 shadow-2xl backdrop-blur-xl sm:h-[94vh] sm:rounded-2xl sm:border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600/20 text-red-500 border border-red-500/30">
              <ShieldAlert className="h-5 w-5" />
            </span>
            <div>
              <div className="text-[11px] font-bold tracking-widest text-red-400 uppercase">
                Expediente de Inteligencia #{incidentId}
              </div>
              <h2 className="text-lg font-bold text-slate-100">
                {detail?.title || 'Cargando incidente...'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1">
          {loading && (
            <div className="flex h-64 flex-col items-center justify-center gap-3">
              <Spinner />
              <p className="text-xs text-slate-400">Consultando base de datos e índices espaciales...</p>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-800/50 bg-red-950/40 p-4 text-xs text-red-300">
              {error}
            </div>
          )}

          {detail && config && (
            <>
              {/* Status and Origin Chips */}
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${config.bg} ${config.color} border ${config.border}`}
                >
                  {config.label}
                </span>

                <span className={`rounded-lg px-2.5 py-1 text-xs font-medium ${origin?.badge}`}>
                  {origin?.label}
                </span>

                <span className={`rounded-lg px-2.5 py-1 text-xs font-medium ${status?.badge}`}>
                  {status?.label}
                </span>
              </div>

              {/* Gravity and Confidence Meters */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                    <span className="flex items-center gap-1">
                      <Flame className="h-3.5 w-3.5 text-orange-400" />
                      Gravedad del Delito
                    </span>
                    <span className="font-bold text-slate-200">{config.severity}/10</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-red-600 rounded-full"
                      style={{ width: `${(config.severity / 10) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      Confianza IA (NLP)
                    </span>
                    <span className="font-bold text-slate-200">
                      {Math.round((detail.confidence || 0.8) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full"
                      style={{ width: `${(detail.confidence || 0.8) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Geolocation Details */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 uppercase tracking-wider">
                  <MapPin className="h-4 w-4 text-red-400" />
                  Ubicación Georreferenciada
                </div>
                <div className="text-sm font-semibold text-slate-100">
                  {detail.address || 'Ubicación identificada por cruce de vías'}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 pt-1">
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-slate-300">
                    Distrito: {detail.districtName || 'Lima Metropolitana'}
                  </span>
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-slate-300">
                    Precisión: {detail.geoPrecision || 'INTERSECCIÓN'}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    ({detail.lat?.toFixed(4)}, {detail.lng?.toFixed(4)})
                  </span>
                </div>
              </div>

              {/* Crime Summary */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 uppercase tracking-wider">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  Resumen de los Hechos
                </div>
                <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-line">
                  {detail.summary || 'Sin resumen disponible.'}
                </p>

                {detail.evidenceExcerpt && (
                  <div className="mt-3 rounded-lg border-l-2 border-red-500 bg-slate-950/80 p-3 text-xs italic text-slate-400">
                    <span className="font-semibold text-slate-300 not-italic">Evidencia extraída: </span>
                    "{detail.evidenceExcerpt}"
                  </div>
                )}
              </div>

              {/* Metadata: Date, Model, Victims */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                    <Calendar className="h-3.5 w-3.5 text-blue-400" />
                    Fecha del Evento
                  </div>
                  <div className="font-medium text-slate-200">
                    {formatDateTime(detail.occurredAt)}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {formatTimeAgo(detail.occurredAt)}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                    <Cpu className="h-3.5 w-3.5 text-purple-400" />
                    Modelo de Extracción
                  </div>
                  <div className="font-medium text-slate-200">
                    {detail.llmModel || 'Llama 3.1 70B (Groq)'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Víctimas reportadas: {detail.victimsCount || 0}
                  </div>
                </div>
              </div>

              {/* Sources and Verifications */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 uppercase tracking-wider">
                    <Newspaper className="h-4 w-4 text-cyan-400" />
                    Fuentes Periodísticas Vinculadas ({detail.sources?.length || 0})
                  </div>
                </div>

                {detail.sources && detail.sources.length > 0 ? (
                  <div className="space-y-2">
                    {detail.sources.map((src, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 p-2.5 text-xs"
                      >
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-200">{src.sourceName || 'Medio Nacional'}</span>
                          <span className="line-clamp-1 text-slate-400 text-[11px]">{src.title}</span>
                        </div>
                        {src.url && (
                          <a
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-[11px] text-cyan-400 hover:bg-slate-700"
                          >
                            <span>Visitar</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    Incidente alimentado a través del pipeline automatizado institucional.
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800/80 pt-3">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-slate-800 py-2.5 text-xs font-medium text-slate-200 transition hover:bg-slate-700"
          >
            Cerrar Expediente
          </button>
        </div>
      </div>
    </div>
  )
}

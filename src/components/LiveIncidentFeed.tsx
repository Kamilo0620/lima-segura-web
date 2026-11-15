import { useEffect, useState } from 'react'
import type { IncidentSummary } from '../types'
import { incidentService } from '../services/incidentService'
import { INCIDENT_TYPE_CONFIG, formatTimeAgo } from '../utils/constants'
import { Activity, Bell, ChevronRight, Radio } from 'lucide-react'

interface LiveIncidentFeedProps {
  onSelectIncident: (id: number) => void
  recentIncidents: IncidentSummary[]
}

export default function LiveIncidentFeed({
  onSelectIncident,
  recentIncidents,
}: LiveIncidentFeedProps) {
  const [liveEvent, setLiveEvent] = useState<string | null>(null)
  const [sseConnected, setSseConnected] = useState<boolean>(false)

  useEffect(() => {
    let eventSource: EventSource | null = null

    try {
      eventSource = incidentService.createEventSource()

      eventSource.onopen = () => {
        setSseConnected(true)
      }

      eventSource.addEventListener('incident_published', (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data)
          setLiveEvent(`Nuevo incidente publicado: ${payload.title || payload.incidentType || 'Alerta de Seguridad'}`)
          setTimeout(() => setLiveEvent(null), 8000)
        } catch {
          setLiveEvent('Nuevo incidente procesado y publicado en el mapa.')
          setTimeout(() => setLiveEvent(null), 8000)
        }
      })

      eventSource.addEventListener('ingestion_completed', (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data)
          setLiveEvent(`Ciclo de ingesta finalizado: ${payload.itemsNew || 0} nuevos incidentes`)
          setTimeout(() => setLiveEvent(null), 6000)
        } catch {
          // Ignore
        }
      })

      eventSource.onerror = () => {
        setSseConnected(false)
      }
    } catch {
      setSseConnected(false)
    }

    return () => {
      if (eventSource) {
        eventSource.close()
      }
    }
  }, [])

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-800 bg-slate-950/80 p-4 shadow-xl backdrop-blur-xl">
      {/* Feed Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-red-500 animate-pulse" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Feed en Tiempo Real
          </h3>
        </div>

        {/* Live SSE status indicator */}
        <div className="flex items-center gap-1.5 rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-medium border border-slate-800">
          <span
            className={`h-2 w-2 rounded-full ${
              sseConnected
                ? 'bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse'
                : 'bg-amber-500'
            }`}
          />
          <span className={sseConnected ? 'text-emerald-400' : 'text-amber-400'}>
            {sseConnected ? 'STREAM ACTIVO' : 'CONECTANDO'}
          </span>
        </div>
      </div>

      {/* Live Event Alert Banner */}
      {liveEvent && (
        <div className="my-3 flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-950/70 p-2.5 text-xs text-red-200 shadow-lg animate-bounce">
          <Bell className="h-4 w-4 text-red-400 shrink-0" />
          <span className="line-clamp-2 font-medium">{liveEvent}</span>
        </div>
      )}

      {/* Incident List */}
      <div className="mt-3 flex-1 overflow-y-auto space-y-2.5 pr-1">
        {recentIncidents.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center text-center text-xs text-slate-500">
            <Radio className="mb-2 h-6 w-6 text-slate-600" />
            <p>Esperando eventos del pipeline...</p>
          </div>
        ) : (
          recentIncidents.map((inc) => {
            const config = INCIDENT_TYPE_CONFIG[inc.incidentType] || INCIDENT_TYPE_CONFIG.OTHER

            return (
              <div
                key={inc.id}
                onClick={() => onSelectIncident(inc.id)}
                className="group cursor-pointer rounded-xl border border-slate-800/80 bg-slate-900/50 p-3 transition hover:border-red-500/50 hover:bg-slate-900"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wider ${config.bg} ${config.color}`}
                  >
                    {config.label}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {formatTimeAgo(inc.occurredAt)}
                  </span>
                </div>

                <h4 className="mt-1.5 line-clamp-1 text-xs font-semibold text-slate-200 group-hover:text-red-400 transition">
                  {inc.title}
                </h4>

                <p className="mt-1 line-clamp-2 text-[11px] text-slate-400 leading-relaxed">
                  {inc.summary}
                </p>

                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                  <span>{inc.districtName || 'Distrito no identificado'}</span>
                  <span className="flex items-center text-slate-400 group-hover:text-red-400">
                    Detalles
                    <ChevronRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

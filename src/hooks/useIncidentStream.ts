import { useEffect, useRef } from 'react'
import { incidentService } from '../services/incidentService'

/** Saca el id del incidente del mensaje SSE (puede venir como número o como objeto). */
function parseIncidentId(data: string): number | null {
  try {
    const payload = JSON.parse(data)
    if (typeof payload === 'number') return payload
    return payload?.incidentId ?? payload?.id ?? null
  } catch {
    const n = Number(data)
    return Number.isFinite(n) ? n : null
  }
}

/**
 * Se suscribe al stream SSE del backend y avisa cada vez que se publica un incidente.
 * El navegador reconecta solo si se cae la conexión.
 */
export function useIncidentStream(onPublished: (incidentId: number) => void) {
  const callbackRef = useRef(onPublished)
  callbackRef.current = onPublished

  useEffect(() => {
    let source: EventSource
    try {
      source = incidentService.createEventSource()
    } catch {
      return
    }
    const handler = (e: MessageEvent) => {
      const id = parseIncidentId(e.data)
      if (id != null) callbackRef.current(id)
    }
    source.addEventListener('incident_published', handler)
    return () => source.close()
  }, [])
}

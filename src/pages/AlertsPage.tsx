import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { INCIDENT_TYPE_CONFIG, formatTimeAgo } from '../utils/constants'
import { distanceMeters, formatDistance } from '../utils/format'
import Sidebar from '../components/Sidebar'
import { useUserLocation } from '../hooks/useUserLocation'
import { incidentService } from '../services/incidentService'
import type { IncidentSummary } from '../types'
import {
  Bell,
  BellRing,
  ShieldAlert,
  Sliders,
  Volume2,
  Radio,
  MapPin,
  AlertOctagon,
  PhoneCall,
} from 'lucide-react'

export default function AlertsPage() {
  const [radiusMeters, setRadiusMeters] = useState(500)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [criticalOnly, setCriticalOnly] = useState(false)
  const [testAlertTriggered, setTestAlertTriggered] = useState(false)
  const [recentIncidents, setRecentIncidents] = useState<IncidentSummary[]>([])

  const { locationState, requestCurrentLocation } = useUserLocation([])

  useEffect(() => {
    const controller = new AbortController()
    incidentService
      .getIncidents({ size: 200 }, controller.signal)
      .then((res) => setRecentIncidents(res.content))
      .catch(() => setRecentIncidents([]))
    return () => controller.abort()
  }, [])

  // Incidentes reales dentro del radio elegido, del más cercano al más lejano
  const nearby = useMemo(() => {
    if (locationState.lat == null || locationState.lng == null) return []
    const { lat, lng } = locationState
    return recentIncidents
      .map((inc) => ({ inc, dist: distanceMeters(lat, lng, inc.lat, inc.lng) }))
      .filter(({ inc, dist }) => {
        if (dist > radiusMeters) return false
        if (criticalOnly) return (INCIDENT_TYPE_CONFIG[inc.incidentType]?.severity ?? 0) >= 8
        return true
      })
      .sort((a, b) => a.dist - b.dist)
  }, [recentIncidents, locationState, radiusMeters, criticalOnly])

  const triggerTestAlert = () => {
    setTestAlertTriggered(true)
    if (soundEnabled && typeof window !== 'undefined' && 'AudioContext' in window) {
      try {
        const ctx = new window.AudioContext()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(800, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.3)
        gain.gain.setValueAtTime(0.15, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
        osc.start()
        osc.stop(ctx.currentTime + 0.35)
      } catch {
        // Audio fallback
      }
    }
    setTimeout(() => setTestAlertTriggered(false), 6000)
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-[#050811] text-slate-100">
      <Sidebar />

      <main className="flex-1 flex flex-col p-4 lg:p-6 gap-4 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-[#0d1424]/90 p-5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-950/80 border border-amber-500/40 text-amber-400">
              <BellRing className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white flex items-center gap-2">
                Mis alertas
              </h1>
              <p className="text-xs text-slate-400">
                Elige un radio alrededor de tu ubicación y revisa los incidentes registrados dentro de él.
              </p>
            </div>
          </div>

          <button
            onClick={triggerTestAlert}
            className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-amber-600/30 hover:bg-amber-500 transition"
          >
            <Radio className="h-4 w-4" />
            <span>Emitir Alerta de Prueba</span>
          </button>
        </div>

        {/* Test Alert Banner if Triggered */}
        {testAlertTriggered && (
          <div className="flex items-center justify-between rounded-2xl border border-red-500 bg-red-950/90 p-4 text-white shadow-2xl animate-bounce">
            <div className="flex items-center gap-3">
              <AlertOctagon className="h-6 w-6 text-red-400 animate-pulse" />
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-red-200">
                  ALERTA DE PRUEBA
                </div>
                <div className="text-xs text-red-300">
                  Así se verá un aviso cuando se publique un incidente a menos de {formatDistance(radiusMeters)} de ti. (Esto es solo una prueba.)
                </div>
              </div>
            </div>
            <button
              onClick={() => setTestAlertTriggered(false)}
              className="rounded-lg bg-white/20 px-3 py-1 text-xs font-bold hover:bg-white/30"
            >
              Descartar
            </button>
          </div>
        )}

        {/* Configuration Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 1. Proximity Radius Setting */}
          <div className="rounded-2xl border border-slate-800 bg-[#0d1424]/90 p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sliders className="h-5 w-5 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Radio Perimetral de Alerta</h3>
              </div>
              <span className="rounded-lg bg-blue-950/80 border border-blue-500/40 px-2.5 py-1 text-xs font-black text-blue-300">
                {radiusMeters >= 1000 ? `${radiusMeters / 1000} km` : `${radiusMeters} metros`}
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              La lista de abajo muestra los incidentes registrados dentro de este radio alrededor de tu ubicación GPS.
            </p>

            <input
              type="range"
              min="100"
              max="3000"
              step="100"
              value={radiusMeters}
              onChange={(e) => setRadiusMeters(Number(e.target.value))}
              className="w-full accent-blue-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />

            <div className="flex justify-between text-[11px] text-slate-400 font-bold mt-2">
              <span>100 m (Inmediato)</span>
              <span>1 km (Barrial)</span>
              <span>3 km (Distrital)</span>
            </div>

            <div className="mt-5 rounded-xl border border-slate-800 bg-[#070b14] p-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-400" />
                <div>
                  <span className="text-slate-200 font-semibold">{locationState.district ?? 'Tu ubicación'}</span>
                  <span className="text-[11px] text-slate-400 block truncate max-w-[200px]">
                    {locationState.loading
                      ? 'Obteniendo ubicación...'
                      : locationState.address ?? locationState.error ?? 'Ubicación no disponible'}
                  </span>
                </div>
              </div>
              <button
                onClick={requestCurrentLocation}
                className="rounded-lg bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-slate-200 hover:bg-slate-700"
              >
                Actualizar GPS
              </button>
            </div>
          </div>

          {/* 2. Notification Preferences */}
          <div className="rounded-2xl border border-slate-800 bg-[#0d1424]/90 p-5 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="h-5 w-5 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Preferencias de Disparo</h3>
            </div>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-[#070b14] cursor-pointer hover:border-slate-700 transition">
                <div className="flex items-center gap-3">
                  <Volume2 className="h-4 w-4 text-purple-400" />
                  <div>
                    <div className="text-xs font-bold text-slate-200">Alerta Sonora de Riesgo Crítico</div>
                    <div className="text-[10px] text-slate-400">Emite un tono acústico ante homicidios o balaceras cercanas.</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                  className="h-4 w-4 accent-red-500 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-[#070b14] cursor-pointer hover:border-slate-700 transition">
                <div className="flex items-center gap-3">
                  <ShieldAlert className="h-4 w-4 text-red-400" />
                  <div>
                    <div className="text-xs font-bold text-slate-200">Filtrar Exclusivamente Delitos Críticos</div>
                    <div className="text-[10px] text-slate-400">Ignorar hurtos menores y notificar solo sicariato, asaltos y extorsión.</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={criticalOnly}
                  onChange={(e) => setCriticalOnly(e.target.checked)}
                  className="h-4 w-4 accent-red-500 rounded"
                />
              </label>
            </div>

            <div className="mt-4 p-3 rounded-xl border border-red-500/30 bg-red-950/30 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-red-300">
                <PhoneCall className="h-4 w-4 text-red-400" />
                <span>Central de Emergencias PNP</span>
              </div>
              <a
                href="tel:105"
                className="rounded-lg bg-red-600 px-3 py-1 text-xs font-black text-white hover:bg-red-500 transition"
              >
                Llamar 105
              </a>
            </div>
          </div>
        </div>

        {/* Incidentes reales dentro del radio */}
        <div className="rounded-2xl border border-slate-800 bg-[#0d1424]/90 p-5 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">
              Incidentes dentro de tu radio ({formatDistance(radiusMeters)})
            </h3>
            <span className="text-xs font-semibold text-blue-400">{nearby.length} encontrados</span>
          </div>

          {locationState.lat == null ? (
            <p className="py-6 text-center text-xs text-slate-500">Activa tu ubicación para ver los incidentes cercanos.</p>
          ) : nearby.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-500">No hay incidentes registrados dentro de este radio.</p>
          ) : (
            <div className="space-y-2">
              {nearby.slice(0, 10).map(({ inc, dist }) => {
                const type = INCIDENT_TYPE_CONFIG[inc.incidentType] ?? INCIDENT_TYPE_CONFIG.OTHER
                return (
                  <Link
                    key={inc.id}
                    to={`/incidents/${inc.id}`}
                    className="flex items-center justify-between rounded-xl border border-slate-800 bg-[#070b14] p-3 text-xs transition hover:border-slate-700"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`h-2.5 w-2.5 rounded-full ${type.severity >= 8 ? 'bg-red-500' : 'bg-amber-500'}`} />
                      <div>
                        <div className="font-bold text-slate-200">{inc.title}</div>
                        <div className="text-[11px] text-slate-400">
                          {type.label} • {inc.districtName || 'Distrito no identificado'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-bold text-red-400">{formatDistance(dist)}</span>
                      <div className="mt-1 text-[10px] text-slate-500">{formatTimeAgo(inc.occurredAt)}</div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

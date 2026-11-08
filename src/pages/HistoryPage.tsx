import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart2, Clock, Download, FileCheck } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'
import ErrorMessage from '../components/ErrorMessage'
import { useFetch } from '../hooks/useFetch'
import { incidentService } from '../services/incidentService'
import { INCIDENT_TYPE_CONFIG, formatDateTime } from '../utils/constants'

const PERIODS = {
  '7d': { label: 'Últimos 7 días', days: 7 },
  '30d': { label: 'Últimos 30 días', days: 30 },
  '90d': { label: 'Último trimestre', days: 90 },
  '365d': { label: 'Último año', days: 365 },
} as const
type Period = keyof typeof PERIODS

/** Fecha local sin zona horaria, que es lo que espera el backend (LocalDateTime). */
function toLocalIso(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`
}

export default function HistoryPage() {
  const [period, setPeriod] = useState<Period>('30d')

  const fetcher = useCallback(
    (signal: AbortSignal) => {
      const from = new Date(Date.now() - PERIODS[period].days * 24 * 60 * 60 * 1000)
      return incidentService.getIncidents({ from: toLocalIso(from), size: 500 }, signal)
    },
    [period],
  )
  const { data, loading, error, refetch } = useFetch(fetcher)
  const incidents = useMemo(() => data?.content ?? [], [data])

  // Agrupación por mes, calculada con los incidentes reales del periodo
  const monthly = useMemo(() => {
    const map = new Map<string, { label: string; total: number; citizen: number }>()
    for (const inc of incidents) {
      const d = new Date(inc.occurredAt)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })
      const row = map.get(key) ?? { label, total: 0, citizen: 0 }
      row.total++
      if (inc.origin === 'CITIZEN') row.citizen++
      map.set(key, row)
    }
    const rows = [...map.entries()].sort(([a], [b]) => b.localeCompare(a)).map(([, v]) => v)
    return rows.map((row, i) => {
      const prev = rows[i + 1]
      const change = prev && prev.total > 0 ? Math.round(((row.total - prev.total) / prev.total) * 100) : null
      return { ...row, change }
    })
  }, [incidents])

  const topType = useMemo(() => {
    const counts = new Map<string, number>()
    incidents.forEach((i) => counts.set(i.incidentType, (counts.get(i.incidentType) ?? 0) + 1))
    const best = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]
    return best ? INCIDENT_TYPE_CONFIG[best[0] as keyof typeof INCIDENT_TYPE_CONFIG]?.label ?? best[0] : '—'
  }, [incidents])

  const handleExportCSV = () => {
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const headers = 'ID,Titulo,Tipo,Distrito,Origen,Estado,Fecha\n'
    const rows = incidents
      .map((i) => [i.id, i.title, i.incidentType, i.districtName, i.origin, i.status, i.occurredAt].map(esc).join(','))
      .join('\n')
    const blob = new Blob(['﻿' + headers + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `lima_segura_historico_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const citizenCount = incidents.filter((i) => i.origin === 'CITIZEN').length
  const truncated = data != null && data.totalElements > incidents.length

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-[#050811] text-slate-100">
      <Sidebar />

      <main className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 lg:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-[#0d1424]/90 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-purple-500/40 bg-purple-950/80 text-purple-400">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white">Histórico de incidentes</h1>
              <p className="text-xs text-slate-400">Evolución por mes de los incidentes registrados en el periodo elegido.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as Period)}
              className="rounded-xl border border-slate-800 bg-[#070b14] px-3 py-2 text-xs text-slate-200 focus:outline-none"
            >
              {Object.entries(PERIODS).map(([k, p]) => (
                <option key={k} value={k}>
                  {p.label}
                </option>
              ))}
            </select>
            <button
              onClick={handleExportCSV}
              disabled={incidents.length === 0}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-200 transition hover:bg-slate-700 disabled:opacity-40"
            >
              <Download className="h-4 w-4" />
              Exportar CSV
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Spinner />
          </div>
        ) : error ? (
          <ErrorMessage message={error} onRetry={refetch} />
        ) : incidents.length === 0 ? (
          <EmptyState message="No hay incidentes registrados en este periodo." />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-[#0d1424]/90 p-4">
                <div className="mb-1 text-xs font-semibold text-slate-400">Incidentes en el periodo</div>
                <div className="text-2xl font-black text-white">{data?.totalElements.toLocaleString('es-PE')}</div>
                {truncated && <div className="mt-1 text-[11px] text-slate-500">Se analizan los {incidents.length} más recientes</div>}
              </div>
              <div className="rounded-2xl border border-slate-800 bg-[#0d1424]/90 p-4">
                <div className="mb-1 text-xs font-semibold text-slate-400">Delito más frecuente</div>
                <div className="text-2xl font-black text-red-400">{topType}</div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-[#0d1424]/90 p-4">
                <div className="mb-1 text-xs font-semibold text-slate-400">Reportes vecinales</div>
                <div className="text-2xl font-black text-purple-400">{citizenCount}</div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#0d1424]/90 p-5 shadow-xl">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
                <BarChart2 className="h-4 w-4 text-purple-400" />
                Evolución mensual
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="pb-3 font-bold">Mes</th>
                      <th className="pb-3 font-bold">Incidentes</th>
                      <th className="pb-3 font-bold">Reportes vecinales</th>
                      <th className="pb-3 font-bold">Variación vs. mes anterior</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {monthly.map((row) => (
                      <tr key={row.label}>
                        <td className="py-3 font-bold capitalize text-slate-200">{row.label}</td>
                        <td className="py-3 font-mono text-slate-300">{row.total}</td>
                        <td className="py-3 font-mono text-slate-300">{row.citizen}</td>
                        <td className="py-3">
                          {row.change == null ? (
                            <span className="text-slate-500">—</span>
                          ) : (
                            <span
                              className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${
                                row.change <= 0
                                  ? 'border-emerald-500/40 bg-emerald-950/80 text-emerald-300'
                                  : 'border-red-500/40 bg-red-950/80 text-red-300'
                              }`}
                            >
                              {row.change > 0 ? '+' : ''}
                              {row.change}%
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#0d1424]/90 p-5 shadow-xl">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-bold text-white">
                  <FileCheck className="h-4 w-4 text-emerald-400" />
                  Últimos registros
                </h3>
                <Link to="/reportes" className="text-xs text-blue-400 hover:underline">
                  Ver todos
                </Link>
              </div>
              <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
                {incidents.slice(0, 20).map((inc) => (
                  <Link
                    key={inc.id}
                    to={`/incidents/${inc.id}`}
                    className="flex items-center justify-between rounded-xl border border-slate-800 bg-[#070b14] p-3 text-xs transition hover:border-slate-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className="font-mono text-xs font-bold text-slate-500">#{inc.id}</div>
                      <div>
                        <div className="font-bold text-slate-200">{inc.title}</div>
                        <div className="text-[11px] text-slate-400">
                          {inc.districtName || 'Distrito no identificado'}
                          {inc.address ? ` • ${inc.address}` : ''}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="rounded-md border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                        {INCIDENT_TYPE_CONFIG[inc.incidentType]?.label ?? inc.incidentType}
                      </span>
                      <div className="mt-1 text-[10px] text-slate-500">{formatDateTime(inc.occurredAt)}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useFetch } from '../hooks/useFetch'
import ErrorMessage from '../components/ErrorMessage'
import Sidebar from '../components/Sidebar'
import HourlyRiskCard from '../components/HourlyRiskCard'
import CategoryDistributionCard from '../components/CategoryDistributionCard'
import TopDangerZonesCard from '../components/TopDangerZonesCard'
import { incidentService } from '../services/incidentService'
import {
  BarChart3,
  MapPin,
  Info,
} from 'lucide-react'

export default function AnalyticsPage() {
  const fetcher = useCallback((signal: AbortSignal) => incidentService.getDashboardStats(signal), [])
  const { data: stats, error, refetch } = useFetch(fetcher)
  const districtRankings = stats?.topDangerZones ?? []

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-[#050811] text-slate-100">
      <Sidebar />

      <main className="flex-1 flex flex-col p-4 lg:p-6 gap-4 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-[#0d1424]/90 p-5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white flex items-center gap-2">
                Estadísticas de incidentes
                {stats && (
                  <span className="rounded-full bg-cyan-950/60 border border-cyan-500/40 px-2.5 py-0.5 text-xs font-bold text-cyan-300">
                    {stats.totalIncidents.toLocaleString('es-PE')} publicados
                  </span>
                )}
              </h1>
              <p className="text-xs text-slate-400">
                Calculadas en el backend con los incidentes publicados: por distrito, por hora del día y por tipo de delito.
              </p>
            </div>
          </div>
        </div>

        {error && <ErrorMessage message={error} onRetry={refetch} />}

        {/* 3 Analytics Cards (Hourly, Categories, Danger Zones) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <HourlyRiskCard data={stats?.hourlyRisk} />
          <CategoryDistributionCard
            totalCount={stats ? stats.totalIncidents.toLocaleString('es-PE') : '—'}
            stats={stats?.categoryDistribution}
          />
          <TopDangerZonesCard
            zones={stats?.topDangerZones}
          />
        </div>

        {/* District Density Table & AI Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* District Rankings Table */}
          <div className="lg:col-span-8 rounded-2xl border border-slate-800 bg-[#0d1424]/90 p-5 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-red-400" />
                Ranking de distritos
              </span>
              <span className="text-[11px] font-normal text-slate-400">100 = distrito con más incidentes</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="pb-3 font-bold">#</th>
                    <th className="pb-3 font-bold">Distrito</th>
                    <th className="pb-3 font-bold">Nivel de Riesgo</th>
                    <th className="pb-3 font-bold text-right">Índice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {districtRankings.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-500">
                        Aún no hay incidentes publicados por distrito.
                      </td>
                    </tr>
                  )}
                  {districtRankings.map((d) => (
                    <tr key={d.zone} className="hover:bg-slate-800/30 transition">
                      <td className="py-2.5 font-bold text-slate-500 font-mono">{d.rank}</td>
                      <td className="py-2.5 font-bold text-slate-200">
                        <Link to={`/reportes?district=${encodeURIComponent(d.zone)}`} className="hover:underline">
                          {d.zone}
                        </Link>
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                            d.level === 'ALTO'
                              ? 'bg-red-950/80 text-red-300 border border-red-500/40'
                              : d.level === 'MEDIO'
                              ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                              : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                          }`}
                        >
                          {d.level}
                        </span>
                      </td>
                      <td
                        className={`py-2.5 text-right font-black font-mono text-sm ${
                          d.level === 'ALTO' ? 'text-red-400' : d.level === 'MEDIO' ? 'text-amber-400' : 'text-emerald-400'
                        }`}
                      >
                        {d.score}/100
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cómo se calculan los datos */}
          <div className="lg:col-span-4 rounded-2xl border border-slate-800 bg-[#0d1424]/90 p-5 shadow-xl">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
              <Info className="h-4 w-4 text-cyan-400" />
              ¿De dónde salen estos datos?
            </h3>
            <ul className="space-y-2 text-xs leading-relaxed text-slate-300">
              <li>• Se cuentan solo los incidentes <b>publicados</b>.</li>
              <li>• Los de noticias pasan por un modelo de IA que extrae tipo, lugar y fecha.</li>
              <li>• Los reportes vecinales se publican al recibir 3 confirmaciones de otros usuarios.</li>
              <li>• Los índices son relativos: 100 corresponde al distrito u hora con más casos.</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}

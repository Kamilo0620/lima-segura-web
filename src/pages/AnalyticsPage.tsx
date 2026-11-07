import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import HourlyRiskCard from '../components/HourlyRiskCard'
import CategoryDistributionCard from '../components/CategoryDistributionCard'
import TopDangerZonesCard from '../components/TopDangerZonesCard'
import { incidentService } from '../services/incidentService'
import {
  BarChart3,
  MapPin,
  Cpu,
  ShieldCheck,
} from 'lucide-react'

export default function AnalyticsPage() {
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    incidentService.getDashboardStats().then((data) => {
      if (data) setStats(data)
    })
  }, [])

  // District Crime Density Ranking
  const districtRankings = [
    { rank: 1, name: 'Cercado de Lima', count: 184, risk: 'ALTO', score: 88, color: 'text-red-400' },
    { rank: 2, name: 'San Juan de Lurigancho', count: 162, risk: 'ALTO', score: 85, color: 'text-red-400' },
    { rank: 3, name: 'Callao (Prov. Const.)', count: 148, risk: 'ALTO', score: 83, color: 'text-red-400' },
    { rank: 4, name: 'San Martín de Porres', count: 135, risk: 'ALTO', score: 79, color: 'text-red-400' },
    { rank: 5, name: 'La Victoria', count: 120, risk: 'ALTO', score: 76, color: 'text-red-400' },
    { rank: 6, name: 'Comas', count: 108, risk: 'ALTO', score: 74, color: 'text-red-400' },
    { rank: 7, name: 'Ate Vitarte', count: 96, risk: 'MEDIO', score: 65, color: 'text-amber-400' },
    { rank: 8, name: 'Breña', count: 88, risk: 'MEDIO', score: 62, color: 'text-amber-400' },
    { rank: 9, name: 'Los Olivos', count: 82, risk: 'MEDIO', score: 58, color: 'text-amber-400' },
    { rank: 10, name: 'Surquillo', count: 71, risk: 'MEDIO', score: 52, color: 'text-amber-400' },
    { rank: 11, name: 'Miraflores', count: 32, risk: 'BAJO', score: 28, color: 'text-emerald-400' },
    { rank: 12, name: 'San Isidro', count: 24, risk: 'BAJO', score: 21, color: 'text-emerald-400' },
  ]

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
                Analítica Espacio-Temporal de Criminalidad
                <span className="rounded-full bg-cyan-950/60 border border-cyan-500/40 px-2.5 py-0.5 text-xs font-bold text-cyan-300">
                  IA Predictiva 91.4% Precisión
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Métricas agregadas por distrito, hora del día, tipología delictiva y severidad en Lima Metropolitana.
              </p>
            </div>
          </div>
        </div>

        {/* 3 Analytics Cards (Hourly, Categories, Danger Zones) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <HourlyRiskCard data={stats?.hourlyRisk} />
          <CategoryDistributionCard
            totalCount={stats?.totalIncidents ? `${stats.totalIncidents}` : '1,248'}
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
                Ranking de Densidad Delictiva por Distrito
              </span>
              <span className="text-[11px] font-normal text-slate-400">Puntaje sobre 100</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="pb-3 font-bold">#</th>
                    <th className="pb-3 font-bold">Distrito</th>
                    <th className="pb-3 font-bold">Incidentes Registrados</th>
                    <th className="pb-3 font-bold">Nivel de Riesgo</th>
                    <th className="pb-3 font-bold text-right">Índice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {districtRankings.map((d) => (
                    <tr key={d.name} className="hover:bg-slate-800/30 transition">
                      <td className="py-2.5 font-bold text-slate-500 font-mono">{d.rank}</td>
                      <td className="py-2.5 font-bold text-slate-200">{d.name}</td>
                      <td className="py-2.5 text-slate-300 font-mono">{d.count}</td>
                      <td className="py-2.5">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                            d.risk === 'ALTO'
                              ? 'bg-red-950/80 text-red-300 border border-red-500/40'
                              : d.risk === 'MEDIO'
                              ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                              : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                          }`}
                        >
                          {d.risk}
                        </span>
                      </td>
                      <td className={`py-2.5 text-right font-black font-mono text-sm ${d.color}`}>
                        {d.score}/100
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Ingestion & NLP Model Performance */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="rounded-2xl border border-slate-800 bg-[#0d1424]/90 p-5 shadow-xl flex-1">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Cpu className="h-4 w-4 text-cyan-400" />
                Rendimiento del Motor IA
              </h3>

              <div className="space-y-4 text-xs">
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Precisión en Extracción NLP</span>
                    <span className="font-bold text-cyan-400">91.4%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-cyan-500 rounded-full" style={{ width: '91.4%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Geolocalización Automática</span>
                    <span className="font-bold text-emerald-400">88.7%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '88.7%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Deduplicación de Fuentes</span>
                    <span className="font-bold text-purple-400">94.2%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: '94.2%' }} />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80">
                  <div className="rounded-xl border border-slate-800 bg-[#070b14] p-3 text-[11px] text-slate-300">
                    <div className="font-bold text-white flex items-center gap-1.5 mb-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                      Pipeline Continuo Activo
                    </div>
                    Sondeo autónomo cada 5 minutos sobre periódicos nacionales y transmisiones de noticias.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

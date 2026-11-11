import { INCIDENT_TYPE_CONFIG } from '../utils/constants'
import type { IncidentType } from '../types'

interface CategoryStat {
  category: string
  percentage: number
  count?: number
  color: string
}

interface CategoryDistributionCardProps {
  totalCount?: string | number
  stats?: CategoryStat[]
}

const PALETTE = ['#ef4444', '#f97316', '#eab308', '#a855f7', '#64748b']

/** Muestra las 4 categorías principales y agrupa el resto en "Otros", calculando porcentajes exactos. */
function groupStats(stats: CategoryStat[]): { items: CategoryStat[]; computedTotal: number } {
  if (!stats || stats.length === 0) return { items: [], computedTotal: 0 }

  const total = stats.reduce((acc, s) => acc + (s.count ?? 0), 0)
  const sorted = [...stats].sort((a, b) => (b.count ?? b.percentage) - (a.count ?? a.percentage))

  const top = sorted.slice(0, 4).map((s, idx) => {
    const cnt = s.count ?? 0
    const pct = total > 0 ? Math.round((cnt * 100) / total) : s.percentage
    return {
      category: INCIDENT_TYPE_CONFIG[s.category as IncidentType]?.label ?? s.category,
      count: cnt,
      percentage: pct,
      color: PALETTE[idx] || s.color,
    }
  })

  const rest = sorted.slice(4)
  if (rest.length > 0) {
    const restCount = rest.reduce((sum, s) => sum + (s.count ?? 0), 0)
    const topPctSum = top.reduce((sum, s) => sum + s.percentage, 0)
    const restPct = total > 0 ? Math.max(1, 100 - topPctSum) : rest.reduce((sum, s) => sum + s.percentage, 0)
    top.push({
      category: 'Otros',
      count: restCount,
      percentage: restPct,
      color: '#64748b',
    })
  }

  return { items: top, computedTotal: total }
}

export default function CategoryDistributionCard({
  totalCount = '—',
  stats: rawStats = [],
}: CategoryDistributionCardProps) {
  const { items: stats, computedTotal } = groupStats(rawStats)
  const displayTotal =
    computedTotal > 0
      ? computedTotal.toLocaleString('es-PE')
      : totalCount !== '—' && totalCount !== 0
        ? totalCount
        : '—'

  let cumulative = 0
  const radius = 38
  const circumference = 2 * Math.PI * radius

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-[#0d1424]/90 p-4 shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between text-xs mb-3">
        <div className="flex items-center gap-1.5 font-bold text-slate-200">
          <span>Incidentes por categoría</span>
          <span className="text-[10px] text-slate-400 font-normal">(publicados)</span>
        </div>
      </div>

      {/* Donut Chart + Legend Grid */}
      <div className="flex items-center justify-between gap-4 py-1">
        {/* SVG Donut */}
        <div className="relative flex h-28 w-28 shrink-0 items-center justify-center">
          <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
            {stats.length === 0 && (
              <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#1e293b" strokeWidth="15" />
            )}
            {stats.map((item, idx) => {
              const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`
              const strokeDashoffset = -((cumulative / 100) * circumference)
              cumulative += item.percentage

              return (
                <circle
                  key={idx}
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth="15"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-700"
                />
              )
            })}
          </svg>

          {/* Center Hole Text */}
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-base font-black text-white leading-none">{displayTotal}</span>
            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
              Total
            </span>
          </div>
        </div>

        {/* Legend List */}
        <div className="flex-1 space-y-1.5 text-[11px]">
          {stats.length === 0 && <p className="text-slate-500">Sin datos todavía.</p>}
          {stats.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 truncate">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-slate-300 truncate max-w-[115px]">{item.category}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 font-mono">
                {item.count != null && item.count > 0 && (
                  <span className="text-[10px] text-slate-400">({item.count})</span>
                )}
                <span className="font-bold text-slate-200">{item.percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

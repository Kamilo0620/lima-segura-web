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

const DEFAULT_STATS: CategoryStat[] = [
  { category: 'Robo a transeúnte', percentage: 38, color: '#ef4444' }, // Red
  { category: 'Robo de vehículo', percentage: 22, color: '#f97316' }, // Orange
  { category: 'Hurto', percentage: 16, color: '#eab308' }, // Yellow
  { category: 'Asalto con arma', percentage: 14, color: '#a855f7' }, // Purple
  { category: 'Otros', percentage: 10, color: '#64748b' }, // Gray
]

export default function CategoryDistributionCard({
  totalCount = '1,248',
  stats = DEFAULT_STATS,
}: CategoryDistributionCardProps) {
  // SVG Donut calculation
  let cumulative = 0
  const radius = 38
  const circumference = 2 * Math.PI * radius

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-[#0d1424]/90 p-4 shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between text-xs mb-3">
        <div className="flex items-center gap-1.5 font-bold text-slate-200">
          <span>Incidentes por categoría</span>
          <span className="text-[10px] text-slate-400 font-normal">(últimos 7 días)</span>
        </div>
      </div>

      {/* Donut Chart + Legend Grid */}
      <div className="flex items-center justify-between gap-4 py-1">
        {/* SVG Donut */}
        <div className="relative flex h-28 w-28 shrink-0 items-center justify-center">
          <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
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
            <span className="text-sm font-black text-white leading-none">{totalCount}</span>
            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
              Total
            </span>
          </div>
        </div>

        {/* Legend List */}
        <div className="flex-1 space-y-1.5 text-[11px]">
          {stats.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex items-center gap-2 truncate">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-slate-300 truncate max-w-[110px]">{item.category}</span>
              </div>
              <span className="font-bold text-slate-200 font-mono">{item.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

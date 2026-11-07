import { Info } from 'lucide-react'

interface HourlyRiskItem {
  hour: string
  score: number
}

interface HourlyRiskCardProps {
  data?: HourlyRiskItem[]
}

const DEFAULT_HOURLY: HourlyRiskItem[] = [
  { hour: '00:00', score: 14 },
  { hour: '02:00', score: 10 },
  { hour: '04:00', score: 8 },
  { hour: '06:00', score: 12 },
  { hour: '08:00', score: 25 },
  { hour: '10:00', score: 42 },
  { hour: '12:00', score: 68 },
  { hour: '14:00', score: 82 },
  { hour: '16:00', score: 95 },
  { hour: '18:00', score: 88 },
  { hour: '20:00', score: 65 },
  { hour: '22:00', score: 45 },
  { hour: '24:00', score: 20 },
]

export default function HourlyRiskCard({ data = DEFAULT_HOURLY }: HourlyRiskCardProps) {
  // Determine color according to risk score
  const getBarColor = (score: number) => {
    if (score >= 75) return 'bg-red-500 shadow-[0_0_8px_#ef4444]'
    if (score >= 50) return 'bg-amber-500'
    if (score >= 30) return 'bg-yellow-500'
    return 'bg-emerald-500'
  }

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-[#0d1424]/90 p-4 shadow-xl backdrop-blur-md">
      {/* Title */}
      <div className="flex items-center justify-between text-xs mb-3">
        <div className="flex items-center gap-1.5 font-bold text-slate-200">
          <span>Riesgo por franja horaria</span>
          <span className="text-[10px] text-slate-400 font-normal">(hoy)</span>
        </div>
        <Info className="h-3.5 w-3.5 text-slate-400" />
      </div>

      {/* Bar Chart Area */}
      <div className="relative mt-2 flex h-36 items-end gap-1.5 pb-4 border-b border-slate-800/80">
        {/* Y Axis Guide Lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[9px] text-slate-600">
          <div className="border-b border-slate-800/40 w-full">100</div>
          <div className="border-b border-slate-800/40 w-full">75</div>
          <div className="border-b border-slate-800/40 w-full">50</div>
          <div className="border-b border-slate-800/40 w-full">25</div>
          <div className="border-b border-slate-800/40 w-full">0</div>
        </div>

        {/* Dynamic Bars */}
        <div className="relative z-10 flex w-full items-end justify-between gap-1 h-full pl-6">
          {data.map((item, idx) => {
            const heightPercent = Math.min(100, Math.max(8, item.score))
            const colorClass = getBarColor(item.score)

            return (
              <div key={idx} className="group relative flex flex-1 flex-col items-center h-full justify-end">
                {/* Hover Tooltip */}
                <div className="pointer-events-none absolute -top-8 rounded bg-slate-900 px-1.5 py-0.5 text-[9px] text-white opacity-0 transition group-hover:opacity-100 z-20 shadow border border-slate-700">
                  {item.hour}: {item.score}
                </div>

                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full max-w-[12px] rounded-t-sm transition-all duration-500 ${colorClass}`}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* X Axis Time Labels */}
      <div className="flex justify-between pl-6 pt-1 text-[9px] text-slate-400 font-mono">
        <span>00:00</span>
        <span>04:00</span>
        <span>08:00</span>
        <span>12:00</span>
        <span>16:00</span>
        <span>20:00</span>
        <span>24:00</span>
      </div>
    </div>
  )
}

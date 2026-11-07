interface DangerZone {
  rank: number
  zone: string
  level: string
  score: number
}

interface TopDangerZonesCardProps {
  zones?: DangerZone[]
  onSelectZone?: (zoneName: string) => void
}

const DEFAULT_ZONES: DangerZone[] = [
  { rank: 1, zone: 'Av. Alfonso Ugarte (Breña)', level: 'ALTO', score: 78 },
  { rank: 2, zone: 'Jr. Zorritos (Cercado de Lima)', level: 'ALTO', score: 74 },
  { rank: 3, zone: 'Av. Venezuela (Breña)', level: 'MEDIO', score: 61 },
  { rank: 4, zone: 'Av. Tingo María (Cercado de Lima)', level: 'MEDIO', score: 58 },
  { rank: 5, zone: 'Jr. Carhuaz (Breña)', level: 'BAJO', score: 42 },
]

export default function TopDangerZonesCard({
  zones = DEFAULT_ZONES,
  onSelectZone,
}: TopDangerZonesCardProps) {
  const getBadgeStyle = (level: string) => {
    switch (level.toUpperCase()) {
      case 'ALTO':
        return 'bg-red-600/90 text-white'
      case 'MEDIO':
        return 'bg-amber-600/90 text-white'
      case 'BAJO':
        return 'bg-yellow-500/90 text-slate-900 font-bold'
      default:
        return 'bg-slate-700 text-white'
    }
  }

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-[#0d1424]/90 p-4 shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between text-xs mb-2">
        <div className="flex items-center gap-1.5 font-bold text-slate-200">
          <span>Zonas más riesgosas</span>
          <span className="text-[10px] text-slate-400 font-normal">(ahora)</span>
        </div>
        <button
          type="button"
          onClick={() => onSelectZone && onSelectZone(zones[0]?.zone)}
          className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 transition"
        >
          Ver mapa
        </button>
      </div>

      {/* Ranked List */}
      <div className="space-y-1.5">
        {zones.map((item) => (
          <div
            key={item.rank}
            onClick={() => onSelectZone && onSelectZone(item.zone)}
            className="flex items-center justify-between rounded-xl border border-slate-800/60 bg-[#080d1a]/50 px-2.5 py-1.5 transition hover:border-slate-700 hover:bg-slate-900/60 cursor-pointer"
          >
            <div className="flex items-center gap-2 truncate">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-slate-300">
                {item.rank}
              </span>
              <span className="text-xs font-medium text-slate-200 truncate max-w-[170px]">
                {item.zone}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span
                className={`rounded px-1.5 py-0.5 text-[9px] font-black tracking-wide ${getBadgeStyle(
                  item.level,
                )}`}
              >
                {item.level}
              </span>
              <span className="text-xs font-bold text-slate-300 font-mono">
                {item.score}/100
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

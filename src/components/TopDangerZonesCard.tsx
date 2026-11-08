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

export default function TopDangerZonesCard({
  zones = [],
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
          <span>Distritos con más incidentes</span>
        </div>
        {zones.length > 0 && (
          <button
            type="button"
            onClick={() => onSelectZone?.(zones[0].zone)}
            className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 transition"
          >
            Ver mapa
          </button>
        )}
      </div>

      {/* Ranked List */}
      {zones.length === 0 && (
        <p className="py-6 text-center text-[11px] text-slate-500">Aún no hay incidentes publicados por distrito.</p>
      )}
      <div className="space-y-1.5">
        {zones.map((item) => (
          <button
            type="button"
            key={item.rank}
            onClick={() => onSelectZone?.(item.zone)}
            title="Índice relativo: 100 = el distrito con más incidentes"
            className="flex w-full items-center justify-between rounded-xl border border-slate-800/60 bg-[#080d1a]/50 px-2.5 py-1.5 transition hover:border-slate-700 hover:bg-slate-900/60 cursor-pointer"
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
          </button>
        ))}
      </div>
    </div>
  )
}

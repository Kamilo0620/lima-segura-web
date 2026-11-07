export default function LimaSeguraLogo({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <div className="flex items-center gap-3">
      {/* Official Red Crest Shield */}
      <div className={`relative flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 to-red-950 p-2 border-2 border-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.5)] ${className}`}>
        <svg viewBox="0 0 24 24" className="h-full w-full fill-white drop-shadow-md">
          {/* Shield Outline with Inner Star Cross Emblem */}
          <path d="M12 2L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-3zm0 3.3l1.8 4.2 4.5.4-3.4 3 1 4.5-3.9-2.3-3.9 2.3 1-4.5-3.4-3 4.5-.4L12 5.3z" />
        </svg>
      </div>

      <div className="flex flex-col leading-tight">
        <span className="text-lg font-black tracking-wider text-white">
          LIMA SEGURA
        </span>
        <span className="text-[10px] font-semibold tracking-wide text-slate-400">
          Mapa de Riesgo Delictivo en Tiempo Real
        </span>
      </div>
    </div>
  )
}

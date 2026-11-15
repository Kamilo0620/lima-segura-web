interface MarkProps {
  className?: string
}

/**
 * Símbolo arquitectónico cívico-tecnológico de Lima Segura:
 * silueta hexagonal-escudo que converge en vértice geolocalizador con arcos de radar urbano.
 */
export function LimaSeguraMark({ className = 'h-9 w-9' }: MarkProps) {
  return (
    <div
      className={`relative flex shrink-0 items-center justify-center rounded-xl bg-slate-900/95 p-1.5 border border-slate-700/90 shadow-lg shadow-slate-950/60 ring-1 ring-sky-400/20 ${className}`}
    >
      <svg
        viewBox="0 0 32 32"
        className="h-full w-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="ls-shield-bg" x1="5" y1="3" x2="27" y2="29" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#090d16" />
          </linearGradient>
          <linearGradient id="ls-shield-rim" x1="6" y1="3" x2="26" y2="28" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.85" />
            <stop offset="55%" stopColor="#64748b" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {/* Contorno escudo-pin geométrico */}
        <path
          d="M16 2.5L26.5 6.8V15.1C26.5 21.7 21.8 26.8 16 29.5C10.2 26.8 5.5 21.7 5.5 15.1V6.8L16 2.5Z"
          fill="url(#ls-shield-bg)"
          stroke="url(#ls-shield-rim)"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />

        {/* Arco exterior de barrido radar */}
        <path
          d="M9.6 15.2A6.4 6.4 0 1 1 22.4 15.2"
          stroke="#38bdf8"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeOpacity="0.8"
        />

        {/* Ejes sutiles de retícula urbana */}
        <path
          d="M16 7.5V9.5M16 20.9V22.9M8.3 15.2H10.3M21.7 15.2H23.7"
          stroke="#94a3b8"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeOpacity="0.7"
        />

        {/* Núcleo telemétrico */}
        <circle cx="16" cy="15.2" r="3.4" fill="#ef4444" fillOpacity="0.22" stroke="#ef4444" strokeWidth="1.35" />
        <circle cx="16" cy="15.2" r="1.45" fill="#f87171" />
      </svg>
    </div>
  )
}

export default function LimaSeguraLogo({
  className = 'h-10 w-10',
  showWordmark = true,
}: {
  className?: string
  showWordmark?: boolean
}) {
  return (
    <div className="flex items-center gap-3 shrink-0">
      <LimaSeguraMark className={className} />
      {showWordmark && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-base sm:text-lg font-black tracking-wider text-white whitespace-nowrap">
              LIMA SEGURA
            </span>
            <span className="hidden lg:inline-block rounded border border-sky-500/30 bg-sky-950/60 px-1.5 py-0.5 text-[9px] font-bold tracking-widest text-sky-300 whitespace-nowrap">
              OBSERVATORIO
            </span>
          </div>
          <span className="text-[10px] font-semibold tracking-wide text-slate-400 whitespace-nowrap">
            Inteligencia Geoespacial de Riesgo Urbano
          </span>
        </div>
      )}
    </div>
  )
}

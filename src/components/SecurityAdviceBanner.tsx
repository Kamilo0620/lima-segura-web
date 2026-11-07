import { AlertTriangle, ShieldCheck } from 'lucide-react'

interface SecurityAdviceBannerProps {
  onOpenReportModal: () => void
}

export default function SecurityAdviceBanner({
  onOpenReportModal,
}: SecurityAdviceBannerProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-blue-900/60 bg-[#071329]/95 px-4 py-3 shadow-xl backdrop-blur-md">
      {/* Security Tip Left */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <p className="text-xs text-slate-300 leading-snug">
          <span className="font-bold text-blue-200">Consejo de seguridad: </span>
          Evita transitar por zonas rojas, especialmente en horarios de alta incidencia (12:00 - 22:00). Mantente alerta y reporta cualquier incidente.
        </p>
      </div>

      {/* Report Incident Action Button Right */}
      <button
        onClick={onOpenReportModal}
        className="flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500 active:scale-95"
      >
        <span>Reportar incidente</span>
        <AlertTriangle className="h-4 w-4 text-amber-300" />
      </button>
    </div>
  )
}

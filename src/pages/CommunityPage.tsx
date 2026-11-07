import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import ReportIncidentModal from '../components/ReportIncidentModal'
import {
  Users,
  ThumbsUp,
  PlusCircle,
  MapPin,
  CheckCircle,
} from 'lucide-react'

export default function CommunityPage() {
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'alerts' | 'patrols'>('alerts')

  const [communityAlerts, setCommunityAlerts] = useState([
    {
      id: 1,
      author: 'Carlos Mendoza',
      district: 'Breña',
      zone: 'Av. Arica con Jr. Napo',
      type: 'Sospecha de Reglaje',
      desc: 'Moto lineal con dos sujetos encapuchados rondando farmacias y bodegas repetidamente desde las 7pm.',
      time: 'Hace 12 min',
      votes: 18,
      verified: true,
      hasVoted: false,
    },
    {
      id: 2,
      author: 'Lucía Huamán',
      district: 'Cercado de Lima',
      zone: 'Jr. Zorritos cdra 7',
      type: 'Alumbrado Público Apagado',
      desc: 'Postes apagados en toda la cuadra, punto vulnerable para arrebatos a transeúntes.',
      time: 'Hace 45 min',
      votes: 34,
      verified: true,
      hasVoted: false,
    },
    {
      id: 3,
      author: 'Junta Vecinal Sector 4',
      district: 'San Juan de Lurigancho',
      zone: 'Av. Próceres de la Independencia',
      type: 'Falso Repartidor Delivery',
      desc: 'Sujeto con mochila térmica simulando entrega, intentó forzar chapa de vivienda.',
      time: 'Hace 2 horas',
      votes: 52,
      verified: true,
      hasVoted: false,
    },
  ])

  const handleVote = (id: number) => {
    setCommunityAlerts((prev) =>
      prev.map((alert) => {
        if (alert.id === id) {
          return {
            ...alert,
            votes: alert.hasVoted ? alert.votes - 1 : alert.votes + 1,
            hasVoted: !alert.hasVoted,
          }
        }
        return alert
      })
    )
  }

  const patrols = [
    {
      name: 'Junta Vecinal Segura Breña Norte',
      district: 'Breña',
      members: 142,
      status: 'En Patrullaje Activo',
      contact: 'Base Serenazgo Breña: (01) 423-1122',
    },
    {
      name: 'Comité de Seguridad Cercado - Mirones',
      district: 'Cercado de Lima',
      members: 215,
      status: 'Coordinando con PNP Unidad Vecinal 3',
      contact: 'Comisaría Mirones: (01) 456-7890',
    },
    {
      name: 'Red de Vigilancia Ciudadana SJL Las Flores',
      district: 'San Juan de Lurigancho',
      members: 380,
      status: 'Alerta Preventiva',
      contact: 'Central Serenazgo SJL: (01) 392-6622',
    },
  ]

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-[#050811] text-slate-100">
      <Sidebar />

      <main className="flex-1 flex flex-col p-4 lg:p-6 gap-4 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-[#0d1424]/90 p-5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-950/80 border border-teal-500/40 text-teal-400">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white flex items-center gap-2">
                Red Comunitaria de Seguridad Ciudadana
                <span className="rounded-full bg-teal-950/60 border border-teal-500/40 px-2.5 py-0.5 text-xs font-bold text-teal-300">
                  Colaboración Vecinal Activa
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Validación colectiva de alertas, reporte vecinal temprano y coordinación con serenazgos distritales.
              </p>
            </div>
          </div>

          <button
            onClick={() => setReportModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-teal-600/30 hover:bg-teal-500 transition"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Publicar Alerta Vecinal</span>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('alerts')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === 'alerts'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Alertas Comunitarias en Tiempo Real ({communityAlerts.length})
          </button>
          <button
            onClick={() => setActiveTab('patrols')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === 'patrols'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Juntas Vecinales &amp; Serenazgo ({patrols.length})
          </button>
        </div>

        {/* Tab 1: Community Alerts */}
        {activeTab === 'alerts' && (
          <div className="space-y-3">
            {communityAlerts.map((alert) => (
              <div
                key={alert.id}
                className="rounded-2xl border border-slate-800 bg-[#0d1424]/90 p-5 shadow-xl transition hover:border-slate-700"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200 text-xs">{alert.author}</span>
                    <span className="rounded-md border border-slate-800 bg-[#070b14] px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                      {alert.district}
                    </span>
                    <span className="rounded-md border border-teal-500/40 bg-teal-950/60 px-2 py-0.5 text-[10px] font-bold text-teal-300">
                      {alert.type}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">{alert.time}</span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold mb-2">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{alert.zone}</span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-4">{alert.desc}</p>

                <div className="flex items-center justify-between border-t border-slate-800/80 pt-3">
                  <button
                    onClick={() => handleVote(alert.id)}
                    className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                      alert.hasVoted
                        ? 'border-teal-500 bg-teal-950/80 text-teal-300'
                        : 'border-slate-800 bg-[#070b14] text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                    <span>Confirmar Alerta ({alert.votes})</span>
                  </button>

                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                    <CheckCircle className="h-4 w-4" />
                    <span>Verificado por la comunidad</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Patrols */}
        {activeTab === 'patrols' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {patrols.map((patrol) => (
              <div
                key={patrol.name}
                className="rounded-2xl border border-slate-800 bg-[#0d1424]/90 p-5 shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="rounded-md border border-slate-800 bg-[#070b14] px-2 py-0.5 text-[10px] font-bold text-slate-300">
                      {patrol.district}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      {patrol.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white mb-2">{patrol.name}</h3>
                  <div className="text-xs text-slate-400 mb-4">
                    Vecinos integrados: <span className="font-bold text-slate-200">{patrol.members}</span>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-[#070b14] p-3 text-xs text-slate-300">
                  <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Contacto Directo</div>
                  <div className="font-bold text-teal-400">{patrol.contact}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <ReportIncidentModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
      />
    </div>
  )
}

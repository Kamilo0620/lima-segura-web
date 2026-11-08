import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import {
  HelpCircle,
  PhoneCall,
  ChevronDown,
  LifeBuoy,
} from 'lucide-react'

export default function HelpPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const emergencyContacts = [
    {
      name: 'Policía Nacional del Perú (PNP)',
      number: '105',
      desc: 'Central de Emergencias Policiales a nivel nacional. Respuesta inmediata a robos, asaltos y delitos flagrantes.',
      color: 'border-red-500/60 bg-red-950/40 text-red-400',
    },
    {
      name: 'Cuerpo General de Bomberos (CGBVP)',
      number: '116',
      desc: 'Atención de incendios, rescates, accidentes vehiculares y emergencias médicas de trauma.',
      color: 'border-amber-500/60 bg-amber-950/40 text-amber-400',
    },
    {
      name: 'Sistema Móvil de Urgencias (SAMU)',
      number: '106',
      desc: 'Ambulancias y paramédicos del Ministerio de Salud para emergencias y urgencias médicas críticas.',
      color: 'border-blue-500/60 bg-blue-950/40 text-blue-400',
    },
    {
      name: 'Línea 100 - Violencia y Vulnerabilidad',
      number: '100',
      desc: 'Orientación y auxilio ante violencia familiar y de género, 24 horas al día, confidencial y gratuito.',
      color: 'border-purple-500/60 bg-purple-950/40 text-purple-400',
    },
  ]

  const faqs = [
    {
      q: '¿Cómo calcula la plataforma el Nivel de Riesgo en mi ubicación?',
      a: 'Con tu ubicación GPS, buscamos los incidentes del mapa que están a menos de 1 km (distancia Haversine). Cada uno suma su gravedad multiplicada por un peso según la cercanía: x3 si está a menos de 150 m, x1.5 hasta 500 m y x0.5 hasta 1 km. El resultado se limita a 100. Si no hay incidentes cerca, el índice es 0.',
    },
    {
      q: '¿De dónde se obtienen los datos de delitos e incidentes?',
      a: 'De dos fuentes: (1) noticias de periódicos y canales de YouTube, de las que un modelo de lenguaje (LLM) extrae el tipo de delito, el lugar y la fecha; y (2) reportes de vecinos registrados, que se publican cuando otros 3 usuarios confirman que también lo vieron. Los datos marcados como "Dato de ejemplo" se cargaron solo para la demostración.',
    },
    {
      q: '¿Qué es el decaimiento temporal de incidentes?',
      a: 'Un delito no genera alarma permanente en el mapa para siempre. Aplicamos un factor de decaimiento temporal exponencial (λ = 0.05/día). A medida que transcurren los días sin reincidencia, la mancha de calor disminuye gradualmente hasta enfriarse por completo a los 14 días.',
    },
    {
      q: '¿Cómo puedo reportar un incidente ocurrido en mi zona?',
      a: 'Inicia sesión y pulsa "Reportar incidente" (en Reportes o en Comunidad). Elige el tipo de delito, marca el punto en el mapa (o usa tu ubicación) y agrega detalles. Tu reporte queda "Pendiente de confirmación" hasta que 3 vecinos distintos pulsen "Yo también lo vi"; entonces se publica en el mapa.',
    },
  ]

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-[#050811] text-slate-100">
      <Sidebar />

      <main className="flex-1 flex flex-col p-4 lg:p-6 gap-4 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-[#0d1424]/90 p-5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-950/80 border border-blue-500/40 text-blue-400">
              <LifeBuoy className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white flex items-center gap-2">
                Centro de Asistencia, Protocolos &amp; Números de Emergencia
              </h1>
              <p className="text-xs text-slate-400">
                Líneas directas de auxilio en Lima y Callao, protocolos de supervivencia y documentación del radar.
              </p>
            </div>
          </div>
        </div>

        {/* Emergency Contacts Cards Grid */}
        <div>
          <h2 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
            <PhoneCall className="h-4 w-4 text-red-500" />
            <span>Centrales de Emergencia de Discado Inmediato</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {emergencyContacts.map((contact) => (
              <div
                key={contact.name}
                className="rounded-2xl border border-slate-800 bg-[#0d1424]/90 p-4 shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white text-xs">{contact.name}</span>
                    <a
                      href={`tel:${contact.number.replace(/\D/g, '')}`}
                      className={`rounded-lg border px-2.5 py-1 text-xs font-black transition hover:scale-105 ${contact.color}`}
                    >
                      {contact.number}
                    </a>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{contact.desc}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-end">
                  <a
                    href={`tel:${contact.number.replace(/\D/g, '')}`}
                    className="flex items-center gap-1.5 rounded-xl bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-500 transition"
                  >
                    <PhoneCall className="h-3.5 w-3.5" />
                    <span>Llamar Ahora</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="rounded-2xl border border-slate-800 bg-[#0d1424]/90 p-5 shadow-xl">
          <h2 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-blue-400" />
            <span>Preguntas Frecuentes sobre Lima Segura</span>
          </h2>

          <div className="space-y-2">
            {faqs.map((faq, idx) => (
              <div
                key={faq.q}
                className="rounded-xl border border-slate-800 bg-[#070b14] overflow-hidden transition"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="flex w-full items-center justify-between p-3.5 text-left text-xs font-bold text-slate-200 hover:text-white"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-400 transition transform ${
                      openFaq === idx ? 'rotate-180 text-red-500' : ''
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-3.5 pb-3.5 text-xs text-slate-400 leading-relaxed border-t border-slate-800/60 pt-2">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

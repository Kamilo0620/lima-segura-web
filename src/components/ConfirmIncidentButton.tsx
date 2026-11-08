import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { incidentService } from '../services/incidentService'
import { getErrorMessage } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { CONFIRMATIONS_TO_PUBLISH } from '../utils/constants'
import type { ConfirmationResult, IncidentSummary } from '../types'

interface Props {
  incident: Pick<IncidentSummary, 'id' | 'origin' | 'status' | 'reporterId' | 'confirmationsCount'>
  confirmedByMe?: boolean
  onConfirmed?: (result: ConfirmationResult) => void
}

/**
 * Botón "Yo también lo vi".
 * Solo aplica a reportes ciudadanos pendientes; con 3 confirmaciones el backend lo publica.
 */
export default function ConfirmIncidentButton({ incident, confirmedByMe = false, onConfirmed }: Props) {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [count, setCount] = useState(incident.confirmationsCount ?? 0)
  const [done, setDone] = useState(confirmedByMe)
  const [status, setStatus] = useState(incident.status)

  if (incident.origin !== 'CITIZEN') return null

  const isOwn = user != null && incident.reporterId === user.id
  const isPending = status === 'PENDING_REVIEW'

  const handleClick = async () => {
    if (!isAuthenticated) {
      toast('Inicia sesión para confirmar reportes')
      navigate('/login')
      return
    }
    try {
      setLoading(true)
      const result = await incidentService.confirmIncident(incident.id)
      setCount(result.confirmations)
      setStatus(result.status)
      setDone(true)
      toast.success(
        result.status === 'PUBLISHED'
          ? '¡Reporte confirmado y publicado en el mapa!'
          : `Confirmación registrada (${result.confirmations}/${result.required})`,
      )
      onConfirmed?.(result)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const progress = (
    <span className="text-[11px] text-slate-400">
      {count}/{CONFIRMATIONS_TO_PUBLISH} confirmaciones
    </span>
  )

  if (!isPending) {
    return (
      <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
        <CheckCircle2 className="h-4 w-4" /> Confirmado por la comunidad
      </div>
    )
  }

  if (isOwn) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-400">
        Es tu reporte · {progress}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleClick}
        disabled={loading || done}
        className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition disabled:cursor-not-allowed ${
          done
            ? 'border-teal-500 bg-teal-950/80 text-teal-300'
            : 'border-slate-700 bg-[#070b14] text-slate-200 hover:bg-slate-800'
        }`}
      >
        <Eye className="h-3.5 w-3.5" />
        {done ? 'Ya lo confirmaste' : loading ? 'Enviando...' : 'Yo también lo vi'}
      </button>
      {progress}
    </div>
  )
}

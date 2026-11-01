import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: number
  icon: ReactNode
}

export default function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm">
      <div className="rounded-lg bg-slate-100 p-3">{icon}</div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  )
}
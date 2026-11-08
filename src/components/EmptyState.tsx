import { Inbox } from 'lucide-react'

export default function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-slate-800 bg-[#0d1424]/90 py-12 text-sm text-slate-400">
      <Inbox className="h-10 w-10 text-slate-600" />
      <p>{message}</p>
    </div>
  )
}

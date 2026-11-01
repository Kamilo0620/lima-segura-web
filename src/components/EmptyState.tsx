import { Inbox } from 'lucide-react'

export default function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl bg-white py-12 text-slate-500">
      <Inbox className="h-10 w-10" />
      <p>{message}</p>
    </div>
  )
}
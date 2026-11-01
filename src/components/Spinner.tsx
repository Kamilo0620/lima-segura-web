export default function Spinner() {
  return (
    <div className="flex justify-center py-10" role="status" aria-label="Cargando">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-red-600" />
    </div>
  )
}
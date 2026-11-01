import { Link } from 'react-router-dom'
import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { Report } from '../types'
import { LIMA_CENTER, STATUS_COLORS } from '../utils/constants'
import StatusBadge from './StatusBadge'

interface ReportsMapProps {
  reports: Report[]
  categoryNames: Map<number, string>
}

export default function ReportsMap({ reports, categoryNames }: ReportsMapProps) {
  return (
    <MapContainer center={LIMA_CENTER} zoom={12} className="h-[28rem] w-full rounded-2xl shadow-sm">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {reports.map((report) => (
        <CircleMarker
          key={report.id}
          center={[report.latitude, report.longitude]}
          radius={9}
          pathOptions={{
            color: STATUS_COLORS[report.status],
            fillColor: STATUS_COLORS[report.status],
            fillOpacity: 0.6,
          }}
        >
          <Popup>
            <div className="space-y-1">
              <p className="font-semibold">{report.description}</p>
              <p className="text-xs text-slate-500">{categoryNames.get(report.categoryId)}</p>
              <StatusBadge status={report.status} />
              <Link to={`/reports/${report.id}`} className="block pt-1 text-sm font-semibold text-red-600">
                Ver detalle →
              </Link>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}
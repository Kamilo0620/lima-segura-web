import { useEffect } from 'react'
import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { LIMA_CENTER } from '../utils/constants'

export interface LatLng {
  lat: number
  lng: number
}

interface LocationPickerProps {
  value: LatLng | null
  onChange: (position: LatLng) => void
  center?: LatLng | null
}

function ClickHandler({ onChange }: { onChange: (position: LatLng) => void }) {
  useMapEvents({
    click: (event) => onChange({ lat: event.latlng.lat, lng: event.latlng.lng }),
  })
  return null
}

function Recenter({ center }: { center: LatLng | null | undefined }) {
  const map = useMap()
  useEffect(() => {
    if (center) map.flyTo([center.lat, center.lng], 16)
  }, [center, map])
  return null
}

export default function LocationPicker({ value, onChange, center }: LocationPickerProps) {
  return (
    <MapContainer center={LIMA_CENTER} zoom={12} className="h-72 w-full rounded-lg">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onChange={onChange} />
      <Recenter center={center} />
      {value && (
        <CircleMarker
          center={[value.lat, value.lng]}
          radius={10}
          pathOptions={{ color: '#dc2626', fillColor: '#dc2626', fillOpacity: 0.6 }}
        />
      )}
    </MapContainer>
  )
}
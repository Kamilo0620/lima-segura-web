import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { useEffect } from 'react'
import 'leaflet/dist/leaflet.css'

export interface LatLng {
  lat: number
  lng: number
}

interface LocationPickerProps {
  value: LatLng | null
  onChange: (value: LatLng) => void
}

const LIMA_CENTER: [number, number] = [-12.0464, -77.0428]

function ClickHandler({ onChange }: { onChange: (value: LatLng) => void }) {
  useMapEvents({
    click: (e) => onChange({ lat: e.latlng.lat, lng: e.latlng.lng }),
  })
  return null
}

/** Mueve el mapa cuando la ubicación cambia desde fuera (por ejemplo, con el GPS). */
function FollowValue({ value }: { value: LatLng | null }) {
  const map = useMap()
  useEffect(() => {
    if (value) map.setView([value.lat, value.lng], Math.max(map.getZoom(), 15))
  }, [value, map])
  return null
}

/** Mapa pequeño: el usuario hace clic donde ocurrió el incidente. */
export default function LocationPicker({ value, onChange }: LocationPickerProps) {
  return (
    <div className="h-48 overflow-hidden rounded-xl border border-slate-800">
      <MapContainer center={value ? [value.lat, value.lng] : LIMA_CENTER} zoom={12} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <ClickHandler onChange={onChange} />
        <FollowValue value={value} />
        {value && (
          <CircleMarker
            center={[value.lat, value.lng]}
            radius={9}
            pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.7 }}
          />
        )}
      </MapContainer>
    </div>
  )
}

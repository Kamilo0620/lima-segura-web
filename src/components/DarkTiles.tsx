import { TileLayer } from 'react-leaflet'

/**
 * Mapa base oscuro rápido y libre de marca de agua sobre Esri World Street Map CDN
 * con cobertura continua de calles y cuadras hasta zoom 19+.
 */
export default function DarkTiles() {
  return (
    <TileLayer
      attribution='&copy; <a href="https://www.esri.com/">Esri</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
      className="dark-esri-street-tiles"
      maxNativeZoom={19}
      maxZoom={22}
      keepBuffer={6}
      updateWhenIdle={false}
      updateWhenZooming={true}
    />
  )
}

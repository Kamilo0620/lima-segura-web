import { TileLayer } from 'react-leaflet'

/**
 * Mapa base oscuro de Esri + capa vectorial oscura de calles OpenStreetMap para zoom profundo (15–22).
 * Evita por completo el error "Map data not yet available" de Esri al acercar al nivel de calle/cuadra,
 * y no requiere ninguna API key externa.
 */
export default function DarkTiles() {
  return (
    <>
      <TileLayer
        attribution='&copy; <a href="https://www.esri.com/">Esri</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
        maxNativeZoom={15}
        maxZoom={22}
      />
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
        maxNativeZoom={15}
        maxZoom={22}
      />
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        className="dark-osm-detail"
        minZoom={15}
        maxNativeZoom={19}
        maxZoom={22}
      />
    </>
  )
}

import { TileLayer } from 'react-leaflet'

/** Mapa base oscuro de Esri (el mismo del mapa principal). No requiere API key. */
export default function DarkTiles() {
  return (
    <>
      <TileLayer
        attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
        url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
        maxZoom={19}
      />
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
        maxZoom={19}
      />
    </>
  )
}

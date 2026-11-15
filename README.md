# 🛡️ LIMA SEGURA — Frontend Web

## CS 2031 - Desarrollo Basado en Plataformas (UTEC)

Aplicación web en **React 19 + TypeScript + Vite** del proyecto **LIMA SEGURA**: un mapa de inseguridad urbana de Lima Metropolitana y el Callao que combina **noticias procesadas con IA (Gemini)** y **reportes ciudadanos validados por la comunidad**.

- **Backend (API REST):** [lima-segura-backend](https://github.com/Kamilo0620/lima-segura-backend)
- **Mobile:** [lima-segura-mobile](https://github.com/EliasFly/lima-segura-mobile)

---

## ✨ Funcionalidades

### Dashboard (`/`)
- **Mapa de calor** con Leaflet (mapa base oscuro de Esri) y filtros por zona, distrito y periodo; capa de calor y capa de focos.
- **Riesgo en tu ubicación:** con el GPS del navegador se calcula un índice 0–100 solo con los incidentes reales a menos de 1 km (distancia Haversine, ponderado por gravedad y cercanía). Sin incidentes cerca, el índice es 0.
- **Geocodificación inversa** con la API externa de OpenStreetMap (Nominatim) para mostrar la dirección y el distrito del usuario.
- **Incidentes más cercanos** ordenados por distancia real, y gráficos de incidentes por hora, por categoría y distritos con más casos (datos del endpoint de estadísticas).

### Reportes (`/reportes`) y detalle (`/incidents/:id`)
- Listado paginado con **búsqueda en el servidor** (con *debounce* de 400 ms) y filtros por tipo, distrito, estado y origen. Los filtros viven en la URL (`useSearchParams`), así que se pueden compartir o recargar.
- Página de detalle con mapa, fuentes periodísticas vinculadas, migas de pan (*breadcrumbs*) y, para incidentes extraídos con IA, el modelo y su nivel de confianza.
- Los **datos de ejemplo** se etiquetan como tales; no se muestran valores inventados cuando falta un dato.

### Comunidad (`/comunidad`)
- Reportes ciudadanos reales en dos pestañas: **Por confirmar** y **Confirmados**.
- Botón **"Yo también lo vi"**: con 3 confirmaciones de usuarios distintos el reporte se publica en el mapa. El autor no puede confirmar su propio reporte.
- **Reportar incidente** (requiere sesión): tipo, título, ubicación marcada en un mapa o con "Usar mi ubicación", distrito y descripción.

### Tiempo real
- La **campanita** recibe por **Server-Sent Events** (`/incidents/stream`) cada incidente publicado y enlaza a su detalle; el dashboard se actualiza solo.

### Otras vistas
- **Mapa de riesgo** (`/mapa`), **Histórico** (`/historico`, evolución mensual y exportación a CSV), **Estadísticas** (`/estadisticas`), **Mis alertas** (`/alertas`, radio configurable alrededor de tu ubicación), **Configuración** (`/configuracion`) y **Ayuda** (`/ayuda`, centrales de emergencia y preguntas frecuentes).
- **Consola de administración** (`/admin`, solo rol `ADMIN`): fuentes de noticias, ejecuciones de ingesta y moderación de incidentes.

---

## 🧱 Arquitectura y buenas prácticas

| Tema | Implementación |
|---|---|
| Cliente HTTP | `axios` con interceptor que agrega el JWT y cierra la sesión ante un `401`; mensajes de error centralizados (`getErrorMessage`) |
| Hooks propios | `useFetch` (carga + cancelación con `AbortController`), `useDebounce`, `useUserLocation`, `useIncidentStream` (SSE), `useAuth` |
| Rutas | React Router 7 con carga diferida (`lazy` + `Suspense`), rutas protegidas (`ProtectedRoute`), ruta solo para admin y página 404 propia |
| Estado global | `AuthContext` (usuario y token) |
| Errores | `ErrorBoundary` global, componentes `ErrorMessage` y `EmptyState`, notificaciones con `react-hot-toast` |
| Componentes reutilizables | `Pagination`, `Breadcrumbs`, `LocationPicker`, `ConfirmIncidentButton`, `DarkTiles`, `Spinner`, modales de detalle y de reporte |
| API externa | OpenStreetMap Nominatim (geocodificación inversa) |

---

## 🛠️ Stack

- React 19 + TypeScript
- Vite 8
- Tailwind CSS 4
- Leaflet + React-Leaflet 5
- Axios
- React Router 7
- Lucide React (íconos) y react-hot-toast

---

## ⚙️ Ejecución local

### Prerrequisitos
- Node.js 18 o superior
- El **backend** corriendo en `http://localhost:8080` (ver su README)

### Pasos
```bash
git clone https://github.com/Kamilo0620/lima-segura-web.git
cd lima-segura-web
npm install
npm run dev
```
Abrir **http://localhost:5173**.

> Si Vite abre otro puerto (por ejemplo 5174, porque ya hay otro `npm run dev` abierto), el backend rechazará las peticiones por **CORS**. Cerrar el otro servidor o agregar ese origen a `CORS_ALLOWED_ORIGINS` en el backend.

### Variables de entorno

| Variable | Descripción | Por defecto |
|---|---|---|
| `VITE_API_URL` | URL base de la API | `http://localhost:8080/api/v1` |

Se define en el archivo `.env` de la raíz. Vite solo expone las variables que empiezan con `VITE_` y las incrusta en el build, así que **no** deben contener secretos.

### Usuarios de prueba
- Registrarse desde `/register` (todo registro crea un usuario ciudadano).
- Administrador sembrado por el backend: `admin@limasegura.pe` (la contraseña de desarrollo debe cambiarse antes del deploy).

---

## 🚀 Despliegue (Vercel)

La web está desplegada en **Vercel** (HTTPS automático) y consume el backend desplegado en **AWS EC2 + RDS** por HTTPS (ver README del backend).

1. En [vercel.com](https://vercel.com) → *Add New… → Project* → importar el repo `lima-segura-web`.
2. *Framework Preset:* **Vite** (build `npm run build`, salida `dist`).
3. *Environment Variables:* `VITE_API_URL` = `https://<DOMINIO_DEL_BACKEND>/api/v1`.
4. *Deploy*. Cada push a `main` vuelve a desplegar solo.
5. Agregar la URL de Vercel (ej. `https://lima-segura.vercel.app`) a `WEB_URL` en el `.env` del backend para que CORS la acepte.

`vercel.json` redirige todas las rutas a `index.html`, para que funcionen las rutas de React Router al recargar (`/reportes`, `/incidents/12`…).

Para compilar localmente: `npm run build` (genera `dist/`) y `npm run preview` para revisarlo.

---

## 👥 Equipo y coevaluación

Proyecto del curso **CS 2031 - Desarrollo Basado en Plataformas**, UTEC.

| Integrante | Aportes principales | Participación |
|---|---|---|
| Kamilo Alfonso Neyra Chipana | Líder; web (React) y UI/UX; integración backend–web; reportes ciudadanos y confirmaciones; seguridad; documentación | 100 % |
| Jasyr Arnaldo Valdez Parra | Ingesta de noticias con IA (Gemini); filtros y mapa de calor; mobile | 100 % |
| Elías Emanuel Paz Raymondi | Mobile (Expo) | 100 % |
| **Total** | | **100 %** |

El trabajo se organiza con ramas por funcionalidad y Pull Requests hacia `main`, que está protegida.

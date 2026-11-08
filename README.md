# 🛡️ Lima Segura - Frontend Web & Radar Delictivo en Tiempo Real

Aplicación web desarrollada en **React 19**, **TypeScript** y **Vite** para la plataforma **Lima Segura**. Ofrece un centro de comando y visualización geoespacial de delitos e incidentes en Lima Metropolitana y el Callao, integrando mapas de calor, cálculo de riesgo perimetral con GPS y módulos de seguridad ciudadana.

---

## ✨ Características y Vistas Implementadas

### 1. Dashboard Situacional (`/`)
* **Mapa de Calor Dinámico:** Renderizado en **Leaflet** con capas de mapa oscuro (*Esri World Dark Canvas*), satelital y callejero.
* **Evaluación de Riesgo en tu Ubicación:** Cálculo en vivo (0 a 100) del índice de amenaza perimetral mediante la fórmula de Haversine contra los puntos de delito cercanos.
* **Solicitud de Ubicación GPS:** Detección de coordenadas HTML5 y geocodificación inversa para ubicar la posición exacta del usuario en el mapa con un radar pulsante.
* **Analítica Diaria:** Gráfica de distribución de riesgo por franja horaria (con pico crítico 18:00 - 22:00), donas de categorías delictivas y ranking de zonas de mayor peligrosidad.
* **Botón de Reporte Rápido:** Modal interactivo para que los ciudadanos reporten incidentes en tiempo real.

### 2. Mapa de Riesgo Integral (`/mapa`)
* Vista de mapa a pantalla completa con controles de filtros por los 43 distritos de Lima y Callao.
* Selector de capas cartográficas y visor de expediente detallado al seleccionar cualquier marcador de delito.

### 3. Centro de Reportes y Expedientes (`/reportes`)
* Directorio completo de incidentes extraídos por el motor de IA y denuncias ciudadanas.
* Filtros por tipo de delito (Sicariato, Asalto, Extorsión, Microcomercialización, etc.), estado de verificación y distrito.
* Expediente modal de inteligencia con fragmentos periodísticos y fuentes originales auditadas.

### 4. Centro de Notificaciones & Perímetro de Alerta (`/alertas`)
* Control deslizante para calibrar el radio perimetral de seguridad (100 m a 3 km).
* Activación de advertencias acústicas (Web Audio API) ante homicidios o balaceras cercanas.
* Simulador de alertas tempranas push.

### 5. Histórico y Curva de Decaimiento (`/historico`)
* Seguimiento de la reducción delictiva a través de la fórmula de decaimiento temporal exponencial ($\lambda = 0.05/\text{día}$).
* Tablas comparativas de evolución mensual y exportador de datos en formato **CSV**.

### 6. Analítica Espacio-Temporal (`/estadisticas`)
* Ranking distrital de densidad delictiva (Cercado de Lima, SJL, Callao, SMP, La Victoria, etc.).
* Métricas de rendimiento y precisión del modelo de Inteligencia Artificial (91.4% de precisión NLP).

### 7. Red Comunitaria de Seguridad (`/comunidad`)
* Tablón de alertas vecinales en tiempo real con sistema de validación y votos ciudadanos.
* Directorio de patrullaje coordinado con serenazgos y juntas vecinales distritales.

### 8. Configuración del Sistema (`/configuracion`)
* Ajustes de alta precisión GPS, preferencia de tema visual, intervalo de refresco automático y perfil de usuario.

### 9. Asistencia & Centrales de Emergencia (`/ayuda`)
* Marcación directa a centrales de auxilio: **PNP 105**, **Bomberos 116**, **SAMU 106**, **Línea 100** y Serenazgo de Lima.
* Guía de funcionamiento de la plataforma y protocolos de seguridad en zonas rojas.

### 10. Consola de Administración (`/admin` - Requiere rol `ADMIN`)
* Monitoreo de corridas del pipeline de ingesta (cada 5 minutos).
* Botón de disparo forzado de ingesta inmediata (`POST /api/v1/admin/ingestion/trigger-all`).
* Auditoría de noticias y cola de moderación de incidentes.

---

## 🛠️ Stack Tecnológico

* **Frontend Library:** React 19 + TypeScript
* **Build Tool:** Vite 8
* **Estilos:** Tailwind CSS 3
* **Mapas Geoespaciales:** Leaflet & React-Leaflet
* **Iconografía:** Lucide React
* **Cliente HTTP:** Axios con interceptores de autenticación JWT y manejo centralizado de errores
* **Navegación:** React Router 7

---

## ⚙️ Instalación y Ejecución en Local

### Prerrequisitos
* **Node.js** v18 o superior
* **npm**

### Pasos
1. Entrar al directorio del frontend:
   ```bash
   cd lima-segura-web
   ```
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```
4. Abrir en el navegador: `http://localhost:5173`.

### Compilación para Producción
```bash
npm run build
```

---

## 👥 Equipo y Autoría
Proyecto desarrollado para el curso **Desarrollo Basado en Plataformas** (UTEC).
* **Contribuidor:** Jasyr Valdez (`jasyr.valdez@utec.edu.pe`)

import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './routes/ProtectedRoute'
import Spinner from './components/Spinner'
import MainLayout from './layouts/MainLayout'

const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const HomePage = lazy(() => import('./pages/HomePage'))
const MapRiskPage = lazy(() => import('./pages/MapRiskPage'))
const ReportsPage = lazy(() => import('./pages/ReportsPage'))
const AlertsPage = lazy(() => import('./pages/AlertsPage'))
const HistoryPage = lazy(() => import('./pages/HistoryPage'))
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'))
const CommunityPage = lazy(() => import('./pages/CommunityPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const HelpPage = lazy(() => import('./pages/HelpPage'))
const IncidentsPage = lazy(() => import('./pages/IncidentsPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

export default function App() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
          <Spinner />
        </div>
      }
    >
      <Routes>
        {/* Auth routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Public & Application routes with MainLayout */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/mapa" element={<MapRiskPage />} />
          <Route path="/reportes" element={<ReportsPage />} />
          <Route path="/alertas" element={<AlertsPage />} />
          <Route path="/historico" element={<HistoryPage />} />
          <Route path="/estadisticas" element={<AnalyticsPage />} />
          <Route path="/comunidad" element={<CommunityPage />} />
          <Route path="/configuracion" element={<SettingsPage />} />
          <Route path="/ayuda" element={<HelpPage />} />
          <Route path="/incidents" element={<IncidentsPage />} />

          {/* Legacy redirects */}
          <Route path="/reports" element={<Navigate to="/reportes" replace />} />
          <Route path="/reports/*" element={<Navigate to="/reportes" replace />} />

          {/* Admin Command Center (Requires ADMIN role) */}
          <Route element={<ProtectedRoute adminOnly />}>
            <Route path="/admin" element={<AdminPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}

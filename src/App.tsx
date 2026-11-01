import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import ProtectedRoute from './routes/ProtectedRoute'
import Spinner from './components/Spinner'
import MainLayout from './layouts/MainLayout'

const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const HomePage = lazy(() => import('./pages/HomePage'))
const ReportsPage = lazy(() => import('./pages/ReportsPage'))
const ReportDetailPage = lazy(() => import('./pages/ReportDetailPage'))
const CreateReportPage = lazy(() => import('./pages/CreateReportPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

export default function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/reports/new" element={<CreateReportPage />} />
            <Route path="/reports/:id" element={<ReportDetailPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}
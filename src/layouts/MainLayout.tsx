import { Outlet, useLocation } from 'react-router-dom'
import TopBar from '../components/TopBar'

export default function MainLayout() {
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 selection:bg-red-500 selection:text-white">
      {!isHome && <TopBar />}
      <main className="w-full">
        <Outlet />
      </main>
    </div>
  )
}

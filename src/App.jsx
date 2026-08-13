import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import Leaderboard from './pages/Leaderboard.jsx'
import LoadingScreen from './components/ui/LoadingScreen.jsx'

// Code-split admin bundle — never loads on public route
const AdminLogin = lazy(() => import('./pages/AdminLogin.jsx'))
const AdminPanel = lazy(() => import('./pages/AdminPanel.jsx'))

export default function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Public route — read-only, no admin bundle loaded */}
        <Route path="/" element={<Leaderboard />} />

        {/* Admin routes — lazy loaded, completely separate bundle */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminPanel />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

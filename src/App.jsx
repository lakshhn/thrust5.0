import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import OfflineStandby from './pages/OfflineStandby.jsx'
import LoadingScreen from './components/ui/LoadingScreen.jsx'

/**
 * Site status control:
 * Set IS_OFFLINE = true to temporarily shut down the public leaderboard.
 * Set IS_OFFLINE = false to restore live leaderboard.
 */
export const IS_OFFLINE = true

// Code-split routes
const Leaderboard = lazy(() => import('./pages/Leaderboard.jsx'))
const AdminLogin = lazy(() => import('./pages/AdminLogin.jsx'))
const AdminPanel = lazy(() => import('./pages/AdminPanel.jsx'))

export default function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Public route — displays offline maintenance page during temporary shutdown */}
        <Route path="/" element={IS_OFFLINE ? <OfflineStandby /> : <Leaderboard />} />

        {/* Admin routes — protected behind authentication */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminPanel />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

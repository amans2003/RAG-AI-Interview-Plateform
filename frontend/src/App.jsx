/**
 * App.jsx — Root component with routing and auth protection.
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './hooks/useAuth'
import { ROUTES } from './utils/constants'
import { Loader } from './components/common/index'

// Pages
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import ResumePage from './pages/ResumePage'
import JobsPage from './pages/JobsPage'
import AnalysisPage from './pages/AnalysisPage'
import InterviewPage from './pages/InterviewPage'
import ChatPage from './pages/ChatPage'
import ProfilePage from './pages/ProfilePage'

/**
 * ProtectedRoute — redirects to /login if not authenticated.
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><Loader text="Loading..." /></div>
  if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} replace />
  return children
}

/**
 * PublicRoute — redirects to /dashboard if already authenticated.
 */
function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><Loader text="Loading..." /></div>
  if (isAuthenticated) return <Navigate to={ROUTES.DASHBOARD} replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path={ROUTES.HOME} element={<PublicRoute><LandingPage /></PublicRoute>} />
      <Route path={ROUTES.LOGIN} element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path={ROUTES.REGISTER} element={<PublicRoute><RegisterPage /></PublicRoute>} />

      {/* Protected */}
      <Route path={ROUTES.DASHBOARD} element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path={ROUTES.RESUME} element={<ProtectedRoute><ResumePage /></ProtectedRoute>} />
      <Route path={ROUTES.JOBS} element={<ProtectedRoute><JobsPage /></ProtectedRoute>} />
      <Route path={ROUTES.ANALYSIS} element={<ProtectedRoute><AnalysisPage /></ProtectedRoute>} />
      <Route path={`${ROUTES.ANALYSIS}/:id`} element={<ProtectedRoute><AnalysisPage /></ProtectedRoute>} />
      <Route path={ROUTES.INTERVIEW} element={<ProtectedRoute><InterviewPage /></ProtectedRoute>} />
      <Route path={ROUTES.CHAT} element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
      <Route path={ROUTES.PROFILE} element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

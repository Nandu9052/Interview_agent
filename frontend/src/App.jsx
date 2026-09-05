import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Sidebar from './components/Sidebar'
import Landing from './pages/Landing'
import { Login, Register } from './pages/Auth'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import StartInterview from './pages/StartInterview'
import InterviewRoom from './pages/InterviewRoom'
import Report from './pages/Report'
import Analytics from './pages/Analytics'
import QuestionBank from './pages/QuestionBank'
import History from './pages/History'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import RAGPreview from './pages/RAGPreview'

function ProtectedLayout({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
      <span className="spinner spinner-lg" />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        {children}
      </div>
    </div>
  )
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/onboarding" element={<ProtectedLayout><Onboarding /></ProtectedLayout>} />

      <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
      <Route path="/preview" element={<ProtectedLayout><RAGPreview /></ProtectedLayout>} />
      <Route path="/interview/start" element={<ProtectedLayout><StartInterview /></ProtectedLayout>} />
      <Route path="/interview/:sessionId" element={<ProtectedLayout><InterviewRoom /></ProtectedLayout>} />
      <Route path="/interview/:sessionId/report" element={<ProtectedLayout><Report /></ProtectedLayout>} />
      <Route path="/analytics" element={<ProtectedLayout><Analytics /></ProtectedLayout>} />
      <Route path="/questions" element={<ProtectedLayout><QuestionBank /></ProtectedLayout>} />
      <Route path="/history" element={<ProtectedLayout><History /></ProtectedLayout>} />
      <Route path="/profile" element={<ProtectedLayout><Profile /></ProtectedLayout>} />
      <Route path="/settings" element={<ProtectedLayout><Settings /></ProtectedLayout>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              fontSize: '13.5px',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

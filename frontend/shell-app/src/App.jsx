import { Suspense, lazy, Component } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { Box, CircularProgress, Typography, Button, Alert } from '@mui/material'
import Navbar from './components/Navbar.jsx'
import Sidebar from './components/Sidebar.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import LandingPage from './pages/LandingPage.jsx'

// ── Lazy-load MFEs via Module Federation ──
const OnboardingApp = lazy(() =>
  import('onboarding/OnboardingApp').catch(() => {
    throw new Error('Onboarding MFE failed to load')
  })
)

const DashboardApp = lazy(() =>
  import('dashboard/DashboardApp').catch(() => {
    throw new Error('Dashboard MFE failed to load')
  })
)

// ── MFE loading fallback ──
function MFELoader() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: 2,
      }}
    >
      <CircularProgress
        size={44}
        sx={{ color: '#6C63FF', filter: 'drop-shadow(0 0 12px rgba(108,99,255,0.5))' }}
      />
      <Typography variant="body2" color="text.secondary">
        Loading module…
      </Typography>
    </Box>
  )
}

// ── MFE error boundary ──
class MFEErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 4, maxWidth: 500, mx: 'auto', mt: 6 }}>
          <Alert
            severity="error"
            sx={{
              background: 'rgba(255, 77, 106, 0.08)',
              border: '1px solid rgba(255, 77, 106, 0.25)',
              borderRadius: 3,
            }}
            action={
              <Button color="inherit" size="small" onClick={() => window.location.reload()}>
                Retry
              </Button>
            }
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
              Module failed to load
            </Typography>
            <Typography variant="body2">
              {this.props.moduleName} could not be loaded. Make sure the remote server is running.
            </Typography>
          </Alert>
        </Box>
      )
    }
    return this.props.children
  }
}

// ── Auto-redirect authenticated users ──
function AuthRedirect() {
  const { isAuthenticated, isLoading, user } = useAuth0()
  const navigate = useNavigate()

  if (isLoading) return <MFELoader />

  if (isAuthenticated && user) {
    const roles = user['https://pranaybank.com/roles'] || []
    return <Navigate to={roles.includes('ADMIN') ? '/dashboard' : '/onboarding'} replace />
  }

  return <LandingPage />
}

// ── Root App ──
export default function App() {
  const { isAuthenticated, user } = useAuth0()
  const roles = user?.['https://pranaybank.com/roles'] || []
  const isAdmin = roles.includes('ADMIN')

  return (
    <Box className="app-shell">
      {isAuthenticated && <Navbar />}

      <Box className="app-body">
        {/* Sidebar — admin only */}
        {isAuthenticated && isAdmin && <Sidebar />}

        {/* Main content */}
        <Box
          className="app-content"
          sx={{
            ml: isAuthenticated && isAdmin ? '240px' : 0,
            mt: isAuthenticated ? '64px' : 0,
          }}
        >
          <Routes>
            {/* Public landing / auto-redirect */}
            <Route path="/" element={<AuthRedirect />} />

            {/* Onboarding MFE — USER role only */}
            <Route
              path="/onboarding/*"
              element={
                <ProtectedRoute allowedRoles={['USER']}>
                  <MFEErrorBoundary moduleName="Onboarding App">
                    <Suspense fallback={<MFELoader />}>
                      <OnboardingApp />
                    </Suspense>
                  </MFEErrorBoundary>
                </ProtectedRoute>
              }
            />

            {/* Dashboard MFE — ADMIN role only */}
            <Route
              path="/dashboard/*"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <MFEErrorBoundary moduleName="Dashboard App">
                    <Suspense fallback={<MFELoader />}>
                      <DashboardApp />
                    </Suspense>
                  </MFEErrorBoundary>
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Box>
      </Box>
    </Box>
  )
}

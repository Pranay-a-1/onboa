import { lazy, Suspense, useEffect, useMemo } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { Box, CircularProgress, Typography } from '@mui/material'
import { Routes, Route, Navigate } from 'react-router-dom'

import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './pages/LandingPage'

/**
 * App.jsx — Shell layout integration for PranayBank.
 *
 * TASK-10 scope: Replaces TASK-9 placeholder routes with full auth + routing:
 *   - LandingPage      (unauthenticated visitors)
 *   - ProtectedRoute   (role-based access guards)
 *   - Lazy MFEs        (OnboardingApp from onboarding remote, DashboardApp from dashboard remote)
 *
 * DOM tree (authenticated):
 *
 *   .shell-layout  (flex row)
 *   ├── <Sidebar />          (240px, admin only)
 *   └── .shell-right         (flex column, flex: 1)
 *       ├── <Navbar />
 *       └── .shell-content   (scrollable, 32px padding)
 *           └── <Routes />   ← lazy MFEs rendered here
 *
 * Auth0 states handled:
 *   1. isLoading       → full-screen spinner
 *   2. !isAuthenticated → <LandingPage />
 *   3. isAuthenticated  → shell layout with role-guarded routes
 */

// ─── Lazy MFE imports ───────────────────────────────────────────────────────
// React.lazy() + dynamic import() means the MFE bundle is only fetched when
// the user actually navigates to that route — not on initial page load.
// This is critical for Module Federation: the remoteEntry.js for each MFE
// is resolved at runtime from the URLs configured in vite.config.js.
//
// These import paths must match the `name` exposed in each remote's
// vite.config.js federation plugin:
//   onboarding remote exposes './OnboardingApp'  → import('onboarding/OnboardingApp')
//   dashboard  remote exposes './DashboardApp'   → import('dashboard/DashboardApp')
const OnboardingApp = lazy(() => import('onboarding/OnboardingApp'))
const DashboardApp = lazy(() => import('dashboard/DashboardApp'))

function App() {
  const { isLoading, isAuthenticated, user } = useAuth0()
  const rolesClaim = user?.['https://pranaybank.com/roles']
  const roles = useMemo(
    () => (Array.isArray(rolesClaim) ? rolesClaim : []),
    [rolesClaim],
  )
  const normalizedRoles = useMemo(
    () => roles.map((role) => String(role).toLowerCase()),
    [roles],
  )
  const isAdmin = roles.includes('admin')

  useEffect(() => {
    if (!import.meta.env.DEV || !isAuthenticated) return

    console.log('[AuthDebug][App] Signed-in role evaluation', {
      email: user?.email ?? null,
      rolesClaimRaw: rolesClaim ?? null,
      normalizedRoles,
      isAdmin,
      rootRedirectTarget: isAdmin ? '/dashboard' : '/onboarding',
    })
  }, [isAuthenticated, isAdmin, normalizedRoles, rolesClaim, user?.email])

  // ─── State 1: Auth0 SDK initialising ─────────────────────────────────
  // Auth0 checks the existing session/cookie on every page load.
  // We wait for this to resolve before making any routing decisions —
  // otherwise a logged-in user gets briefly redirected to LandingPage
  // on every refresh (flash of unauthenticated content).
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: 'background.default',
          gap: 2,
        }}
      >
        <CircularProgress size={48} thickness={4} />
        <Typography variant="body2" color="text.secondary" sx={{ opacity: 0.5 }}>
          Initialising session…
        </Typography>
      </Box>
    )
  }

  // ─── State 2: Not authenticated → show public landing page ───────────
  // The LandingPage handles its own "Get Started" and "Sign In" CTAs,
  // both delegating to Auth0's loginWithRedirect().
  if (!isAuthenticated) {
    return <LandingPage />
  }

  // ─── State 3: Authenticated — render the full shell ──────────────────

  // Extract the custom role claim injected by the Auth0 post-login Action.
  // The namespace 'https://pranaybank.com/roles' is required by Auth0 rules —
  // custom claims must be namespaced with a URL to avoid collisions with
  // standard OIDC claims.
  return (
    /*
     * .shell-layout — the outermost flex-row defined in index.css
     * Produces: [Sidebar 240px | Right column flex:1]
     */
    <Box className="shell-layout">

      {/* Sidebar is purely a nav component — role guard lives here in the parent */}
      {isAdmin && <Sidebar />}

      <Box className="shell-right">
        <Navbar />

        <Box className="shell-content">
          {/*
           * Suspense wraps the lazy MFEs. While the remote bundle is being
           * fetched over the network, the fallback spinner is shown.
           * This is the normal loading state for Module Federation remotes.
           *
           * Error boundary (MfeBoundary) catches network failures or build
           * errors from the remote — so a broken MFE shows a graceful
           * error card instead of a blank white screen or uncaught exception.
           */}
          <Suspense fallback={<MfeLoadingSpinner />}>
            <Routes>

              {/*
               * / (root) — Auto-redirect based on role.
               * An admin landing on / goes straight to their dashboard.
               * A merchant goes straight to their onboarding wizard.
               * This handles both post-login redirect and direct URL visits.
               */}
              <Route
                path="/"
                element={<Navigate to={isAdmin ? '/dashboard' : '/onboarding'} replace />}
              />

              {/*
               * /onboarding/* — USER only
               *
               * ProtectedRoute checks:
               *   1. isAuthenticated (already guaranteed here, but ProtectedRoute
               *      handles the SDK-loading edge case internally)
               *   2. role === 'user'
               *
               * redirectTo="/onboarding" is not needed here because the outer
               * isAuthenticated check already handled that. The redirectTo here
               * catches the edge case of an ADMIN navigating to /onboarding —
               * they get sent to /dashboard instead.
               */}
              <Route
                path="/onboarding/*"
                element={
                  <ProtectedRoute allowedRoles={['user']} redirectTo="/dashboard">
                    <MfeBoundary name="Onboarding">
                      <OnboardingApp />
                    </MfeBoundary>
                  </ProtectedRoute>
                }
              />

              {/*
               * /dashboard/* — ADMIN only
               *
               * A non-admin (merchant) navigating to /dashboard gets redirected
               * to /onboarding by ProtectedRoute.
               */}
              <Route
                path="/dashboard/*"
                element={
                  <ProtectedRoute allowedRoles={['admin']} redirectTo="/onboarding">
                    <MfeBoundary name="Dashboard">
                      <DashboardApp />
                    </MfeBoundary>
                  </ProtectedRoute>
                }
              />

              {/*
               * Catch-all — any unknown URL gets role-based redirect.
               * Prevents 404-style blank screens on direct URL access.
               */}
              <Route
                path="*"
                element={<Navigate to={isAdmin ? '/dashboard' : '/onboarding'} replace />}
              />

            </Routes>
          </Suspense>
        </Box>
      </Box>
    </Box>
  )
}

// ─── MfeLoadingSpinner ─────────────────────────────────────────────────────
/**
 * Shown by <Suspense> while a lazy MFE bundle is being fetched.
 * Rendered inside .shell-content so the Navbar and Sidebar stay visible
 * during the load — a much smoother UX than loading the entire page.
 */
function MfeLoadingSpinner() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        minHeight: '60vh',
        gap: 2,
      }}
    >
      <CircularProgress size={40} thickness={4} sx={{ color: 'primary.main' }} />
      <Typography variant="body2" color="text.secondary" sx={{ opacity: 0.5 }}>
        Loading…
      </Typography>
    </Box>
  )
}

// ─── MfeBoundary ──────────────────────────────────────────────────────────
/**
 * A simple React Error Boundary wrapping each lazy MFE.
 *
 * Why: Module Federation remotes can fail to load at runtime if:
 *   - The remote dev server is not running (local dev)
 *   - The remote's build URL is wrong (misconfigured vite.config.js)
 *   - Network failure when fetching the remote bundle
 *
 * Without this boundary, any of the above causes a full React tree crash
 * (blank white screen). With it, only the affected MFE shows an error card
 * while the shell (Navbar, Sidebar) remains fully functional.
 *
 * name prop — used in the error message so the developer knows WHICH
 * remote failed, which speeds up diagnosis significantly.
 */
import { Component } from 'react'
import { Alert, AlertTitle } from '@mui/material'

class MfeBoundary extends Component {
  constructor(props) {
    super(props)
    // hasError tracks whether the boundary has caught an error.
    // When true, the fallback UI is rendered instead of children.
    this.state = { hasError: false, errorMessage: '' }
  }

  // getDerivedStateFromError is called when a child component throws.
  // We store hasError = true so the next render shows the fallback.
  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error?.message ?? 'Unknown error' }
  }

  // componentDidCatch is the place for side effects like logging.
  // In production this would send to Sentry / Datadog.
  componentDidCatch(error, info) {
    console.error(`[MfeBoundary:${this.props.name}] Failed to load MFE:`, error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 4, maxWidth: 560, mx: 'auto', mt: 6 }}>
          <Alert
            severity="error"
            variant="outlined"
            sx={{
              backgroundColor: 'rgba(239,68,68,0.05)',
              borderColor: 'rgba(239,68,68,0.3)',
            }}
          >
            <AlertTitle sx={{ fontWeight: 700 }}>
              Failed to load {this.props.name}
            </AlertTitle>
            <Typography variant="body2" sx={{ mb: 1 }}>
              The {this.props.name} module could not be loaded. This usually means the
              remote dev server is not running or the build URL is misconfigured.
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.6, fontFamily: 'monospace' }}>
              {this.state.errorMessage}
            </Typography>
          </Alert>
        </Box>
      )
    }

    // No error — render children normally
    return this.props.children
  }
}

export default App

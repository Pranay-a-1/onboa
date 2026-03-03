import { useAuth0 } from '@auth0/auth0-react'
import { Navigate } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'

/**
 * ProtectedRoute — A declarative route guard for Auth0 + role-based access.
 *
 * Usage:
 *   <ProtectedRoute allowedRoles={['admin']}>
 *     <AdminPage />
 *   </ProtectedRoute>
 *
 * Props:
 *   children      — The component(s) to render when access is granted
 *   allowedRoles  — Array of role strings that are permitted (e.g. ['admin'], ['user'])
 *                   If empty or omitted → any authenticated user is allowed
 *   redirectTo    — Where to send unauthorized users (default: '/')
 */
function ProtectedRoute({ children, allowedRoles = [], redirectTo = '/' }) {
  const { isLoading, isAuthenticated, user } = useAuth0()

  // While Auth0 SDK initialises, show a centred spinner.
  // This prevents a flash redirect on page refresh when the token is still
  // being validated. Without this guard, a logged-in user refreshing
  // /dashboard would momentarily see the landing page.
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: 'background.default',
        }}
      >
        <CircularProgress size={40} thickness={4} />
      </Box>
    )
  }

  // Not logged in at all → redirect to wherever the caller says
  // (App.jsx will point this to '/' which renders <LandingPage />)
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  // If specific roles are required, check the custom Auth0 namespace claim.
  // This claim is injected by the Auth0 Action (post-login hook) and looks like:
  //   { "https://pranaybank.com/roles": ["admin"] }
  if (allowedRoles.length > 0) {
    const userRoles = user?.['https://pranaybank.com/roles'] ?? []
    const hasRole = allowedRoles.some((role) => userRoles.includes(role))

    // Authenticated but wrong role → send to redirectTo
    // In App.jsx: admin trying /onboarding → redirectTo='/dashboard'
    //             user trying /dashboard   → redirectTo='/onboarding'
    if (!hasRole) {
      return <Navigate to={redirectTo} replace />
    }
  }

  // Access granted — render the protected content
  return children
}

export default ProtectedRoute

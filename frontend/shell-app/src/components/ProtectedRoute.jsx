import { useAuth0 } from '@auth0/auth0-react'
import { useEffect } from 'react'
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
  const rolesClaim = user?.['https://pranaybank.com/roles']
  const userRoles = Array.isArray(rolesClaim) ? rolesClaim : []
  const normalizedUserRoles = userRoles.map((role) => String(role).toLowerCase())
  const normalizedAllowedRoles = allowedRoles.map((role) => String(role).toLowerCase())
  const allowedRolesKey = allowedRoles.join('|')
  const userRolesKey = userRoles.join('|')
  const normalizedAllowedRolesKey = normalizedAllowedRoles.join('|')
  const normalizedUserRolesKey = normalizedUserRoles.join('|')
  const hasRoleNormalized =
    normalizedAllowedRoles.length === 0 ||
    normalizedAllowedRoles.some((role) => normalizedUserRoles.includes(role))
  const hasRole = allowedRoles.length === 0 || allowedRoles.some((role) => userRoles.includes(role))

  useEffect(() => {
    if (!import.meta.env.DEV || isLoading || !isAuthenticated) return

    const allowedRolesForLog = allowedRolesKey ? allowedRolesKey.split('|') : []
    const normalizedAllowedRolesForLog = normalizedAllowedRolesKey
      ? normalizedAllowedRolesKey.split('|')
      : []
    const normalizedUserRolesForLog = normalizedUserRolesKey
      ? normalizedUserRolesKey.split('|')
      : []

    console.log('[AuthDebug][ProtectedRoute] Guard evaluation', {
      path: window.location.pathname,
      allowedRoles: allowedRolesForLog,
      rolesClaimRaw: rolesClaim ?? null,
      normalizedAllowedRoles: normalizedAllowedRolesForLog,
      normalizedUserRoles: normalizedUserRolesForLog,
      hasRole,
      hasRoleNormalized,
      unauthorizedRedirectTo: hasRole ? null : redirectTo,
    })
  }, [
    allowedRoles,
    hasRole,
    isAuthenticated,
    isLoading,
    redirectTo,
    rolesClaim,
    hasRoleNormalized,
    allowedRolesKey,
    userRolesKey,
    normalizedAllowedRolesKey,
    normalizedUserRolesKey,
  ])

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

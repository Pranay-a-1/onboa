import { useAuth0 } from '@auth0/auth0-react'
import { Navigate } from 'react-router-dom'
import { Box, CircularProgress, Typography } from '@mui/material'

/**
 * ProtectedRoute — checks Auth0 authentication and optional role-based access.
 *
 * Props:
 *   children       — component to render if authorized
 *   allowedRoles   — array of roles allowed (e.g. ['ADMIN'] or ['USER', 'ADMIN'])
 *                    if empty/undefined, only authentication is checked
 */
export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, isLoading, user } = useAuth0()

  if (isLoading) {
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
          size={48}
          sx={{
            color: '#6C63FF',
            filter: 'drop-shadow(0 0 12px rgba(108, 99, 255, 0.5))',
          }}
        />
        <Typography variant="body2" color="text.secondary">
          Authenticating…
        </Typography>
      </Box>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  if (allowedRoles.length > 0) {
    const userRoles = user?.['https://pranaybank.com/roles'] || []
    const hasRole = allowedRoles.some((role) => userRoles.includes(role))
    if (!hasRole) {
      // Redirect to appropriate home based on actual role
      const isAdmin = userRoles.includes('ADMIN')
      return <Navigate to={isAdmin ? '/dashboard' : '/onboarding'} replace />
    }
  }

  return children
}

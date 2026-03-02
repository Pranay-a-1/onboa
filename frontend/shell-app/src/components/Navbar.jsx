import { useAuth0 } from '@auth0/auth0-react'
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  Avatar,
  Button,
  IconButton,
  Tooltip,
  Chip,
  Skeleton,
} from '@mui/material'
import LogoutIcon from '@mui/icons-material/Logout'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import ShieldIcon from '@mui/icons-material/Shield'

export default function Navbar() {
  const { user, logout, isLoading } = useAuth0()

  const roles = user?.['https://pranaybank.com/roles'] || []
  const isAdmin = roles.includes('ADMIN')

  const handleLogout = () => {
    logout({ logoutParams: { returnTo: window.location.origin } })
  }

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        background: 'rgba(10, 14, 26, 0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(108, 99, 255, 0.15)',
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar sx={{ height: 64, px: { xs: 2, md: 3 } }}>
        {/* ── Logo ── */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6C63FF 0%, #00D4AA 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(108, 99, 255, 0.45)',
            }}
          >
            <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>P</Typography>
          </Box>
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                fontSize: '1.05rem',
                lineHeight: 1.1,
                background: 'linear-gradient(135deg, #6C63FF 0%, #00D4AA 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              PranayBank
            </Typography>
            <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', lineHeight: 1, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Merchant Portal
            </Typography>
          </Box>
        </Box>

        {/* ── Spacer ── */}
        <Box sx={{ flex: 1 }} />

        {/* ── User area ── */}
        {isLoading ? (
          <Skeleton variant="circular" width={36} height={36} />
        ) : user ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {/* Role chip */}
            {isAdmin && (
              <Chip
                icon={<ShieldIcon sx={{ fontSize: '0.85rem !important' }} />}
                label="Admin"
                size="small"
                sx={{
                  background: 'rgba(108, 99, 255, 0.15)',
                  border: '1px solid rgba(108, 99, 255, 0.4)',
                  color: '#9B94FF',
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  display: { xs: 'none', sm: 'flex' },
                }}
              />
            )}

            {/* User avatar + name */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 0.5 }}>
              {user.picture ? (
                <Avatar
                  src={user.picture}
                  alt={user.name}
                  sx={{ width: 34, height: 34, border: '2px solid rgba(108, 99, 255, 0.4)' }}
                />
              ) : (
                <Avatar
                  sx={{
                    width: 34,
                    height: 34,
                    background: 'linear-gradient(135deg, #6C63FF, #4B44CC)',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                  }}
                >
                  {user.name?.[0]?.toUpperCase() || <AccountCircleIcon fontSize="small" />}
                </Avatar>
              )}
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, lineHeight: 1.2, color: 'text.primary' }}>
                  {user.name || user.email?.split('@')[0]}
                </Typography>
                <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', lineHeight: 1 }}>
                  {user.email}
                </Typography>
              </Box>
            </Box>

            {/* Logout */}
            <Tooltip title="Sign out">
              <IconButton
                id="logout-btn"
                onClick={handleLogout}
                size="small"
                sx={{
                  color: 'text.secondary',
                  '&:hover': { color: '#FF4D6A', background: 'rgba(255, 77, 106, 0.1)' },
                }}
              >
                <LogoutIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        ) : null}
      </Toolbar>
    </AppBar>
  )
}

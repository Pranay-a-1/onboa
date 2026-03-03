import { useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  Avatar,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Tooltip,
} from '@mui/material'
import {
  KeyboardArrowDown as ArrowDownIcon,
  Shield as ShieldIcon,
} from '@mui/icons-material'

/**
 * Navbar.jsx — Fixed top navigation bar for the PranayBank shell app.
 *
 * Layout (left → right):
 *   [Brand Logo + Wordmark]   [flex spacer]   [Role Chip]   [Avatar + Dropdown]
 *
 * Responsibilities:
 *   - Displays the PranayBank brand mark
 *   - Shows the authenticated user's avatar (falls back to initials)
 *   - Shows the user's role (USER or ADMIN) as a coloured chip
 *   - Provides a user dropdown with profile info and logout action
 *
 * Auth0 integration:
 *   - `user` — the decoded ID token payload (name, email, picture)
 *   - `logout` — clears session and redirects to Auth0 /logout
 *   - Role is read from the custom claim namespace set by Auth0's Login Action
 */
function Navbar() {
  // Auth0 hook — available because Auth0Provider wraps this component in main.jsx
  const { user, logout } = useAuth0()

  // Controls the avatar dropdown menu (open = DOM anchor element, closed = null)
  const [menuAnchor, setMenuAnchor] = useState(null)

  // ─── Role Extraction ────────────────────────────────────────────────────
  // Auth0 Login Action injects roles into this custom namespace claim.
  // If the claim is absent (dev mode / no action configured), defaults to 'user'.
  const roles = user?.['https://pranaybank.com/roles'] ?? []
  const isAdmin = roles.includes('admin')
  const displayRole = isAdmin ? 'ADMIN' : 'USER'

  // ─── Avatar Fallback ────────────────────────────────────────────────────
  // Auth0 provides a `picture` URL from the IdP (Google, GitHub, etc.).
  // If unavailable, we compute initials from the user's name as a fallback.
  const avatarSrc = user?.picture ?? null
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'PB'

  // ─── Handlers ───────────────────────────────────────────────────────────
  const openMenu = (event) => setMenuAnchor(event.currentTarget)
  const closeMenu = () => setMenuAnchor(null)

  const handleLogout = () => {
    closeMenu()
    // returnTo sends the user back to the shell root after Auth0 clears the session
    logout({ logoutParams: { returnTo: window.location.origin } })
  }

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        // Use surface color (slightly lighter than base canvas) for the navbar
        backgroundColor: 'background.paper',
        // Subtle bottom border using our design-token border color
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        height: 'var(--navbar-h)',           // consumed from index.css token
        justifyContent: 'center',
        // Thin violet glow line at the very bottom — a premium accent
        boxShadow: '0 1px 0 rgba(108, 99, 255, 0.3)',
        zIndex: (theme) => theme.zIndex.appBar,
      }}
    >
      <Toolbar
        disableGutters
        sx={{
          px: 3,
          height: '100%',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {/* ── Brand Section (left) ─────────────────────────────────────── */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* Shield icon acts as the brand mark */}
          <ShieldIcon
            sx={{
              fontSize: 28,
              // Violet-to-lavender gradient on the icon via filter isn't possible,
              // so we use the primary color directly. Gradient is applied on text.
              color: 'primary.main',
              filter: 'drop-shadow(0 0 6px rgba(108, 99, 255, 0.5))',
            }}
          />
          {/* Gradient wordmark — uses .gradient-text from index.css */}
          <Typography
            variant="h6"
            component="span"
            fontWeight={800}
            letterSpacing="-0.5px"
            className="gradient-text"
            sx={{ userSelect: 'none' }}
          >
            PranayBank
          </Typography>
          {/* Subtle secondary label */}
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              opacity: 0.5,
              ml: 0.5,
              display: { xs: 'none', sm: 'inline' }, // hidden on very small screens
            }}
          >
            Merchant Portal
          </Typography>
        </Box>

        {/* ── Spacer — pushes right section to the far right ───────────── */}
        <Box sx={{ flex: 1 }} />

        {/* ── Right Section ────────────────────────────────────────────── */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>

          {/* Role Chip — clearly shows whether the logged-in user is ADMIN or USER */}
          <Chip
            label={displayRole}
            size="small"
            sx={{
              /*
               * ADMIN → warm violet with glow; USER → subtle grey
               * This makes it immediately obvious which portal you're in
               * without checking your mental model.
               */
              backgroundColor: isAdmin
                ? 'rgba(108, 99, 255, 0.2)'
                : 'rgba(100, 116, 139, 0.2)',
              color: isAdmin ? 'primary.main' : 'text.secondary',
              border: `1px solid ${isAdmin ? 'rgba(108, 99, 255, 0.5)' : 'rgba(100, 116, 139, 0.3)'}`,
              fontWeight: 700,
              fontSize: '0.65rem',
              letterSpacing: '0.08em',
              height: 22,
            }}
          />

          {/* Avatar + dropdown trigger */}
          <Tooltip title="Account options" arrow>
            <Button
              onClick={openMenu}
              disableRipple={false}
              sx={{
                p: 0,
                minWidth: 0,
                gap: 1,
                color: 'text.primary',
                textTransform: 'none',
                '&:hover': { backgroundColor: 'transparent' },
              }}
            >
              <Avatar
                src={avatarSrc}
                alt={user?.name ?? 'User'}
                sx={{
                  width: 36,
                  height: 36,
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  // Violet ring around avatar — a premium detail
                  backgroundColor: 'primary.dark',
                  border: '2px solid',
                  borderColor: 'primary.main',
                  boxShadow: '0 0 0 2px rgba(108, 99, 255, 0.25)',
                  transition: 'box-shadow 0.2s ease',
                  '&:hover': {
                    boxShadow: '0 0 0 3px rgba(108, 99, 255, 0.5)',
                  },
                }}
              >
                {/* Rendered only when no picture src available */}
                {!avatarSrc && initials}
              </Avatar>
              <ArrowDownIcon
                sx={{
                  fontSize: 16,
                  color: 'text.secondary',
                  transition: 'transform 0.2s ease',
                  // Rotate arrow to indicate open state
                  transform: menuAnchor ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              />
            </Button>
          </Tooltip>
        </Box>
      </Toolbar>

      {/* ── User Dropdown Menu ─────────────────────────────────────────── */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={closeMenu}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          elevation: 4,
          sx: {
            mt: 1,
            minWidth: 220,
            backgroundColor: 'background.paper',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 2,
            overflow: 'visible',
            // Subtle glow on the dropdown that matches the navbar accent
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(108, 99, 255, 0.15)',
          },
        }}
      >
        {/* Profile summary — not clickable, just informational */}
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" fontWeight={700} color="text.primary">
            {user?.name ?? 'Merchant User'}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mt: 0.25 }}
          >
            {user?.email ?? ''}
          </Typography>
        </Box>

        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)' }} />

        {/* Logout action */}
        <MenuItem
          onClick={handleLogout}
          sx={{
            py: 1.25,
            px: 2,
            color: '#EF4444',         // danger red — signals a destructive action
            transition: 'background 0.15s ease',
            '&:hover': {
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
            },
          }}
        >
          <Typography variant="body2" fontWeight={600}>
            Sign out
          </Typography>
        </MenuItem>
      </Menu>
    </AppBar>
  )
}

export default Navbar

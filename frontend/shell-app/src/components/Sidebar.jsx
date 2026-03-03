import { useLocation, useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  ListAlt as ApplicationsIcon,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material'

/**
 * Sidebar.jsx — Admin-only vertical navigation panel.
 *
 * Rendered ONLY when the authenticated user has the ADMIN role.
 * The role check itself lives in App.jsx (the parent) — this component
 * simply receives no prop to guard itself; it trusts the parent to
 * conditionally render it.
 *
 * Width is controlled by --sidebar-w CSS token (240px) defined in index.css.
 * Height fills 100vh minus the navbar height, achieved by the parent flex layout.
 *
 * Navigation:
 *   - Dashboard    → /dashboard
 *   - Applications → /dashboard/applications (filtered list view)
 *
 * The active link is highlighted using react-router-dom's useLocation()
 * to compare the current pathname against each link's path.
 */

// ─── Nav Link Definitions ─────────────────────────────────────────────────
// Centralising link definitions here (not inline in JSX) makes it trivial
// to add new admin sections later — just push to this array.
const NAV_LINKS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: <DashboardIcon fontSize="small" />,
    // exact: true means /dashboard/anything should NOT highlight this item
    exact: true,
  },
  {
    id: 'applications',
    label: 'Applications',
    path: '/dashboard/applications',
    icon: <ApplicationsIcon fontSize="small" />,
    exact: false,
  },
]

function Sidebar() {
  // useLocation gives us the current URL pathname so we can highlight
  // the active nav item without an external active-state variable.
  const location = useLocation()
  const navigate = useNavigate()

  /**
   * Determines whether a nav link is "active" (should be highlighted).
   *
   * For exact links (Dashboard): only active when pathname === link.path
   * For non-exact links (Applications): active when pathname starts with link.path
   *
   * This mirrors how React Router v6's NavLink `end` prop works,
   * but we implement it manually so we have full control over the styling.
   */
  const isActive = (link) => {
    if (link.exact) {
      return location.pathname === link.path
    }
    return location.pathname.startsWith(link.path)
  }

  return (
    <Box
      component="nav"
      className="shell-sidebar"   /* referenced by @media rule in index.css for mobile collapse */
      sx={{
        width: 'var(--sidebar-w)',       // 240px — from index.css token
        minHeight: '100%',               // fills the full height of shell-right column
        backgroundColor: 'background.paper',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,                   // sidebar must NOT shrink when content is wide
        // Subtle violet glow on the right edge — a premium accent
        boxShadow: '1px 0 0 rgba(108, 99, 255, 0.15)',
        overflowY: 'auto',
      }}
    >
      {/* ── Admin Panel Header ──────────────────────────────────────────── */}
      <Box
        sx={{
          px: 2.5,
          py: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <AdminIcon
          sx={{
            fontSize: 18,
            color: 'primary.main',
            opacity: 0.8,
          }}
        />
        <Typography
          variant="overline"
          sx={{
            color: 'text.secondary',
            fontWeight: 700,
            fontSize: '0.65rem',
            letterSpacing: '0.12em',
          }}
        >
          Admin Console
        </Typography>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.06)', mx: 1.5 }} />

      {/* ── Navigation Links ─────────────────────────────────────────────── */}
      <List disablePadding sx={{ px: 1, pt: 1, flex: 1 }}>
        {NAV_LINKS.map((link) => {
          const active = isActive(link)

          return (
            <ListItemButton
              key={link.id}
              onClick={() => navigate(link.path)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                px: 1.5,
                py: 1,
                transition: 'background 0.15s ease, box-shadow 0.15s ease',

                /*
                 * Active state styling:
                 * - Violet semi-transparent background
                 * - Violet left border acting as an indicator strip
                 * - Subtle glow shadow to lift the item
                 *
                 * Inactive state:
                 * - Transparent background
                 * - Hover shows a lighter tint with no glow
                 */
                ...(active
                  ? {
                      backgroundColor: 'rgba(108, 99, 255, 0.15)',
                      borderLeft: '3px solid',
                      borderColor: 'primary.main',
                      pl: '9px', // compensate left border so text stays aligned
                      boxShadow: 'inset 0 0 12px rgba(108, 99, 255, 0.08)',
                      '&:hover': {
                        backgroundColor: 'rgba(108, 99, 255, 0.2)',
                      },
                    }
                  : {
                      backgroundColor: 'transparent',
                      borderLeft: '3px solid transparent',
                      pl: '9px',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      },
                    }),
              }}
            >
              {/* Icon — uses primary color when active, muted when inactive */}
              <ListItemIcon
                sx={{
                  minWidth: 32,
                  color: active ? 'primary.main' : 'text.secondary',
                  transition: 'color 0.15s ease',
                }}
              >
                {link.icon}
              </ListItemIcon>

              {/* Label */}
              <ListItemText
                primary={link.label}
                primaryTypographyProps={{
                  variant: 'body2',
                  fontWeight: active ? 700 : 400,
                  color: active ? 'text.primary' : 'text.secondary',
                  sx: { transition: 'font-weight 0.1s ease, color 0.15s ease' },
                }}
              />
            </ListItemButton>
          )
        })}
      </List>

      {/* ── Sidebar Footer ──────────────────────────────────────────────── */}
      {/* Version label — useful during development, harmless in production */}
      <Box sx={{ p: 2, mt: 'auto' }}>
        <Typography
          variant="caption"
          sx={{ color: 'text.secondary', opacity: 0.35, display: 'block', textAlign: 'center' }}
        >
          PranayBank v1.0
        </Typography>
      </Box>
    </Box>
  )
}

export default Sidebar

import { NavLink, useLocation } from 'react-router-dom'
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Divider,
} from '@mui/material'
import DashboardIcon from '@mui/icons-material/Dashboard'
import ListAltIcon from '@mui/icons-material/ListAlt'
import BarChartIcon from '@mui/icons-material/BarChart'
import ShieldIcon from '@mui/icons-material/Shield'

const navItems = [
  { label: 'Dashboard', to: '/dashboard', icon: <DashboardIcon /> },
  { label: 'Applications', to: '/dashboard/applications', icon: <ListAltIcon /> },
  { label: 'Analytics', to: '/dashboard/analytics', icon: <BarChartIcon /> },
]

export default function Sidebar() {
  const location = useLocation()

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 240,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 240,
          boxSizing: 'border-box',
          top: '64px',
          height: 'calc(100% - 64px)',
          background: 'rgba(10, 14, 26, 0.9)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(108, 99, 255, 0.12)',
          overflowX: 'hidden',
        },
      }}
    >
      {/* Admin label */}
      <Box sx={{ px: 2.5, pt: 2.5, pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ShieldIcon sx={{ fontSize: '0.9rem', color: '#6C63FF' }} />
          <Typography
            variant="overline"
            sx={{ color: 'text.secondary', fontSize: '0.65rem', letterSpacing: '0.12em', lineHeight: 1 }}
          >
            Admin Panel
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(108, 99, 255, 0.1)', mx: 1.5, mb: 1 }} />

      <List sx={{ px: 1 }}>
        {navItems.map(({ label, to, icon }) => {
          const isActive = location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to))
          return (
            <ListItem key={to} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                id={`sidebar-${label.toLowerCase()}`}
                component={NavLink}
                to={to}
                sx={{
                  borderRadius: '10px',
                  py: 1.1,
                  px: 1.5,
                  transition: 'all 0.2s ease',
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(108, 99, 255, 0.2) 0%, rgba(75, 68, 204, 0.1) 100%)'
                    : 'transparent',
                  border: isActive ? '1px solid rgba(108, 99, 255, 0.3)' : '1px solid transparent',
                  '&:hover': {
                    background: 'rgba(108, 99, 255, 0.1)',
                    border: '1px solid rgba(108, 99, 255, 0.2)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 36,
                    color: isActive ? '#6C63FF' : 'text.secondary',
                    '& svg': { fontSize: '1.25rem' },
                  }}
                >
                  {icon}
                </ListItemIcon>
                <ListItemText
                  primary={label}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? '#E8EAED' : '#8B9CB8',
                  }}
                />
                {/* Active indicator */}
                {isActive && (
                  <Box
                    sx={{
                      width: 3,
                      height: 20,
                      borderRadius: 2,
                      background: '#6C63FF',
                      boxShadow: '0 0 8px rgba(108, 99, 255, 0.6)',
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>
    </Drawer>
  )
}

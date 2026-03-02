import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Auth0Provider } from '@auth0/auth0-react'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import App from './App.jsx'
import './index.css'

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#6C63FF',
      light: '#9B94FF',
      dark: '#4B44CC',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#FF6584',
      light: '#FF93A8',
      dark: '#CC3D5A',
    },
    background: {
      default: '#0A0E1A',
      paper: '#0F1629',
    },
    surface: {
      main: '#141B2D',
    },
    text: {
      primary: '#E8EAED',
      secondary: '#8B9CB8',
    },
    success: {
      main: '#00D4AA',
    },
    warning: {
      main: '#FFB020',
    },
    error: {
      main: '#FF4D6A',
    },
    divider: 'rgba(108, 99, 255, 0.15)',
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, letterSpacing: '-0.01em' },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { fontWeight: 600, textTransform: 'none', letterSpacing: '0.01em' },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(108, 99, 255, 0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(0, 212, 170, 0.05) 0%, transparent 50%)',
          backgroundAttachment: 'fixed',
        },
        '::-webkit-scrollbar': { width: '6px' },
        '::-webkit-scrollbar-track': { background: '#0A0E1A' },
        '::-webkit-scrollbar-thumb': { background: '#2A3454', borderRadius: '3px' },
        '::-webkit-scrollbar-thumb:hover': { background: '#6C63FF' },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '10px 24px',
          transition: 'all 0.2s ease',
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #6C63FF 0%, #4B44CC 100%)',
          boxShadow: '0 4px 24px rgba(108, 99, 255, 0.35)',
          '&:hover': {
            boxShadow: '0 6px 32px rgba(108, 99, 255, 0.55)',
            transform: 'translateY(-1px)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'rgba(15, 22, 41, 0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(108, 99, 255, 0.15)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        fullWidth: true,
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            '& fieldset': {
              borderColor: 'rgba(108, 99, 255, 0.25)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(108, 99, 255, 0.5)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#6C63FF',
            },
          },
        },
      },
    },
  },
})

const auth0Config = {
  domain: import.meta.env.VITE_AUTH0_DOMAIN || 'your-tenant.us.auth0.com',
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID || 'your_client_id',
  authorizationParams: {
    redirect_uri: window.location.origin,
    audience: import.meta.env.VITE_AUTH0_AUDIENCE || 'https://api.pranaybank.com',
    scope: 'openid profile email',
  },
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Auth0Provider {...auth0Config}>
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ThemeProvider>
    </Auth0Provider>
  </StrictMode>,
)
